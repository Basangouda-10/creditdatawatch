import requests

BASE = "http://localhost:8000/api/v1"

def main():
    s = requests.Session()
    r = s.post(BASE + "/auth/login", json={
        "email": "payalshinde906@gmail.com",
        "password": "AdminPass123!",
        "gstin": "22AAAAD0000A1Z5"
    })
    print("LOGIN:", r.status_code)
    r2 = s.get(BASE + "/credibility")
    print("CRED_LIST:", r2.status_code, r2.text[:300])

if __name__ == "__main__":
    main()
