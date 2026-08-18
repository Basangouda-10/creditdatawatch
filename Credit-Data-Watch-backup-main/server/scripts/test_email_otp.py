import requests

BASE = "http://localhost:8000/api/v1"

def main():
    resp = requests.post(BASE + "/auth/login/send-email-otp", json={"email": "payalshinde906@gmail.com"})
    print("SEND_EMAIL_OTP:", resp.status_code, resp.text[:300])

if __name__ == "__main__":
    main()
