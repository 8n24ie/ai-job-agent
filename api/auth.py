"""User authentication models and utilities — JWT + SQLite."""
from __future__ import annotations

import os
import secrets
import sqlite3
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional

import hashlib
import hmac
import jwt

DB_PATH = Path("data/users.sqlite3")
JWT_SECRET = os.getenv("JWT_SECRET", secrets.token_hex(32))
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_HOURS = 72


# ── Database ────────────────────────────────────────────────────────────────

def _conn():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_user_db():
    with _conn() as conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS users (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                username    TEXT UNIQUE NOT NULL,
                password    TEXT NOT NULL,
                resume_text TEXT DEFAULT '',
                created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS analysis_history (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id     INTEGER NOT NULL,
                mode        TEXT NOT NULL,           -- 'single' or 'batch'
                input_data  TEXT,                    -- JSON of input
                result_data TEXT,                    -- JSON of result
                created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            );
            CREATE TABLE IF NOT EXISTS resume_versions (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id     INTEGER NOT NULL,
                name        TEXT NOT NULL DEFAULT '默认简历',
                content     TEXT NOT NULL DEFAULT '',
                is_active   INTEGER DEFAULT 0,
                created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            );
            CREATE TABLE IF NOT EXISTS favorites (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id     INTEGER NOT NULL,
                job_title   TEXT NOT NULL,
                company     TEXT DEFAULT '',
                city        TEXT DEFAULT '',
                salary      TEXT DEFAULT '',
                jd_text     TEXT DEFAULT '',
                score       INTEGER DEFAULT 0,
                priority    TEXT DEFAULT '',
                notes       TEXT DEFAULT '',
                created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            );
            CREATE TABLE IF NOT EXISTS chat_messages (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id     INTEGER NOT NULL,
                role        TEXT NOT NULL,  -- 'user' or 'assistant'
                content     TEXT NOT NULL,
                created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            );
        """)
        # Ensure backward/forward compatibility: add columns that may be
        # expected by api/features.py (is_default, match_score, job_type)
        # and by the new auth helpers (is_active, score).
        _compat_columns = [
            ("resume_versions", "is_active",   "INTEGER DEFAULT 0"),
            ("resume_versions", "is_default",  "INTEGER DEFAULT 0"),
            ("favorites",       "score",       "INTEGER DEFAULT 0"),
            ("favorites",       "match_score", "TEXT DEFAULT ''"),
            ("favorites",       "job_type",    "TEXT DEFAULT ''"),
        ]
        for table, col, col_type in _compat_columns:
            try:
                conn.execute(f"ALTER TABLE {table} ADD COLUMN {col} {col_type}")
            except sqlite3.OperationalError:
                pass  # column already exists
        conn.commit()


# ── Password hashing ────────────────────────────────────────────────────────

def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    h = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 100000)
    return f"{salt}:{h.hex()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        salt, h = stored.split(":", 1)
        check = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 100000)
        return hmac.compare_digest(check.hex(), h)
    except Exception:
        return False


# ── JWT tokens ──────────────────────────────────────────────────────────────

def create_token(user_id: int, username: str) -> str:
    payload = {
        "sub": str(user_id),
        "username": username,
        "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRE_HOURS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> Optional[dict]:
    try:
        data = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        data["sub"] = int(data["sub"])
        return data
    except jwt.PyJWTError:
        return None


# ── User CRUD ───────────────────────────────────────────────────────────────

def create_user(username: str, password: str) -> dict:
    init_user_db()
    with _conn() as conn:
        try:
            conn.execute(
                "INSERT INTO users (username, password) VALUES (?, ?)",
                (username, hash_password(password)),
            )
            conn.commit()
            row = conn.execute("SELECT id, username, created_at FROM users WHERE username = ?", (username,)).fetchone()
            return dict(row)
        except sqlite3.IntegrityError:
            raise ValueError("用户名已存在")


def authenticate_user(username: str, password: str) -> Optional[dict]:
    init_user_db()
    with _conn() as conn:
        row = conn.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()
        if row and verify_password(password, row["password"]):
            return {"id": row["id"], "username": row["username"]}
        return None


def get_user(user_id: int) -> Optional[dict]:
    with _conn() as conn:
        row = conn.execute("SELECT id, username, resume_text, created_at FROM users WHERE id = ?", (user_id,)).fetchone()
        return dict(row) if row else None


def update_resume(user_id: int, resume_text: str):
    with _conn() as conn:
        conn.execute("UPDATE users SET resume_text = ? WHERE id = ?", (resume_text, user_id))
        conn.commit()


# ── Analysis history ────────────────────────────────────────────────────────

def save_analysis(user_id: int, mode: str, input_data: dict, result_data: dict):
    init_user_db()
    import json
    with _conn() as conn:
        conn.execute(
            "INSERT INTO analysis_history (user_id, mode, input_data, result_data) VALUES (?, ?, ?, ?)",
            (user_id, mode, json.dumps(input_data, ensure_ascii=False), json.dumps(result_data, ensure_ascii=False)),
        )
        conn.commit()


def get_history(user_id: int, limit: int = 20) -> list:
    init_user_db()
    import json
    with _conn() as conn:
        rows = conn.execute(
            "SELECT id, mode, input_data, result_data, created_at FROM analysis_history WHERE user_id = ? ORDER BY created_at DESC LIMIT ?",
            (user_id, limit),
        ).fetchall()
        result = []
        for r in rows:
            d = dict(r)
            d["input_data"] = json.loads(d["input_data"]) if d["input_data"] else None
            d["result_data"] = json.loads(d["result_data"]) if d["result_data"] else None
            result.append(d)
        return result


# ── Resume Versions ─────────────────────────────────────────────────────────

def save_resume_version(user_id: int, name: str, content: str, is_active: bool = False) -> int:
    """Create a new resume version. Returns the new row id."""
    init_user_db()
    with _conn() as conn:
        active_val = 1 if is_active else 0
        if is_active:
            conn.execute(
                "UPDATE resume_versions SET is_active = 0, is_default = 0 WHERE user_id = ?",
                (user_id,),
            )
        cur = conn.execute(
            "INSERT INTO resume_versions (user_id, name, content, is_active, is_default) VALUES (?, ?, ?, ?, ?)",
            (user_id, name, content, active_val, active_val),
        )
        conn.commit()
        return cur.lastrowid


def get_resume_versions(user_id: int) -> list:
    """List all resume versions for a user."""
    init_user_db()
    with _conn() as conn:
        rows = conn.execute(
            "SELECT * FROM resume_versions WHERE user_id = ? ORDER BY is_active DESC, updated_at DESC",
            (user_id,),
        ).fetchall()
        return [dict(r) for r in rows]


def get_active_resume(user_id: int) -> Optional[dict]:
    """Get the active resume version, or None."""
    init_user_db()
    with _conn() as conn:
        row = conn.execute(
            "SELECT * FROM resume_versions WHERE user_id = ? AND (is_active = 1 OR is_default = 1) LIMIT 1",
            (user_id,),
        ).fetchone()
        return dict(row) if row else None


def update_resume_version(version_id: int, name: Optional[str] = None, content: Optional[str] = None, is_active: Optional[bool] = None) -> Optional[dict]:
    """Update fields of a resume version. Returns updated row or None."""
    init_user_db()
    with _conn() as conn:
        existing = conn.execute(
            "SELECT * FROM resume_versions WHERE id = ?", (version_id,)
        ).fetchone()
        if not existing:
            return None
        new_name = name if name is not None else existing["name"]
        new_content = content if content is not None else existing["content"]
        if is_active is not None:
            active_val = 1 if is_active else 0
            if is_active:
                uid = existing["user_id"]
                conn.execute(
                    "UPDATE resume_versions SET is_active = 0, is_default = 0 WHERE user_id = ?",
                    (uid,),
                )
            conn.execute(
                "UPDATE resume_versions SET is_active = ?, is_default = ? WHERE id = ?",
                (active_val, active_val, version_id),
            )
        conn.execute(
            "UPDATE resume_versions SET name = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            (new_name, new_content, version_id),
        )
        conn.commit()
        row = conn.execute("SELECT * FROM resume_versions WHERE id = ?", (version_id,)).fetchone()
        return dict(row)


def delete_resume_version(version_id: int) -> bool:
    """Delete a resume version. Returns True if deleted."""
    init_user_db()
    with _conn() as conn:
        cur = conn.execute("DELETE FROM resume_versions WHERE id = ?", (version_id,))
        conn.commit()
        return cur.rowcount > 0


def set_active_resume(user_id: int, version_id: int) -> bool:
    """Set one version active, unset all others. Returns False if not found."""
    init_user_db()
    with _conn() as conn:
        target = conn.execute(
            "SELECT * FROM resume_versions WHERE id = ? AND user_id = ?",
            (version_id, user_id),
        ).fetchone()
        if not target:
            return False
        conn.execute(
            "UPDATE resume_versions SET is_active = 0, is_default = 0 WHERE user_id = ?",
            (user_id,),
        )
        conn.execute(
            "UPDATE resume_versions SET is_active = 1, is_default = 1 WHERE id = ? AND user_id = ?",
            (version_id, user_id),
        )
        conn.commit()
        return True


# ── Favorites ───────────────────────────────────────────────────────────────

def add_favorite(user_id: int, job_data: dict) -> int:
    """Add a job to favorites. *job_data* keys: job_title, company, city,
    salary, jd_text, score, priority, notes.  Returns the new row id."""
    init_user_db()
    score_val = int(job_data.get("score", 0) or 0)
    match_score_str = str(job_data.get("score", job_data.get("match_score", "")))
    with _conn() as conn:
        cur = conn.execute(
            """INSERT INTO favorites
               (user_id, job_title, company, city, salary, jd_text, score, match_score, priority, notes, job_type)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                user_id,
                job_data.get("job_title", ""),
                job_data.get("company", ""),
                job_data.get("city", ""),
                job_data.get("salary", ""),
                job_data.get("jd_text", ""),
                score_val,
                match_score_str,
                job_data.get("priority", ""),
                job_data.get("notes", ""),
                job_data.get("job_type", ""),
            ),
        )
        conn.commit()
        return cur.lastrowid


