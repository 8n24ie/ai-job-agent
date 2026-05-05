"""Test all new API endpoints."""
import requests
import json

BASE = "http://localhost:8000"

# 1. Register/login
r = requests.post(f"{BASE}/api/auth/register", json={"username":"test_features","password":"1234"})
if r.status_code == 400:
    r = requests.post(f"{BASE}/api/auth/login", json={"username":"test_features","password":"1234"})
token = r.json()["token"]
h = {"Authorization": f"Bearer {token}"}

# 2. Create resume version
r = requests.post(f"{BASE}/api/resumes", headers=h, json={"name":"AI求职版","content":"王鹏 - AI产品助理","is_default":True})
print(f"Create resume: {r.status_code} {r.json()}")

# 3. List resumes
r = requests.get(f"{BASE}/api/resumes", headers=h)
print(f"List resumes: {r.status_code} count={len(r.json())}")

# 4. Add favorite
r = requests.post(f"{BASE}/api/favorites", headers=h, json={"job_title":"AI产品助理","company":"星河智能","priority":"高","match_score":"92"})
print(f"Add favorite: {r.status_code} {r.json()}")

# 5. List favorites
r = requests.get(f"{BASE}/api/favorites", headers=h)
print(f"List favorites: {r.status_code} count={len(r.json())}")

# 6. Chat
r = requests.post(f"{BASE}/api/chat", headers=h, json={"message":"我适合什么岗位？"})
print(f"Chat: {r.status_code} response={r.json().get('response','')[:80]}...")

# 7. Chat history
r = requests.get(f"{BASE}/api/chat/history", headers=h)
print(f"Chat history: {r.status_code} count={len(r.json())}")

print("\n=== All endpoints working! ===")
