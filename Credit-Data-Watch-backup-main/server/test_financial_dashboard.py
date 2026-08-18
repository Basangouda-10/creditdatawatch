
import requests
import json

BASE = "http://localhost:8000"

print("=" * 60)
print("FINANCIAL DASHBOARD FULL TEST")
print("=" * 60)

# 1. Login as FINANCIAL
print("\n[1] Logging in as FINANCIAL user...")
login_fin = requests.post(f"{BASE}/api/v1/auth/login", json={
    "email": "fin@test.com",
    "password": "Test@1234",
    "gstin": "22AAAAD0000A1Z5"
})

print(f"  Login status: {login_fin.status_code}")

if login_fin.status_code != 200:
    print("  [ERROR] FAILED: Could not log in as FINANCIAL")
    exit(1)

token_fin = login_fin.json()['data']['user']['access_token']
headers_fin = {"Authorization": f"Bearer {token_fin}", "Content-Type": "application/json"}

# 2. Get my-tasks
print("\n[2] Fetching /workflow/my-tasks for FINANCIAL...")
tasks_resp = requests.get(f"{BASE}/api/v1/workflow/my-tasks", headers=headers_fin)
print(f"  Status: {tasks_resp.status_code}")

if tasks_resp.status_code == 200:
    data = tasks_resp.json()['data']
    print(f"  [OK] Success!")
    print(f"  Role: {data['role']}")
    print(f"  Pending Subscriptions: {len(data.get('pending_subscriptions', []))}")
    print(f"  Pending PO Approvals: {len(data.get('pending_po_approvals', []))}")
    
    if data.get('pending_subscriptions'):
        print(f"\n  First subscription:")
        first_sub = data['pending_subscriptions'][0]
        print(f"    - Company: {first_sub['company_name']}")
        print(f"    - Plan: {first_sub['plan_name']}")
        print(f"    - Amount: {first_sub['amount']}")
        print(f"    - Status: {first_sub['status']}")

# 3. Get notifications
print("\n[3] Fetching /workflow/notifications...")
notifs_resp = requests.get(f"{BASE}/api/v1/workflow/notifications", headers=headers_fin)
print(f"  Status: {notifs_resp.status_code}")

if notifs_resp.status_code == 200:
    notifs_data = notifs_resp.json()
    print(f"  [OK] Success!")
    print(f"  Total notifications: {len(notifs_data.get('data', []))}")
    print(f"  Unread count: {notifs_data.get('unread_count', 0)}")

# 4. Try financial-only endpoint
print("\n[4] Testing subscription financial verify (using dummy id)...")
verify_resp = requests.post(
    f"{BASE}/api/v1/workflow/subscription/dummy-id/financial-verify",
    json={"notes": "Test from script"},
    headers=headers_fin
)
print(f"  Status: {verify_resp.status_code}")

# 5. Try PO financial verify (dummy id)
print("\n[5] Testing PO financial verify (using dummy id)...")
po_verify_resp = requests.post(
    f"{BASE}/api/v1/workflow/po/dummy-id/financial-verify",
    json={"notes": "Test from script"},
    headers=headers_fin
)
print(f"  Status: {po_verify_resp.status_code}")

# 6. Test as non-financial user (should be blocked)
print("\n[6] Testing access control: using OPERATION token for financial endpoint...")
login_ops = requests.post(f"{BASE}/api/v1/auth/login", json={
    "email": "ops@test.com",
    "password": "Test@1234",
    "gstin": "22AAAAD0000A1Z5"
})
token_ops = login_ops.json()['data']['user']['access_token']
headers_ops = {"Authorization": f"Bearer {token_ops}", "Content-Type": "application/json"}

access_test = requests.post(
    f"{BASE}/api/v1/workflow/po/dummy-id/financial-verify",
    json={"notes": "Should fail"},
    headers=headers_ops
)
print(f"  Status: {access_test.status_code}")
pass_fail = "[PASS]" if access_test.status_code == 403 else "[FAIL]"
print(f"  {pass_fail} - Expected 403, got {access_test.status_code}")

print("\n" + "=" * 60)
print("FINANCIAL DASHBOARD TEST COMPLETE")
print("=" * 60)
