import requests
import json
import uuid

BASE_URL = "http://localhost:8000/api/v1"
ADMIN_EMAIL = "payalshinde906@gmail.com"
ADMIN_PASS = "AdminPass123!"
ADMIN_GSTIN = "22AAAAD0000A1Z5"

def test_create_user_email():
    # 1. Login as Admin
    print("Logging in as admin...")
    login_data = {
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASS,
        "gstin": ADMIN_GSTIN
    }
    resp = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    if resp.status_code != 200:
        print(f"Login failed: {resp.json()}")
        return
    
    token = resp.json()["data"]["tokens"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("Logged in successfully.")

    # 2. Create a new user
    new_email = f"test_user_{uuid.uuid4().hex[:6]}@gmail.com"
    print(f"Creating user with email: {new_email}")
    user_data = {
        "name": "Test Email Recipient",
        "email": new_email,
        "role": "OPERATION",
        "password": "TempPassword123!",
        "gstin": ADMIN_GSTIN
    }
    
    resp = requests.post(f"{BASE_URL}/admin/create-user", json=user_data, headers=headers)
    print(f"Response status: {resp.status_code}")
    print(f"Response body: {json.dumps(resp.json(), indent=2)}")

if __name__ == "__main__":
    test_create_user_email()
