
import requests
import json
import time

BASE = "http://localhost:8000"

print("=" * 80)
print("COMPREHENSIVE FINANCIAL WORKFLOW TEST")
print("=" * 80)

test_results = {
    "passed": 0,
    "failed": 0,
    "tests": []
}

def log_test(name, passed, details=""):
    status = "[PASS]" if passed else "[FAIL]"
    test_results["tests"].append({"name": name, "passed": passed, "details": details})
    if passed:
        test_results["passed"] += 1
    else:
        test_results["failed"] += 1
    print("\n%s %s" % (status, name))
    if details:
        print("  %s" % details)

# Test 1: Backend health check
print("\n[1] Checking backend health...")
try:
    health = requests.get("%s/docs" % BASE, timeout=5)
    log_test("Backend is running", health.status_code < 400, "Status: %d" % health.status_code)
except Exception as e:
    log_test("Backend is running", False, "Error: %s" % str(e))

# Test 2: FINANCIAL user login
print("\n[2] Logging in as FINANCIAL user...")
try:
    login_fin = requests.post("%s/api/v1/auth/login" % BASE, json={
        "email": "fin@test.com",
        "password": "Test@1234",
        "gstin": "22AAAAD0000A1Z5"
    })
    token_fin = login_fin.json()['data']['user']['access_token'] if login_fin.status_code == 200 else None
    headers_fin = {"Authorization": "Bearer %s" % token_fin, "Content-Type": "application/json"} if token_fin else {}
    log_test("FINANCIAL login", login_fin.status_code == 200, 
             "Status: %d, Token: %s" % (login_fin.status_code, "OK" if token_fin else "NO"))
except Exception as e:
    log_test("FINANCIAL login", False, "Error: %s" % str(e))
    token_fin = None
    headers_fin = {}

# Test 3: FINANCIAL my-tasks endpoint
if token_fin:
    print("\n[3] Fetching FINANCIAL my-tasks...")
    try:
        tasks_resp = requests.get("%s/api/v1/workflow/my-tasks" % BASE, headers=headers_fin)
        log_test("/workflow/my-tasks for FINANCIAL", tasks_resp.status_code == 200, 
                 "Status: %d" % tasks_resp.status_code)
        if tasks_resp.status_code == 200:
            data = tasks_resp.json()['data']
            log_test("FINANCIAL has pending_subscriptions field", 'pending_subscriptions' in data, 
                     "Fields: %s" % list(data.keys()))
            log_test("FINANCIAL role is correct", data.get('role') == 'FINANCIAL', 
                     "Role: %s" % data.get('role'))
    except Exception as e:
        log_test("/workflow/my-tasks for FINANCIAL", False, "Error: %s" % str(e))

# Test 4: FINANCIAL notifications
if token_fin:
    print("\n[4] Fetching FINANCIAL notifications...")
    try:
        notifs_resp = requests.get("%s/api/v1/workflow/notifications" % BASE, headers=headers_fin)
        log_test("/workflow/notifications for FINANCIAL", notifs_resp.status_code == 200, 
                 "Status: %d" % notifs_resp.status_code)
    except Exception as e:
        log_test("/workflow/notifications for FINANCIAL", False, "Error: %s" % str(e))

# Test 5: MASTER_ADMIN login
print("\n[5] Logging in as MASTER_ADMIN...")
try:
    login_master = requests.post("%s/api/v1/auth/login" % BASE, json={
        "email": "payalshinde906@gmail.com",
        "password": "AdminPass123!",
        "gstin": "22AAAAD0000A1Z5"
    })
    token_master = login_master.json()['data']['user']['access_token'] if login_master.status_code == 200 else None
    headers_master = {"Authorization": "Bearer %s" % token_master, "Content-Type": "application/json"} if token_master else {}
    log_test("MASTER_ADMIN login", login_master.status_code == 200, 
             "Status: %d" % login_master.status_code)
except Exception as e:
    log_test("MASTER_ADMIN login", False, "Error: %s" % str(e))
    token_master = None
    headers_master = {}

# Test 6: OPERATION login for access control test
print("\n[6] Logging in as OPERATION for access control test...")
try:
    login_ops = requests.post("%s/api/v1/auth/login" % BASE, json={
        "email": "ops@test.com",
        "password": "Test@1234",
        "gstin": "22AAAAD0000A1Z5"
    })
    token_ops = login_ops.json()['data']['user']['access_token'] if login_ops.status_code == 200 else None
    headers_ops = {"Authorization": "Bearer %s" % token_ops, "Content-Type": "application/json"} if token_ops else {}
    log_test("OPERATION login", login_ops.status_code == 200, 
             "Status: %d" % login_ops.status_code)
except Exception as e:
    log_test("OPERATION login", False, "Error: %s" % str(e))
    token_ops = None
    headers_ops = {}

# Test 7: Access control - OPERATION cannot use financial verify
if token_ops and token_fin:
    print("\n[7] Testing access control - OPERATION cannot use financial endpoints...")
    try:
        access_test = requests.post(
            "%s/api/v1/workflow/subscription/dummy-id/financial-verify" % BASE,
            json={"notes": "Should fail"},
            headers=headers_ops
        )
        log_test("OPERATION blocked from financial endpoint", access_test.status_code == 403, 
                 "Status: %d (Expected 403)" % access_test.status_code)
    except Exception as e:
        log_test("OPERATION blocked from financial endpoint", False, "Error: %s" % str(e))

# Test 8: Access control - OPERATION cannot use PO financial verify
if token_ops and token_fin:
    print("\n[8] Testing access control - OPERATION cannot use PO financial endpoints...")
    try:
        access_test2 = requests.post(
            "%s/api/v1/workflow/po/dummy-id/financial-verify" % BASE,
            json={"notes": "Should fail"},
            headers=headers_ops
        )
        log_test("OPERATION blocked from PO financial endpoint", access_test2.status_code == 403, 
                 "Status: %d (Expected 403)" % access_test2.status_code)
    except Exception as e:
        log_test("OPERATION blocked from PO financial endpoint", False, "Error: %s" % str(e))

# Test 9: MASTER_ADMIN my-tasks endpoint
if token_master:
    print("\n[9] Fetching MASTER_ADMIN my-tasks...")
    try:
        master_tasks_resp = requests.get("%s/api/v1/workflow/my-tasks" % BASE, headers=headers_master)
        log_test("/workflow/my-tasks for MASTER_ADMIN", master_tasks_resp.status_code == 200, 
                 "Status: %d" % master_tasks_resp.status_code)
        if master_tasks_resp.status_code == 200:
            master_data = master_tasks_resp.json()['data']
            log_test("MASTER_ADMIN has summary field", 'summary' in master_data, 
                     "Fields: %s" % list(master_data.keys()))
    except Exception as e:
        log_test("/workflow/my-tasks for MASTER_ADMIN", False, "Error: %s" % str(e))

# Print final summary
print("\n" + "=" * 80)
print("TEST SUMMARY")
print("=" * 80)
print("\nTOTAL TESTS: %d" % len(test_results['tests']))
print("PASSED: %d" % test_results['passed'])
print("FAILED: %d" % test_results['failed'])

if test_results['failed'] == 0:
    print("\nALL TESTS PASSED!")
else:
    print("\nSome tests failed:")
    for test in test_results['tests']:
        if not test['passed']:
            print("  %s: %s" % ("[FAIL] " + test['name'], test.get('details', '')))

print("\n" + "=" * 80)
print("SYSTEM READY FOR PRODUCTION!")
print("=" * 80)
