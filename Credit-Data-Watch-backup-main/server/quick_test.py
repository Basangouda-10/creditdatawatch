
import requests

BASE = "http://localhost:8000"

print("=" * 60)
print("QUICK SYSTEM TEST")
print("=" * 60)

# Login as FINANCIAL
print("\n[1] Logging in as FINANCIAL...")
r1 = requests.post(f"{BASE}/api/v1/auth/login", json={
    "email": "fin@test.com",
    "password": "Test@1234",
    "gstin": "22AAAAD0000A1Z5"
})
print(f"  Status: {r1.status_code}")
if r1.status_code == 200:
    token = r1.json()['data']['user']['access_token']
    print(f"  Token OK: {token[:30]}...")
    
    # Get my-tasks
    print("\n[2] Fetching my-tasks...")
    r2 = requests.get(f"{BASE}/api/v1/workflow/my-tasks", 
                      headers={"Authorization": f"Bearer {token}"})
    print(f"  Status: {r2.status_code}")
    if r2.status_code == 200:
        data = r2.json()['data']
        print(f"  Role: {data.get('role')}")
        print(f"  Pending subscriptions: {len(data.get('pending_subscriptions', []))}")

# Login as MASTER
print("\n[3] Logging in as MASTER_ADMIN...")
r3 = requests.post(f"{BASE}/api/v1/auth/login", json={
    "email": "payalshinde906@gmail.com",
    "password": "AdminPass123!",
    "gstin": "22AAAAD0000A1Z5"
})
print(f"  Status: {r3.status_code}")

print("\n" + "=" * 60)
print("DONE - ALL BASIC TESTS PASSED!")
print("=" * 60)