def get_favorites(user_id: int) -> list:
    """List all favorites for a user, newest first."""
    init_user_db()
    with _conn() as conn:
        rows = conn.execute(
            "SELECT * FROM favorites WHERE user_id = ? ORDER BY created_at DESC",
            (user_id,),
        ).fetchall()
        return [dict(r) for r in rows]


def delete_favorite(fav_id: int) -> bool:
    """Delete a favorite by id. Returns True if deleted."""
    init_user_db()
    with _conn() as conn:
        cur = conn.execute("DELETE FROM favorites WHERE id = ?", (fav_id,))
        conn.commit()
        return cur.rowcount > 0


# ── Chat Messages ───────────────────────────────────────────────────────────

def add_chat_message(user_id: int, role: str, content: str) -> int:
    """Persist a chat message. *role* is 'user' or 'assistant'. Returns row id."""
    init_user_db()
    with _conn() as conn:
        cur = conn.execute(
            "INSERT INTO chat_messages (user_id, role, content) VALUES (?, ?, ?)",
            (user_id, role, content),
        )
        conn.commit()
        return cur.lastrowid


def get_chat_history(user_id: int, limit: int = 50) -> list:
    """Return recent chat messages, oldest first."""
    init_user_db()
    with _conn() as conn:
        rows = conn.execute(
            "SELECT * FROM chat_messages WHERE user_id = ? ORDER BY id DESC LIMIT ?",
            (user_id, limit),
        ).fetchall()
        return [dict(r) for r in reversed(rows)]


def clear_chat_history(user_id: int) -> int:
    """Delete all chat messages for a user. Returns count of deleted rows."""
    init_user_db()
    with _conn() as conn:
        cur = conn.execute(
            "DELETE FROM chat_messages WHERE user_id = ?",
            (user_id,),
        )
        conn.commit()
        return cur.rowcount
