#!/usr/bin/env python3
"""Quick smoke test for api.features imports."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import api.features as f

expected = [
    "init_feature_tables",
    # Resume versions
    "create_resume", "list_resumes", "get_resume",
    "update_resume_version", "delete_resume", "set_default_resume",
    # Favorites
    "add_favorite", "list_favorites", "remove_favorite", "update_favorite_notes",
    # Comparison
    "compare_jobs",
    # Chat
    "save_message", "get_chat_history", "clear_chat_history",
    # History
    "delete_history_item", "get_history_detail",
]

missing = [name for name in expected if not hasattr(f, name)]
if missing:
    print(f"MISSING: {missing}")
    sys.exit(1)
else:
    print(f"All {len(expected)} functions found OK")
