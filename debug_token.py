"""Debug: test token flow."""
import requests
import json

BASE = "http://localhost:8001"

# Register
r = requests.post(f"{BASE}/api/auth/register", json={"username":"debug_user","password":"1234"})
print(f"Register: {r.status_code}")
print(f"Response: {r.json()}")

if r.status_code == 200:
    data = r.json()
    token = data["token"]
    print(f"Token: {token[:30]}...")
    print(f"Token length: {len(token)}")
    
    # Test with token
    h = {"Authorization": f"Bearer {token}"}
    r2 = requests.get(f"{BASE}/api/resumes", headers=h)
    print(f"Resumes: {r2.status_code} {r2.text[:200]}")
    
    # Also try with explicit header
    r3 = requests.get(f"{BASE}/api/resumes", headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"})
    print(f"Resumes (explicit): {r3.status_code} {r3.text[:200]}")
