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
        """)


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
        "sub": user_id,
        "username": username,
        "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRE_HOURS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
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
