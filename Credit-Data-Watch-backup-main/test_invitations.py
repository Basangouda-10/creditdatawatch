
import requests

BASE_URL = "http://localhost:3001/api/v1"

# First, let's login to get a token (we need to use a valid user!)
login_res = requests.post(f"{BASE_URL}/auth/login", json={
    "email": "payalshinde906@gmail.com",
    "password": "Test@123",
    "gstin": "22AAAAD0000A1Z5"
})

print("Login response status:", login_res.status_code)
print("Login response:", login_res.text)

if login_res.ok:
    token = login_res.json().get("data", {}).get("access_token")
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test GET /admin/invitations
    print("\nTesting GET /admin/invitations...")
    res = requests.get(f"{BASE_URL}/admin/invitations", headers=headers)
    print("Status code:", res.status_code)
    print("Response:", res.text)
    
    # Test GET /admin/users
    print("\nTesting GET /admin/users...")
    res = requests.get(f"{BASE_URL}/admin/users", headers=headers)
    print("Status code:", res.status_code)
    print("Response:", res.text)
