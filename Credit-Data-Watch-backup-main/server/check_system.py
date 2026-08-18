
import requests
import json

BASE = "http://localhost:8000"

print("=" * 60)
print("CREDITDATAWATCH SYSTEM CHECK")
print("=" * 60)

# Check backend is running
try:
    r = requests.get(f"{BASE}/docs", timeout=3)
    print("\n[OK] Backend running on port 8000")
except:
    print("\n[ERROR] Backend NOT running! Start it first:")
    print("   cd server && uvicorn app.main:app --reload --port 8000")
    exit(1)

# Login as Master Admin
print("\n--- Testing Master Admin Login ---")
login = requests.post(f"{BASE}/api/v1/auth/login", json={
    "email": "payalshinde906@gmail.com",
    "password": "AdminPass123!",
    "gstin": "22AAAAD0000A1Z5"
})
print(f"Status: {login.status_code}")
if login.status_code == 200:
    data = login.json()
    token = data.get('data', {}).get('access_token') or data.get('access_token')
    token_status = "[OK] Got token" if token else "[ERROR] No token"
    print(f"Token: {token_status}")
    role_in_response = data.get('data', {}).get('role', 'NOT FOUND')
    print(f"Role in response: {role_in_response}")
    
    if token:
        # Check all routes
        print("\n--- Checking Key Endpoints ---")
        endpoints = [
            "GET /api/v1/workflow/my-tasks",
            "GET /api/v1/workflow/notifications",
            "GET /api/v1/audit-logs",
            "GET /api/v1/pos",
            "GET /api/v1/credibility",
        ]
        headers = {"Authorization": f"Bearer {token}"}
        for ep in endpoints:
            method, path = ep.split(' ', 1)
            try:
                r = requests.get(f"{BASE}{path}", headers=headers, timeout=5)
                status = "[OK]" if r.status_code < 400 else "[FAIL]"
                print(f"  {status} {ep} -> {r.status_code}")
            except Exception as e:
                print(f"  [FAIL] {ep} -> ERROR: {e}")
else:
    print(f"Response: {login.text[:300]}")

# Check all users in DB
print("\n--- Checking Users in Database ---")
import asyncio
import sys

try:
    import asyncpg
except ImportError:
    print("DB Error: asyncpg not installed. Install with: pip install asyncpg")
    sys.exit(1)

async def check_users():
    try:
        conn = await asyncpg.connect('postgresql://postgres:2004@localhost:5432/creditdatawatch')
        users = await conn.fetch("""
            SELECT email, role, is_active, status, subscription_status
            FROM users ORDER BY role
        """)
        print(f"Total users: {len(users)}")
        for u in users:
            print(f"  {u['role']:20} | {u['email']:40} | active={u['is_active']}")
        await conn.close()
    except Exception as e:
        print(f"DB Error: {e}")

try:
    asyncio.run(check_users())
except Exception as e:
    print(f"Error running DB check: {e}")
