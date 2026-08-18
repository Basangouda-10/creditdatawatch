import smtplib
import ssl
import os
from email.message import EmailMessage
from dotenv import load_dotenv

def test_send_email():
    # Load .env file
    load_dotenv()
    
    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", 465))
    smtp_user = os.getenv("GOOGLE_SMTP_USER")
    smtp_password = os.getenv("GOOGLE_SMTP_PASSWORD")
    
    if not smtp_user or not smtp_password:
        print("ERROR: GOOGLE_SMTP_USER or GOOGLE_SMTP_PASSWORD not found in .env")
        return

    print(f"Attempting to send test email to {smtp_user} via {smtp_host}:{smtp_port}...")
    
    msg = EmailMessage()
    msg["Subject"] = "OTP Test"
    msg["From"] = smtp_user
    msg["To"] = smtp_user
    msg.set_content("This is a test email from CreditDataWatch")
    
    try:
        context = ssl.create_default_context()
        with smtplib.SMTP_SSL(smtp_host, smtp_port, context=context) as server:
            server.login(smtp_user, smtp_password)
            server.send_message(msg)
        print("SUCCESS: Email sent!")
    except Exception as e:
        print(f"FAILED: {str(e)}")

if __name__ == "__main__":
    test_send_email()
