
import requests

BASE = "http://localhost:8000"

USERS = [
    ("usera.test@creditwatch.com", "Test@1234", "22AAAAD0000A1Z5", "COMPANY_ADMIN"),
    ("ops.test@creditwatch.com", "Test@1234", "22AAAAD0000A1Z5", "OPERATION"),
    ("fin.test@creditwatch.com", "Test@1234", "22AAAAD0000A1Z5", "FINANCIAL"),
    ("legal.test@creditwatch.com", "Test@1234", "22AAAAD0000A1Z5", "LEGAL"),
    ("master.test@creditwatch.com", "Test@1234", "22AAAAD0000A1Z5", "MASTER_ADMIN"),
]

tokens = {}
print("=" * 60)
print("LOGIN TESTS FOR ALL ROLES")
print("=" * 60)

for email, password, gstin, expected_role in USERS:
    r = requests.post(f"{BASE}/api/v1/auth/login", json={
        "email": email,
        "password": password,
        "gstin": gstin
    })
    
    if r.status_code == 200:
        data = r.json()
        
        token = data.get('data', {}).get('user', {}).get('access_token')
        role_in_response = data.get('data', {}).get('user', {}).get('role', 'NOT FOUND')
        
        tokens[expected_role] = token
        
        status = "[OK] PASS" if token else "[FAIL] - No token"
        print(f"\n{status} | {expected_role}")
        print(f"  Email: {email}")
        print(f"  Role in response: {role_in_response}")
        if token:
            print(f"  Token: YES - {token[:50]}...")
    else:
        tokens[expected_role] = None
        print(f"\n[FAIL] | {expected_role}")
        print(f"  Email: {email}")
        print(f"  HTTP {r.status_code}: {r.text[:300]}")

print("\n" + "=" * 60)
print("TESTING /user/profile FOR EACH ROLE")
print("=" * 60)

for role, token in tokens.items():
    if not token:
        print(f"\n[SKIP] | {role} - no token")
        continue
    
    r = requests.get(f"{BASE}/api/v1/user/profile", 
        headers={"Authorization": f"Bearer {token}"})
    
    if r.status_code == 200:
        me = r.json()
        profile_role = me.get('data', {}).get('role') or me.get('role', 'NOT FOUND')
        print(f"\n[OK] PASS | {role}")
        print(f"  Profile role: {profile_role}")
        print(f"  Email: {me.get('data', {}).get('email') or me.get('email', 'NOT FOUND')}")
    else:
        print(f"\n[FAIL] | {role}")
        print(f"  HTTP {r.status_code}: {r.text[:200]}")

print("\n" + "=" * 60)
print("TESTING WORKFLOW/MY-TASKS FOR EACH ROLE")
print("=" * 60)

for role, token in tokens.items():
    if not token:
        print(f"\n[SKIP] | {role}")
        continue
    
    r = requests.get(f"{BASE}/api/v1/workflow/my-tasks", 
        headers={"Authorization": f"Bearer {token}"})
    
    if r.status_code == 200:
        data = r.json()
        tasks = data.get('data', {})
        print(f"\n[OK] PASS | {role}")
        print(f"  Tasks keys: {list(tasks.keys())}")
        for key, val in tasks.items():
            if isinstance(val, list):
                print(f"  {key}: {len(val)} items")
            elif isinstance(val, dict):
                print(f"  {key}: {val}")
    else:
        print(f"\n[FAIL] | {role}")
        print(f"  HTTP {r.status_code}: {r.text[:300]}")

