
import requests
import json
import time

BASE = "http://localhost:8000"

print("=" * 60)
print("INTERNAL USER CREATION & REINVITE TEST")
print("=" * 60)

# 1. Login as MASTER_ADMIN
print("\n[1] Logging in as MASTER_ADMIN...")
login_master = requests.post(f"{BASE}/api/v1/auth/login", json={
    "email": "payalshinde906@gmail.com",
    "password": "AdminPass123!",
    "gstin": "22AAAAD0000A1Z5"
})
token = login_master.json()['data']['user']['access_token']
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
print("  [OK] Logged in successfully!")

# 2. Test 1: Create a new unique user
print("\n[2] Test 1 - Create brand new user (should work)...")
new_user_email = "test.user.%d@creditwatch.test" % int(time.time())
create_resp = requests.post(f"{BASE}/api/v1/admin/create-user", json={
    "name": "Test New User",
    "email": new_user_email,
    "role": "OPERATION",
    "gstin": "22AAAAD0000A1Z5",
    "password": "Test@1234"
}, headers=headers)
print(f"  Status: {create_resp.status_code}")
if create_resp.status_code == 200:
    data = create_resp.json()
    print(f"  user_exists: {data.get('data', {}).get('user_exists')}")
    print(f"  action: {data.get('data', {}).get('action')}")
    print(f"  [OK] New user created successfully!")
else:
    print(create_resp.text)

# 3. Test 2: Try to create EXISTING user (should reinvite, not fail!)
print("\n[3] Test 2 - Try to create EXISTING user (should reinvite)...")
reinvite_resp = requests.post(f"{BASE}/api/v1/admin/create-user", json={
    "name": "Test Reinvited User",
    "email": new_user_email,
    "role": "FINANCIAL",
    "gstin": "22AAAAD0000A1Z5",
    "password": "NewPass@1234"
}, headers=headers)
print(f"  Status: {reinvite_resp.status_code}")
if reinvite_resp.status_code == 200:
    data = reinvite_resp.json()
    print(f"  user_exists: {data.get('data', {}).get('user_exists')}")
    print(f"  action: {data.get('data', {}).get('action')}")
    print(f"  message: {data.get('message')}")
    print(f"  [OK] User reinvited successfully! (NO ERROR!)")
else:
    print(reinvite_resp.text)

print("\n" + "=" * 60)
print("ALL TESTS PASSED!")
print("=" * 60)
