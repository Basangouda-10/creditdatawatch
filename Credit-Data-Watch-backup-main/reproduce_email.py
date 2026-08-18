import asyncio
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Add server to path
sys.path.append(os.path.join(os.getcwd(), "server"))

# Load env from server/.env
env_path = Path("server/.env")
load_dotenv(dotenv_path=env_path, override=True)

async def reproduce_email_issue():
    from app.services.email_service import EmailService
    from app.config import settings
    
    print(f"Testing SMTP for: {settings.GOOGLE_SMTP_USER}")
    
    svc = EmailService()
    test_email = "shindepayal296@gmail.com"
    subject = "Welcome to CreditDataWatch - Your Login Details (LEGAL)"
    body = "Dear Mona,\n\nWelcome to CreditDataWatch!\n\nYour account has been created by the Master Admin.\n\nYOUR LOGIN DETAILS:\nEmail: shindepayal296@gmail.com\nPassword: TempPass@123\nRole: LEGAL\nGSTIN: 27AAAAA0000A1Z5\n\nCLICK TO LOGIN:\nhttp://localhost:3001/auth/login\n\nPlease change your password after first login.\n\nRegards,\nCreditDataWatch Team"
    
    try:
        print(f"Sending email to {test_email}...")
        # We'll use the send_email method which uses smtplib.SMTP_SSL
        await svc.send_email(test_email, subject, body)
        print("✅ Success: SMTP_SSL call completed without error.")
    except Exception as e:
        print(f"❌ Failure: Email sending failed with error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(reproduce_email_issue())
