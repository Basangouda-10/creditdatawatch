import requests
import datetime
from datetime import timezone

BASE = "http://localhost:8000/api/v1"

def main():
    s = requests.Session()
    r = s.post(BASE + "/auth/login", json={
        "email": "payalshinde906@gmail.com",
        "password": "AdminPass123!",
        "gstin": "22AAAAD0000A1Z5"
    })
    print("LOGIN:", r.status_code)
    po_payload = {
        "po_number": f"PO-TEST-{datetime.datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}",
        "vendor": "Notify Vendor",
        "gstin": "22AAAAA0000A1Z5",
        "amount": 999.99,
        "due_date": datetime.date.today().isoformat(),
        "status": "Open",
        "document_url": ""
    }
    r2 = s.post(BASE + "/purchase-orders", json=po_payload)
    print("CREATE_PO:", r2.status_code, r2.text[:200])
    po_id = None
    try:
        po_id = r2.json().get("data", {}).get("id")
    except Exception:
        pass
    r3 = s.get(BASE + "/notifications")
    print("LIST_NOTES:", r3.status_code)
    print(r3.text[:500])
    if po_id:
        notes = r3.json().get("data", [])
        matches = [n for n in notes if n.get("related_po_id") == po_id and n.get("type") == "PO_CREATED"]
        print("MATCH_COUNT:", len(matches))
        if matches:
            print("MATCH_NOTE:", matches[0])

if __name__ == "__main__":
    main()
