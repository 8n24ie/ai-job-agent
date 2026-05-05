"""Extended features — resume versions, favorites, comparison, chat, history helpers."""
from __future__ import annotations

import json
import sqlite3
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

from api.auth import _conn, init_user_db

# ── Table Initialisation ─────────────────────────────────────────────────────

def init_feature_tables():
    """Create all feature tables. Safe to call multiple times."""
    with _conn() as conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS resume_versions (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id     INTEGER NOT NULL,
                name        TEXT NOT NULL,
                content     TEXT NOT NULL DEFAULT '',
                is_default  INTEGER NOT NULL DEFAULT 0,
                created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            );

            CREATE TABLE IF NOT EXISTS favorites (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id     INTEGER NOT NULL,
                job_title   TEXT NOT NULL DEFAULT '',
                company     TEXT NOT NULL DEFAULT '',
                city        TEXT NOT NULL DEFAULT '',
                salary      TEXT NOT NULL DEFAULT '',
                match_score TEXT NOT NULL DEFAULT '',
                priority    TEXT NOT NULL DEFAULT '',
                job_type    TEXT NOT NULL DEFAULT '',
                jd_text     TEXT NOT NULL DEFAULT '',
                notes       TEXT NOT NULL DEFAULT '',
                created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            );

            CREATE TABLE IF NOT EXISTS chat_messages (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id     INTEGER NOT NULL,
                role        TEXT NOT NULL,
                content     TEXT NOT NULL DEFAULT '',
                created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            );
        """)


# ── 1. Resume Version Management ────────────────────────────────────────────

def create_resume(user_id: int, name: str, content: str, is_default: bool = False) -> dict:
    init_feature_tables()
    with _conn() as conn:
        # If marking as default, clear other defaults first
        if is_default:
            conn.execute(
                "UPDATE resume_versions SET is_default = 0 WHERE user_id = ?",
                (user_id,),
            )
        cur = conn.execute(
            "INSERT INTO resume_versions (user_id, name, content, is_default) VALUES (?, ?, ?, ?)",
            (user_id, name, content, 1 if is_default else 0),
        )
        conn.commit()
        row = conn.execute(
            "SELECT * FROM resume_versions WHERE id = ?", (cur.lastrowid,)
        ).fetchone()
        return dict(row)


def list_resumes(user_id: int) -> list:
    init_feature_tables()
    with _conn() as conn:
        rows = conn.execute(
            "SELECT * FROM resume_versions WHERE user_id = ? ORDER BY is_default DESC, updated_at DESC",
            (user_id,),
        ).fetchall()
        return [dict(r) for r in rows]


def get_resume(resume_id: int, user_id: int) -> Optional[dict]:
    init_feature_tables()
    with _conn() as conn:
        row = conn.execute(
            "SELECT * FROM resume_versions WHERE id = ? AND user_id = ?",
            (resume_id, user_id),
        ).fetchone()
        return dict(row) if row else None


def update_resume_version(resume_id: int, user_id: int, name: Optional[str] = None, content: Optional[str] = None) -> Optional[dict]:
    init_feature_tables()
    with _conn() as conn:
        existing = conn.execute(
            "SELECT * FROM resume_versions WHERE id = ? AND user_id = ?",
            (resume_id, user_id),
        ).fetchone()
        if not existing:
            return None
        new_name = name if name is not None else existing["name"]
        new_content = content if content is not None else existing["content"]
        conn.execute(
            "UPDATE resume_versions SET name = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?",
            (new_name, new_content, resume_id, user_id),
        )
        conn.commit()
        row = conn.execute(
            "SELECT * FROM resume_versions WHERE id = ?", (resume_id,)
        ).fetchone()
        return dict(row)


def delete_resume(resume_id: int, user_id: int) -> bool:
    init_feature_tables()
    with _conn() as conn:
        cur = conn.execute(
            "DELETE FROM resume_versions WHERE id = ? AND user_id = ?",
            (resume_id, user_id),
        )
        conn.commit()
        return cur.rowcount > 0


def set_default_resume(resume_id: int, user_id: int) -> Optional[dict]:
    init_feature_tables()
    with _conn() as conn:
        target = conn.execute(
            "SELECT * FROM resume_versions WHERE id = ? AND user_id = ?",
            (resume_id, user_id),
        ).fetchone()
        if not target:
            return None
        conn.execute(
            "UPDATE resume_versions SET is_default = 0 WHERE user_id = ?",
            (user_id,),
        )
        conn.execute(
            "UPDATE resume_versions SET is_default = 1 WHERE id = ? AND user_id = ?",
            (resume_id, user_id),
        )
        conn.commit()
        row = conn.execute(
            "SELECT * FROM resume_versions WHERE id = ?", (resume_id,)
        ).fetchone()
        return dict(row)


# ── 2. Job Favorites ────────────────────────────────────────────────────────

def add_favorite(
    user_id: int,
    job_title: str = "",
    company: str = "",
    city: str = "",
    salary: str = "",
    match_score: str = "",
    priority: str = "",
    job_type: str = "",
    jd_text: str = "",
    notes: str = "",
) -> dict:
    init_feature_tables()
    with _conn() as conn:
        cur = conn.execute(
            """INSERT INTO favorites
               (user_id, job_title, company, city, salary, match_score, priority, job_type, jd_text, notes)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (user_id, job_title, company, city, salary, match_score, priority, job_type, jd_text, notes),
        )
        conn.commit()
        row = conn.execute("SELECT * FROM favorites WHERE id = ?", (cur.lastrowid,)).fetchone()
        return dict(row)


