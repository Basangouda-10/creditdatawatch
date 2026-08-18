
import requests
import json

BASE = "http://localhost:8000"

print("=" * 60)
print("CHECKING FINANCIAL USER TASKS")
print("=" * 60)

# Login as FINANCIAL
print("\n[1] Logging in as FINANCIAL...")
login_fin = requests.post(f"{BASE}/api/v1/auth/login", json={
    "email": "fin@test.com",
    "password": "Test@1234",
    "gstin": "22AAAAD0000A1Z5"
})
token = login_fin.json()['data']['user']['access_token']
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

# Get my-tasks
print("\n[2] Fetching /workflow/my-tasks...")
tasks_resp = requests.get(f"{BASE}/api/v1/workflow/my-tasks", headers=headers)
print(f"Status: {tasks_resp.status_code}")

if tasks_resp.status_code == 200:
    data = tasks_resp.json()['data']
    print("\n--- FULL TASKS RESPONSE ---")
    print(json.dumps(tasks_resp.json(), indent=2))

    print("\n--- TASKS SUMMARY ---")
    print(f"Role: {data.get('role')}")
    print(f"Pending subscriptions: {len(data.get('pending_subscriptions', []))}")
    print(f"Pending PO approvals: {len(data.get('pending_po_approvals', []))}")

print("\n" + "=" * 60)
