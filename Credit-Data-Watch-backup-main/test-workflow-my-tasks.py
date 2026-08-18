
import requests
import json

BASE_URL = "http://127.0.0.1:8000/api/v1"

# Step 1: Log in as Master Admin
login_payload = {"email": "master.test@creditwatch.com", "password": "Test@1234", "gstin": "22AAAAD0000A1Z5"}
login_response = requests.post(f"{BASE_URL}/auth/login", json=login_payload)

print("Login response status:", login_response.status_code)
print("Login response:", login_response.text)

if login_response.status_code == 200:
    login_data = login_response.json()
    token = login_data["data"]["user"]["access_token"]
    print("Access token obtained!")
    
    # Step 2: Call /workflow/my-tasks
    headers = {"Authorization": f"Bearer {token}"}
    workflow_response = requests.get(f"{BASE_URL}/workflow/my-tasks", headers=headers)
    
    print("\nWorkflow my-tasks status:", workflow_response.status_code)
    print("Workflow my-tasks response:", json.dumps(workflow_response.json(), indent=2))
else:
    print("Failed to log in!")
