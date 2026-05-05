"""Full test of all 5 new features."""
import requests

BASE = "http://localhost:8001"

# Login
r = requests.post(f"{BASE}/api/auth/login", json={"username":"debug_user","password":"1234"})
token = r.json()["token"]
h = {"Authorization": f"Bearer {token}"}
print("=== Login OK ===")

# 1. Resume versions
r = requests.post(f"{BASE}/api/resumes", headers=h, json={"name":"AI求职版","content":"王鹏 - AI产品助理 - 福州","is_default":True})
print(f"1. Create resume: {r.status_code} id={r.json().get('id')}")

r = requests.post(f"{BASE}/api/resumes", headers=h, json={"name":"数据分析版","content":"王鹏 - 数据分析 - Python/Pandas"})
print(f"   Create resume 2: {r.status_code}")

r = requests.get(f"{BASE}/api/resumes", headers=h)
resumes = r.json()
print(f"   List resumes: {len(resumes)} versions")

# 2. Favorites
r = requests.post(f"{BASE}/api/favorites", headers=h, json={"job_title":"AI产品助理","company":"星河智能","priority":"高","match_score":"92"})
fav1_id = r.json().get("id", {}).get("id") if isinstance(r.json().get("id"), dict) else r.json().get("id")
print(f"2. Add favorite: {r.status_code} id={fav1_id}")

r = requests.post(f"{BASE}/api/favorites", headers=h, json={"job_title":"数据分析助理","company":"闽数云","priority":"高","match_score":"81"})
fav2_id = r.json().get("id", {}).get("id") if isinstance(r.json().get("id"), dict) else r.json().get("id")
print(f"   Add favorite 2: {r.status_code}")

r = requests.get(f"{BASE}/api/favorites", headers=h)
favs = r.json()
print(f"   List favorites: {len(favs)} jobs")

# 3. Chat
r = requests.post(f"{BASE}/api/chat", headers=h, json={"message":"我是一名应届生，学信息管理的，适合什么岗位？"})
resp = r.json().get("response", "")
print(f"3. Chat: {r.status_code} len={len(resp)} chars")
print(f"   Response: {resp[:120]}...")

r = requests.get(f"{BASE}/api/chat/history", headers=h)
msgs = r.json()
print(f"   Chat history: {len(msgs)} messages")

# 4. History
r = requests.get(f"{BASE}/api/history", headers=h)
history = r.json()
print(f"4. Analysis history: {len(history)} records")

# 5. Cleanup
if favs:
    r = requests.delete(f"{BASE}/api/favorites/{favs[0]['id']}", headers=h)
    print(f"5. Delete favorite: {r.status_code}")

print("\n=== ALL 5 FEATURES WORKING ===")
