"""Debug: test token flow with fresh user."""
import requests

BASE = "http://localhost:8001"

# Login with existing user
r = requests.post(f"{BASE}/api/auth/login", json={"username":"debug_user","password":"1234"})
print(f"Login: {r.status_code}")

if r.status_code == 200:
    data = r.json()
    token = data["token"]
    print(f"Token: {token[:30]}...")
    
    h = {"Authorization": f"Bearer {token}"}
    r2 = requests.get(f"{BASE}/api/resumes", headers=h)
    print(f"Resumes: {r2.status_code} {r2.text[:200]}")
    
    r3 = requests.post(f"{BASE}/api/favorites", headers=h, json={"job_title":"测试岗位","company":"测试公司"})
    print(f"Add favorite: {r3.status_code} {r3.text[:200]}")
