
import requests
import time

BASE = "http://localhost:8000"

# Login as master admin
login = requests.post(f"{BASE}/api/v1/auth/login",
    json={"email":"payalshinde906@gmail.com","password":"AdminPass123!","gstin":"22AAAAD0000A1Z5"})
token = login.json()['data']['user']['access_token']
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

# Check current notification count
r1 = requests.get(f"{BASE}/api/v1/workflow/notifications", headers=headers)
count_before = r1.json().get("unread_count", 0)
print(f"Notifications before: {count_before}")

# Send a test notification to master admin directly
r2 = requests.post(f"{BASE}/api/v1/workflow/test/send-notification",
    json={
        "to_email": "payalshinde906@gmail.com",
        "title": "Test Instant Notification",
        "message": f"This notification was sent at: {time.time()}"
    },
    headers=headers)
print(f"Send notification: {r2.status_code}")

# Check immediately - should appear right away
time.sleep(1)
r3 = requests.get(f"{BASE}/api/v1/workflow/notifications", headers=headers)
count_after = r3.json().get("unread_count", 0)
print(f"Notifications after: {count_after}")

if count_after > count_before:
    print("✅ Notifications are INSTANT!")
else:
    print("❌ Notifications are delayed - check DB connection")
