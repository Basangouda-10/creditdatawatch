import requests

BASE = "http://localhost:8000/api/v1"

def main():
    s = requests.Session()
    r = s.post(BASE + "/auth/login", json={
        "email": "payalshinde906@gmail.com",
        "password": "AdminPass123!",
        "gstin": "22AAAAD0000A1Z5"
    })
    user = r.json().get("data", {})
    company_id = user.get("company_id")
    print("COMPANY_ID:", company_id)
    r2 = s.get(BASE + f"/credibility/{company_id}")
    print("CRED:", r2.status_code, r2.text[:600])

if __name__ == "__main__":
    main()
