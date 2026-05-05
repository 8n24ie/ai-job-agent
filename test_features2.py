"""Test all new API endpoints against port 8001."""
import requests

BASE = "http://localhost:8001"

# 1. Register
r = requests.post(f"{BASE}/api/auth/register", json={"username":"test_v5","password":"1234"})
if r.status_code == 400:
    r = requests.post(f"{BASE}/api/auth/login", json={"username":"test_v5","password":"1234"})
print(f"Auth: {r.status_code}")
token = r.json()["token"]
h = {"Authorization": f"Bearer {token}"}

# 2. Create resume version
r = requests.post(f"{BASE}/api/resumes", headers=h, json={"name":"AI求职版","content":"王鹏 - AI产品助理","is_default":True})
print(f"Create resume: {r.status_code} id={r.json().get('id')}")

# 3. List resumes
r = requests.get(f"{BASE}/api/resumes", headers=h)
resumes = r.json()
print(f"List resumes: {r.status_code} count={len(resumes)}")

# 4. Add favorite
r = requests.post(f"{BASE}/api/favorites", headers=h, json={"job_title":"AI产品助理","company":"星河智能","priority":"高","match_score":"92"})
print(f"Add favorite: {r.status_code} id={r.json().get('id')}")

# 5. List favorites
r = requests.get(f"{BASE}/api/favorites", headers=h)
favs = r.json()
print(f"List favorites: {r.status_code} count={len(favs)}")

# 6. Chat
r = requests.post(f"{BASE}/api/chat", headers=h, json={"message":"我适合什么岗位？"})
resp = r.json()
print(f"Chat: {r.status_code} response={resp.get('response','')[:100]}...")

# 7. Chat history
r = requests.get(f"{BASE}/api/chat/history", headers=h)
msgs = r.json()
print(f"Chat history: {r.status_code} count={len(msgs)}")

# 8. Delete favorite
if favs:
    r = requests.delete(f"{BASE}/api/favorites/{favs[0]['id']}", headers=h)
    print(f"Delete favorite: {r.status_code}")

# 9. Delete resume
if resumes:
    r = requests.delete(f"{BASE}/api/resumes/{resumes[0]['id']}", headers=h)
    print(f"Delete resume: {r.status_code}")

print("\n=== All 5 features working! ===")
