
import requests
import json
from datetime import datetime
import time

API_BASE = "http://127.0.0.1:8000/api/v1"

def log_step(step, message):
    timestamp = datetime.now().strftime("%H:%M:%S")
    print(f"[{timestamp}] {step}: {message}")

def login(email, password, gstin):
    url = f"{API_BASE}/auth/login"
    payload = {"email": email, "password": password, "gstin": gstin}
    response = requests.post(url, json=payload)
    response.raise_for_status()
    data = response.json()
    if data.get("success"):
        log_step("LOGIN", f"Successfully logged in as {email}")
        return data["data"]["tokens"]["access_token"]
    else:
        raise Exception(f"Login failed: {data}")

def get_headers(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

def test_business_check_flow():
    print("\n" + "=" * 60)
    print("TESTING BUSINESS CHECK REQUEST FLOW")
    print("=" * 60)

    # 1. Log in as COMPANY_ADMIN (User: mansvikadam2007@gmail.com)
    log_step("STEP 1", "Logging in as Company Admin")
    company_admin_token = login("mansvikadam2007@gmail.com", "TestPass123!", "22ASDFD0000A2Z5")

    # 2. Submit business check request
    log_step("STEP 2", "Submitting Business Check Request")
    submit_url = f"{API_BASE}/business-check/request"
    submit_payload = {
        "company_name": "Test Vendor Company",
        "gstin": "29AAACV4567E1Z5",
        "reason": "Checking vendor credibility for upcoming PO"
    }
    submit_response = requests.post(submit_url, json=submit_payload, headers=get_headers(company_admin_token))
    submit_response.raise_for_status()
    submit_data = submit_response.json()
    if submit_data.get("success"):
        log_step("SUCCESS", "Business check request submitted successfully!")
        request_id = submit_data["data"]["id"]
    else:
        raise Exception(f"Failed to submit request: {submit_data}")

    time.sleep(1)

    # 3. Log in as OPERATIONS User (shindepayal490@gmail.com)
    log_step("STEP 3", "Logging in as Operations User")
    ops_token = login("shindepayal490@gmail.com", "TestPass123!", "22AAAAD0000A1Z5")

    # 4. Get pending business checks for operations
    log_step("STEP 4", "Getting pending business checks")
    pending_ops_url = f"{API_BASE}/business-check/pending"
    pending_ops_response = requests.get(pending_ops_url, headers=get_headers(ops_token))
    pending_ops_response.raise_for_status()
    pending_ops_data = pending_ops_response.json()
    if pending_ops_data.get("success") and len(pending_ops_data["data"]) > 0:
        log_step("SUCCESS", "Operations user can see pending request!")
    else:
        raise Exception("Operations user cannot see pending request!")

    # 5. Operations reviews and forwards to Master Admin
    log_step("STEP 5", "Operations reviewing and forwarding to Master Admin")
    review_url = f"{API_BASE}/business-check/{request_id}/operations-review"
    review_payload = {
        "report": "Vendor looks good, financials stable",
        "verdict": "SAFE",
        "report_url": ""
    }
    review_response = requests.post(review_url, json=review_payload, headers=get_headers(ops_token))
    review_response.raise_for_status()
    review_data = review_response.json()
    if review_data.get("success"):
        log_step("SUCCESS", "Operations review completed! Request forwarded to Master Admin!")
    else:
        raise Exception(f"Failed to review: {review_data}")

    time.sleep(1)

    # 6. Log in as MASTER_ADMIN (payalshinde906@gmail.com)
    log_step("STEP 6", "Logging in as Master Admin")
    master_token = login("payalshinde906@gmail.com", "TestPass123!", "22AAAAD0000A1Z5")

    # 7. Get pending business checks for Master Admin
    log_step("STEP 7", "Getting pending business checks for Master Admin")
    pending_master_url = f"{API_BASE}/business-check/pending-master"
    pending_master_response = requests.get(pending_master_url, headers=get_headers(master_token))
    pending_master_response.raise_for_status()
    pending_master_data = pending_master_response.json()
    if pending_master_data.get("success") and len(pending_master_data["data"]) > 0:
        log_step("SUCCESS", "Master Admin can see pending request!")
    else:
        raise Exception("Master Admin cannot see pending request!")

    # 8. Master Admin approves and saves to network
    log_step("STEP 8", "Master Admin approving and saving to network")
    approve_url = f"{API_BASE}/business-check/{request_id}/master-approve"
    approve_payload = {
        "save_to_network": True,
        "notes": "Approved, added to Network Trust Intelligence"
    }
    approve_response = requests.post(approve_url, json=approve_payload, headers=get_headers(master_token))
    approve_response.raise_for_status()
    approve_data = approve_response.json()
    if approve_data.get("success"):
        log_step("SUCCESS", "Master Admin approval successful! Request completed!")
    else:
        raise Exception(f"Failed to approve: {approve_data}")

    print("\nBUSINESS CHECK FLOW TEST PASSED!\n")

if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("STARTING WORKFLOW TESTS")
    print("=" * 60)
    print(f"Testing with users:")
    print("- Company Admin: mansvikadam2007@gmail.com")
    print("- Operations: shindepayal490@gmail.com")
    print("- Financial: shindepayal296@gmail.com")
    print("- Legal: legal@test.com")
    print("- Master Admin: payalshinde906@gmail.com")

    try:
        test_business_check_flow()
        print("\n" + "=" * 60)
        print("ALL TESTS PASSED!")
        print("=" * 60)
    except Exception as e:
        print(f"\nTEST FAILED: {str(e)}")
        import traceback
        traceback.print_exc()

