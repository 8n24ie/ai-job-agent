import sqlite3
from pathlib import Path
from typing import Iterable, Mapping

DB_PATH = Path("data/job_agent.sqlite3")


def init_db(db_path: Path = DB_PATH) -> None:
    db_path.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(db_path) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS job_results (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                job_title TEXT,
                match_score INTEGER,
                raw_json TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """
        )


def save_job_result(job_title: str, match_score: int, raw_json: str, db_path: Path = DB_PATH) -> None:
    init_db(db_path)
    with sqlite3.connect(db_path) as conn:
        conn.execute(
            "INSERT INTO job_results(job_title, match_score, raw_json) VALUES (?, ?, ?)",
            (job_title, match_score, raw_json),
        )
