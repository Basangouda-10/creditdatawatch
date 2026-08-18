import requests
import datetime

BASE = "http://localhost:8000/api/v1"

def main():
    s = requests.Session()
    resp = s.post(
        BASE + "/auth/login",
        json={
            "email": "payalshinde906@gmail.com",
            "password": "AdminPass123!",
            "gstin": "22AAAAD0000A1Z5",
        },
    )
    print("LOGIN:", resp.status_code, resp.text[:200])
    payload = {
        "po_number": "PO-TEST-001",
        "vendor": "Test Vendor",
        "gstin": "22AAAAA0000A1Z5",
        "amount": 12345.67,
        "due_date": datetime.date.today().isoformat(),
        "status": "Open",
        "document_url": "",
    }
    resp2 = s.post(BASE + "/purchase-orders", json=payload)
    print("CREATE_PO:", resp2.status_code, resp2.text[:300])

if __name__ == "__main__":
    main()
