
import requests
import sys
import uuid
from datetime import datetime, timedelta

BASE_URL = "http://127.0.0.1:8000/api/v1"

# First, log in to get a token
print("Logging in...")
login_payload = {
    "email": "master.test@creditwatch.com",
    "password": "Test@1234",
    "gstin": "22AAAAD0000A1Z5"
}
login_res = requests.post(f"{BASE_URL}/auth/login", json=login_payload)
print(f"Login status: {login_res.status_code}")
if login_res.status_code != 200:
    print("Login failed!", login_res.text)
    sys.exit(1)

token = login_res.json()["data"]["user"]["access_token"]
headers = {"Authorization": f"Bearer {token}"}
print("Got token!")

print("\nCalling GET /api/v1/purchase-orders...")
try:
    res = requests.get(f"{BASE_URL}/purchase-orders", headers=headers, timeout=10)
    print(f"GET status: {res.status_code}")
except Exception as e:
    print(f"GET Exception: {str(e)}")
    import traceback
    traceback.print_exc()

print("\nCalling POST /api/v1/purchase-orders (creating test PO)...")
try:
    # This endpoint uses FORM DATA, not JSON!
    po_form_data = {
        "po_number": f"TEST-PO-{uuid.uuid4().hex[:8]}",
        "vendor": "Test Vendor LLC",
        "gstin": "22AAAAD0000A1Z5",
        "vendor_email": "test.vendor@example.com",
        "vendor_phone": "9876543210",
        "amount": 1500.0,
        "due_date": (datetime.utcnow() + timedelta(days=30)).strftime("%Y-%m-%d"),
        "status": "open",
        "notes": "Test PO from script",
        "payment_window_days": 50,
        "reason": "Test PO creation"
    }
    res = requests.post(
        f"{BASE_URL}/purchase-orders",
        data=po_form_data,  # <-- use data for form, not json!
        headers=headers,
        timeout=15
    )
    print(f"POST status: {res.status_code}")
    print(f"POST response: {res.text}")
except Exception as e:
    print(f"POST Exception: {str(e)}")
    import traceback
    traceback.print_exc()
