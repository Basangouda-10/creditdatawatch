
import requests
import json

BASE = "http://localhost:8000"

print("=" * 60)
print("TESTING AUTH, PROFILE, AND SUBSCRIPTION ENDPOINTS")
print("=" * 60)

# Test user credentials
email = "payalshinde906@gmail.com"
password = "AdminPass123!"
gstin = "22AAAAD0000A1Z5"

print(f"\n[1] Logging in as {email}...")
login_resp = requests.post(f"{BASE}/api/v1/auth/login", json={
    "email": email,
    "password": password,
    "gstin": gstin
})

print(f"Login status: {login_resp.status_code}")
token = None

if login_resp.status_code == 200:
    data = login_resp.json()
    print(f"\nLogin response data keys: {list(data.keys())}")
    if data.get('data'):
        print(f"Login user data keys: {list(data['data'].keys())}")
        if data['data'].get('user'):
            print(f"Login user.user keys: {list(data['data']['user'].keys())}")
    token = data.get('data', {}).get('access_token') or data.get('data', {}).get('user', {}).get('access_token')
    print(f"\nToken obtained: {'YES' if token else 'NO'}")
    if token:
        print(f"Token starts with: {token[:50]}...")

headers = {}
if token:
    headers["Authorization"] = f"Bearer {token}"
    headers["Content-Type"] = "application/json"

print("\n[2] Fetching /user/profile...")
profile_resp = requests.get(f"{BASE}/api/v1/user/profile", headers=headers)
print(f"Profile status: {profile_resp.status_code}")
if profile_resp.status_code == 200:
    profile_data = profile_resp.json()
    print(f"\nProfile response:")
    print(json.dumps(profile_data, indent=2))

print("\n[3] Fetching /user/subscription...")
sub_resp = requests.get(f"{BASE}/api/v1/user/subscription", headers=headers)
print(f"Subscription status: {sub_resp.status_code}")
if sub_resp.status_code == 200:
    sub_data = sub_resp.json()
    print(f"\nSubscription response:")
    print(json.dumps(sub_data, indent=2))

print("\n" + "=" * 60)
print("TEST COMPLETED")
print("=" * 60)
