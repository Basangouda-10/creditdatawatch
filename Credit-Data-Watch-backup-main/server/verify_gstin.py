
import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

def test_gstin_workflow():
    # 1. Login as Admin
    print("\n--- 1. Login as Admin ---")
    login_data = {
        "email": "payalshinde906@gmail.com",
        "password": "AdminPass123!",
        "gstin": "22AAAAD0000A1Z5"
    }
    response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    if response.status_code != 200:
        print(f"Login failed: {response.text}")
        return
    admin_token = response.json()["data"]["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    print("Admin login successful")

    # 2. Basic GSTIN Check
    print("\n--- 2. Basic GSTIN Check ---")
    test_gstin = "27ABCDE1234F1Z5"
    check_res = requests.post(
        f"{BASE_URL}/gstin/check",
        headers=admin_headers,
        json={"gstin": test_gstin}
    )
    print(f"Check result: {json.dumps(check_res.json(), indent=2)}")

    # 3. Request Full Report
    print("\n--- 3. Request Full Report ---")
    request_res = requests.post(
        f"{BASE_URL}/gstin/request-report",
        headers=admin_headers,
        json={
            "company_name": "Test Company",
            "gstin": test_gstin
        }
    )
    print(f"Request result: {json.dumps(request_res.json(), indent=2)}")
    request_id = request_res.json()["data"]["request_id"]

    # 4. Login as Legal
    print("\n--- 4. Login as Legal ---")
    legal_login = {
        "email": "legal@example.com",
        "password": "LegalPassword123",
        "gstin": "27AAAAA0000A1Z5"
    }
    response = requests.post(f"{BASE_URL}/auth/login", json=legal_login)
    legal_token = response.json()["data"]["access_token"]
    legal_headers = {"Authorization": f"Bearer {legal_token}"}
    print("Legal login successful")

    # 5. Get Pending Requests (Legal)
    print("\n--- 5. Get Pending Requests (Legal) ---")
    requests_res = requests.get(f"{BASE_URL}/gstin/requests", headers=legal_headers)
    print(f"Pending requests: {len(requests_res.json()['data'])}")

    # 6. Submit Report (Legal)
    print("\n--- 6. Submit Report (Legal) ---")
    report_res = requests.post(
        f"{BASE_URL}/gstin/report",
        headers=legal_headers,
        json={
            "request_id": request_id,
            "risk_score": 85,
            "recommendation": "Highly Recommended",
            "legal_notes": "All documents verified and look good."
        }
    )
    print(f"Report submission result: {json.dumps(report_res.json(), indent=2)}")

    # 7. Check GSTIN again to see updated score
    print("\n--- 7. Verify Updated Score ---")
    check_res2 = requests.post(
        f"{BASE_URL}/gstin/check",
        headers=admin_headers,
        json={"gstin": test_gstin}
    )
    print(f"Updated check result: {json.dumps(check_res2.json(), indent=2)}")

if __name__ == "__main__":
    test_gstin_workflow()
