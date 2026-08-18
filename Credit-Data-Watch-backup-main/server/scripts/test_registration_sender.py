import asyncio
import os
import sys

# Ensure server root is on sys.path to import the app package
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
SERVER_ROOT = os.path.dirname(CURRENT_DIR)
if SERVER_ROOT not in sys.path:
    sys.path.insert(0, SERVER_ROOT)

from app.services.email_service import EmailService
from app.config import settings


def main():
    to_email = os.environ.get("TEST_TO_EMAIL") or settings.GOOGLE_SMTP_USER or "test@example.com"
    asyncio.run(EmailService.send_registration_email(to_email, "TestCo", "+91 9999999999"))


if __name__ == "__main__":
    main()
