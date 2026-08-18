
import requests
import sys

BASE_URL = "http://localhost:8000/api/v1"
EMAIL = "payalshinde906@gmail.com"
GSTIN = "22AAAAD0000A1Z5"

def test_po_creation(token):
    print("🚀 Testing PO Creation...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # 1. Create PO
    print("\n1. Creating PO...")
    po_payload = {
        "po_number": "PO-TEST-001",
        "vendor": "Test Vendor Corp",
        "gstin": "27AAAAA0000A1Z5",
        "amount": 50000.0,
        "due_date": "2026-05-27T00:00:00",
        "status": "Open",
        "notes": "Testing PO creation via script",
        "vendor_email": "vendor@example.com"
    }
    
    res = requests.post(f"{BASE_URL}/purchase-orders", json=po_payload, headers=headers)
    if res.status_code == 200:
        po_id = res.json()["data"]["id"]
        print(f"✅ PO Created! ID: {po_id}")
        return po_id
    else:
        print(f"❌ Failed to create PO: {res.text}")
        return None

def test_po_approval(token, po_id):
    print("\n3. Testing PO Approval...")
    headers = {"Authorization": f"Bearer {token}"}
    approval_payload = {
        "action": "APPROVE",
        "reason": "Approved for testing"
    }
    res = requests.post(f"{BASE_URL}/purchase-orders/{po_id}/process-approval", json=approval_payload, headers=headers)
    if res.status_code == 200:
        print(f"✅ PO Approved! Status: {res.json()['message']}")
    else:
        print(f"❌ Failed to approve PO: {res.text}")

def test_po_listing(token, po_number):
    print("\n2. Listing POs...")
    headers = {"Authorization": f"Bearer {token}"}
    res = requests.get(f"{BASE_URL}/purchase-orders", headers=headers)
    if res.status_code == 200:
        pos = res.json()["data"]
        print(f"✅ POs Listed! Found {len(pos)} POs.")
        found = False
        for po in pos:
            if po["po_number"] == po_number:
                print(f"   Found our PO: {po['po_number']} - {po['vendor']}")
                found = True
        if not found:
            print(f"   ❌ Our PO {po_number} not found in listing!")
    else:
        print(f"❌ Failed to list POs: {res.text}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python test_po_creation.py <token>")
        sys.exit(1)
    
    token = sys.argv[1]
    po_id = test_po_creation(token)
    if po_id:
        test_po_listing(token, "PO-TEST-001")
        test_po_approval(token, po_id)
