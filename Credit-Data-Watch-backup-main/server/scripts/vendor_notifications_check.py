import requests

BASE = "http://localhost:8000/api/v1"

def main():
    s = requests.Session()
    s.post(BASE + "/auth/login", json={
        "email": "vendoradmin@example.com",
        "password": "VendorPass123!",
        "gstin": "22AAAAA0000A1Z5"
    })
    r = s.get(BASE + "/notifications")
    print("VENDOR_NOTES:", r.status_code, r.text[:500])

if __name__ == "__main__":
    main()
