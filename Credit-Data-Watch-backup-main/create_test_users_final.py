
import requests
BASE = 'http://localhost:8000'

# First login as master admin
master_login = requests.post(f'{BASE}/api/v1/auth/login', json={
    "email": "payalshinde906@gmail.com",
    "password": "AdminPass123!",
    "gstin": "22AAAAD0000A1Z5"
})
master_token = master_login.json()['data']['tokens']['access_token']
headers = {"Authorization": f"Bearer {master_token}"}
print("Master admin token obtained!")

test_users = [
    ("Operations Test", "ops.test@example.com", "Test@12345!", "OPERATION"),
    ("Financial Test", "fin.test@example.com", "Test@12345!", "FINANCIAL"),
    ("Legal Test", "legal.test@example.com", "Test@12345!", "LEGAL"),
]

for name, email, password, role in test_users:
    res = requests.post(f'{BASE}/api/v1/admin/create-user', json={
        "name": name,
        "email": email,
        "password": password,
        "role": role,
        "gstin": "22AAAAD0000A1Z5"
    }, headers=headers)
    print(f"Created {email}: {res.status_code}, {res.text}")
