import requests

print("=== TEST LOGIN ===")
login_r = requests.post("http://localhost:8000/api/v1/auth/login", json={
    "email": "legal@test.com",
    "password": "Test@1234",
    "gstin": "22AAAAD0000A1Z5"
})
print(f"Status: {login_r.status_code}")
print(f"Response: {login_r.text}")