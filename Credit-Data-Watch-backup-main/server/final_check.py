
import requests

BASE = "http://localhost:8000"

def login(email, password, gstin):
    r = requests.post(f"{BASE}/api/v1/auth/login",
        json={"email": email, "password": password, "gstin": gstin})
    if r.status_code == 200:
        return r.json()['data']['user']['access_token']
    return None

master = login("payalshinde906@gmail.com", "AdminPass123!", "22AAAAD0000A1Z5")
ops = login("ops@test.com", "Test@1234", "22AAAAD0000A1Z5")
finance = login("fin@test.com", "Test@1234", "22AAAAD0000A1Z5")
legal = login("legal@test.com", "Test@1234", "22AAAAD0000A1Z5")

checks = [
    ("Master Admin login", master is not None),
    ("Operations login", ops is not None),
    ("Financial login", finance is not None),
    ("Legal login", legal is not None),
]

def check_endpoint(token, method, path, expected_status=200):
    try:
        headers = {"Authorization": f"Bearer {token}"} if token else {}
        r = requests.request(method, f"{BASE}{path}", headers=headers, timeout=5)
        return r.status_code == expected_status
    except:
        return False

# Backend checks
checks += [
    ("Master /workflow/my-tasks", check_endpoint(master, "GET", "/api/v1/workflow/my-tasks")),
    ("Operations /workflow/my-tasks", check_endpoint(ops, "GET", "/api/v1/workflow/my-tasks")),
    ("Financial /workflow/my-tasks", check_endpoint(finance, "GET", "/api/v1/workflow/my-tasks")),
    ("Legal /workflow/my-tasks", check_endpoint(legal, "GET", "/api/v1/workflow/my-tasks")),
    ("Notifications endpoint", check_endpoint(master, "GET", "/api/v1/workflow/notifications")),
    ("Audit logs for Master", check_endpoint(master, "GET", "/api/v1/audit-logs")),
    ("Audit logs for Ops", check_endpoint(ops, "GET", "/api/v1/audit-logs")),
    ("No token = 401", check_endpoint(None, "GET", "/api/v1/workflow/my-tasks", 401)),
    ("POs endpoint", check_endpoint(master, "GET", "/api/v1/purchase-orders")),
    ("Credibility endpoint", check_endpoint(master, "GET", "/api/v1/credibility")),
]

print("\n" + "=" * 60)
print("FINAL SYSTEM CHECK RESULTS")
print("=" * 60)

passed = 0
failed = 0
for name, result in checks:
    status = "[OK]" if result else "[FAIL]"
    print(f"  {status} {name}")
    if result:
        passed += 1
    else:
        failed += 1

print(f"\n{'=' * 60}")
print(f"TOTAL: {passed} PASSED | {failed} FAILED")
print("=" * 60)

if failed == 0:
    print("\nALL CHECKS PASSED! System is ready.")
else:
    print(f"\n{failed} checks failed. Fix them before proceeding.")
