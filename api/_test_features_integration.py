#!/usr/bin/env python3
"""Integration test — exercises DB operations in api.features."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Use a temp DB so we don't pollute production data
import tempfile, shutil
from pathlib import Path
import api.auth as auth
tmpdir = tempfile.mkdtemp()
auth.DB_PATH = Path(os.path.join(tmpdir, "test.sqlite3"))

from api.features import (
    init_feature_tables,
    create_resume, list_resumes, get_resume, update_resume_version,
    delete_resume, set_default_resume,
    add_favorite, list_favorites, remove_favorite, update_favorite_notes,
    save_message, get_chat_history, clear_chat_history,
    delete_history_item, get_history_detail,
)

# Bootstrap tables
auth.init_user_db()
init_feature_tables()

# Create a user
user = auth.create_user("testuser", "password123")
uid = user["id"]

# --- Resume versions ---
r1 = create_resume(uid, "Full Resume", "Content A", is_default=True)
assert r1["name"] == "Full Resume" and r1["is_default"] == 1
r2 = create_resume(uid, "Short Resume", "Content B")
assert r2["is_default"] == 0
resumes = list_resumes(uid)
assert len(resumes) == 2
fetched = get_resume(r1["id"], uid)
assert fetched["content"] == "Content A"
updated = update_resume_version(r1["id"], uid, name="Updated Name")
assert updated["name"] == "Updated Name"
new_default = set_default_resume(r2["id"], uid)
assert new_default["is_default"] == 1
r1_refetch = get_resume(r1["id"], uid)
assert r1_refetch["is_default"] == 0
assert delete_resume(r2["id"], uid) is True
assert len(list_resumes(uid)) == 1

# --- Favorites ---
fav = add_favorite(uid, job_title="Engineer", company="Acme", city="NY", salary="100k", match_score="85", priority="高")
assert fav["job_title"] == "Engineer"
favs = list_favorites(uid)
assert len(favs) == 1
updated_fav = update_favorite_notes(fav["id"], uid, "Great fit!")
assert updated_fav["notes"] == "Great fit!"
assert remove_favorite(fav["id"], uid) is True
assert len(list_favorites(uid)) == 0

# --- Chat messages ---
m1 = save_message(uid, "user", "Hello")
m2 = save_message(uid, "assistant", "Hi there!")
history = get_chat_history(uid)
assert len(history) == 2
assert history[0]["role"] == "user" and history[1]["role"] == "assistant"
cleared = clear_chat_history(uid)
assert cleared == 2
assert len(get_chat_history(uid)) == 0

# --- Enhanced history ---
auth.save_analysis(uid, "single", {"jd": "test"}, {"result": "ok"})
auth.save_analysis(uid, "batch", {"jd": "test2"}, {"result": "ok2"})
items = auth.get_history(uid)
assert len(items) == 2
detail = get_history_detail(items[0]["id"], uid)
assert detail is not None and detail["result_data"]["result"] == "ok"
assert delete_history_item(items[0]["id"], uid) is True
assert len(auth.get_history(uid)) == 1

# Cleanup
shutil.rmtree(tmpdir)
print("All integration tests passed!")
