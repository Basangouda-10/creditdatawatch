
import requests
import json

BASE = "http://localhost:8000"

print("Logging in as FINANCIAL user...")
login = requests.post(f"{BASE}/api/v1/auth/login", json={
    "email": "fin@test.com",
    "password": "Test@1234",
    "gstin": "22AAAAD0000A1Z5"
})

print(f"Login status: {login.status_code}")

token = login.json()['data']['user']['access_token']
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

print("\nFetching my-tasks for FINANCIAL role...")
response = requests.get(f"{BASE}/api/v1/workflow/my-tasks", headers=headers)

print(f"Response status: {response.status_code}")
print(f"Response: {json.dumps(response.json(), indent=2)}")