def list_favorites(user_id: int) -> list:
    init_feature_tables()
    with _conn() as conn:
        rows = conn.execute(
            "SELECT * FROM favorites WHERE user_id = ? ORDER BY created_at DESC",
            (user_id,),
        ).fetchall()
        return [dict(r) for r in rows]


def remove_favorite(favorite_id: int, user_id: int) -> bool:
    init_feature_tables()
    with _conn() as conn:
        cur = conn.execute(
            "DELETE FROM favorites WHERE id = ? AND user_id = ?",
            (favorite_id, user_id),
        )
        conn.commit()
        return cur.rowcount > 0


def update_favorite_notes(favorite_id: int, user_id: int, notes: str) -> Optional[dict]:
    init_feature_tables()
    with _conn() as conn:
        existing = conn.execute(
            "SELECT * FROM favorites WHERE id = ? AND user_id = ?",
            (favorite_id, user_id),
        ).fetchone()
        if not existing:
            return None
        conn.execute(
            "UPDATE favorites SET notes = ? WHERE id = ? AND user_id = ?",
            (notes, favorite_id, user_id),
        )
        conn.commit()
        row = conn.execute("SELECT * FROM favorites WHERE id = ?", (favorite_id,)).fetchone()
        return dict(row)


# ── 3. Job Comparison ───────────────────────────────────────────────────────

def compare_jobs(resume_text: str, job_a: dict, job_b: dict, client) -> dict:
    """Compare two job postings against the same resume.

    job_a / job_b should each contain at least a ``jd_text`` key (and
    optionally ``job_title``, ``company``, etc.).  *client* is an
    ``LLMClient`` instance used by ``match_resume``.
    """
    from src.resume_matcher import match_resume  # local import to avoid circular deps

    jd_a = job_a.get("jd_text", "")
    jd_b = job_b.get("jd_text", "")

    # Run match for each job — match_resume expects (resume_text, jd_analysis_dict_or_text, client)
    # We pass the jd_text directly; match_resume can handle raw text.
    result_a = match_resume(resume_text, jd_a, client)
    result_b = match_resume(resume_text, jd_b, client)

    return {
        "job_a": {
            "title": job_a.get("job_title", ""),
            "company": job_a.get("company", ""),
            "match_result": result_a,
        },
        "job_b": {
            "title": job_b.get("job_title", ""),
            "company": job_b.get("company", ""),
            "match_result": result_b,
        },
    }


# ── 4. AI Chat Assistant (message storage) ──────────────────────────────────

def save_message(user_id: int, role: str, content: str) -> dict:
    """Persist a chat message. *role* should be 'user' or 'assistant'."""
    init_feature_tables()
    with _conn() as conn:
        cur = conn.execute(
            "INSERT INTO chat_messages (user_id, role, content) VALUES (?, ?, ?)",
            (user_id, role, content),
        )
        conn.commit()
        row = conn.execute("SELECT * FROM chat_messages WHERE id = ?", (cur.lastrowid,)).fetchone()
        return dict(row)


def get_chat_history(user_id: int, limit: int = 50) -> list:
    """Return recent chat messages oldest-first."""
    init_feature_tables()
    with _conn() as conn:
        rows = conn.execute(
            """SELECT * FROM chat_messages
               WHERE user_id = ?
               ORDER BY id DESC
               LIMIT ?""",
            (user_id, limit),
        ).fetchall()
        # Reverse so oldest comes first
        return [dict(r) for r in reversed(rows)]


def clear_chat_history(user_id: int) -> int:
    """Delete all chat messages for a user. Returns count of deleted rows."""
    init_feature_tables()
    with _conn() as conn:
        cur = conn.execute(
            "DELETE FROM chat_messages WHERE user_id = ?",
            (user_id,),
        )
        conn.commit()
        return cur.rowcount


# ── 5. Enhanced History Helpers ─────────────────────────────────────────────

def delete_history_item(item_id: int, user_id: int) -> bool:
    init_user_db()
    with _conn() as conn:
        cur = conn.execute(
            "DELETE FROM analysis_history WHERE id = ? AND user_id = ?",
            (item_id, user_id),
        )
        conn.commit()
        return cur.rowcount > 0


def get_history_detail(item_id: int, user_id: int) -> Optional[dict]:
    init_user_db()
    with _conn() as conn:
        row = conn.execute(
            "SELECT * FROM analysis_history WHERE id = ? AND user_id = ?",
            (item_id, user_id),
        ).fetchone()
        if not row:
            return None
        d = dict(row)
        d["input_data"] = json.loads(d["input_data"]) if d["input_data"] else None
        d["result_data"] = json.loads(d["result_data"]) if d["result_data"] else None
        return d
