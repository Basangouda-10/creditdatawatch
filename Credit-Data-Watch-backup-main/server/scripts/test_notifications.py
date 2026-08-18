import requests

BASE = "http://localhost:8000/api/v1"

def main():
    s = requests.Session()
    s.post(BASE + "/auth/login", json={
        "email": "payalshinde906@gmail.com",
        "password": "AdminPass123!",
        "gstin": "22AAAAD0000A1Z5"
    })
    r = s.get(BASE + "/notifications")
    print("LIST_NOTES:", r.status_code, r.text[:300])

if __name__ == "__main__":
    main()
