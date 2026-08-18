import logging
import os
import smtplib
import ssl
from email.message import EmailMessage
from email.mime.base import MIMEBase
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formataddr, parseaddr
from email import encoders

from fastapi.concurrency import run_in_threadpool
from app.config import settings

logger = logging.getLogger(__name__)


class EmailService:
    def __init__(self):
        self.smtp_host = getattr(settings, "GOOGLE_SMTP_HOST", "smtp.gmail.com")
        self.smtp_port = int(getattr(settings, "GOOGLE_SMTP_PORT", 587))
        self.smtp_user = getattr(settings, "GOOGLE_SMTP_USER", "")
        self.smtp_password = getattr(settings, "GOOGLE_SMTP_PASSWORD", "")
        self.sender_email = getattr(settings, "SENDER_EMAIL", self.smtp_user)
        self.sender_name = getattr(settings, "SENDER_NAME", "CreditDataWatch")

        _, addr_only = parseaddr(self.sender_email or "")
        base_addr = addr_only or self.sender_email
        self.from_header = formataddr((self.sender_name, base_addr))
        self.timeout = getattr(settings, "SMTP_TIMEOUT", 10)

    def _dispatch_smtp(self, msg: EmailMessage | MIMEMultipart):
        """Helper to send message over SSL (Port 465) or STARTTLS (Port 587)"""
        context = ssl.create_default_context()
        if self.smtp_port == 465:
            with smtplib.SMTP_SSL(self.smtp_host, self.smtp_port, context=context, timeout=self.timeout) as server:
                server.login(self.smtp_user, self.smtp_password)
                server.send_message(msg)
        else:
            with smtplib.SMTP(self.smtp_host, self.smtp_port, timeout=self.timeout) as server:
                server.starttls(context=context)
                server.login(self.smtp_user, self.smtp_password)
                server.send_message(msg)

    async def send_email(self, to_email: str, subject: str, body: str):
        """Send a normal text email"""
        logger.info("========================================")
        logger.info(f"[EMAIL LOG] To: {to_email} | Subject: {subject}")
        logger.info("========================================")

        if not self.smtp_user or not self.smtp_password or self.smtp_password == "testpassword":
            logger.warning("SMTP credentials not set. Printed mock message above.")
            return

        def _send():
            msg = EmailMessage()
            msg["From"] = self.from_header
            msg["To"] = to_email
            msg["Subject"] = subject
            msg.set_content(body)
            self._dispatch_smtp(msg)

        try:
            await run_in_threadpool(_send)
            logger.info(f"Email successfully sent to {to_email}")
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {str(e)}")
            raise e

    async def send_email_html(self, to_email: str, subject: str, html: str, text_fallback: str | None = None):
        """Send an HTML email with optional text fallback"""
        if not self.smtp_user or not self.smtp_password or self.smtp_password == "testpassword":
            logger.warning("SMTP credentials not set. Skipping HTML email.")
            return

        def _send():
            msg = EmailMessage()
            msg["From"] = self.from_header
            msg["To"] = to_email
            msg["Subject"] = subject
            if text_fallback:
                msg.set_content(text_fallback)
            else:
                msg.set_content("HTML Email")
            msg.add_alternative(html, subtype="html")
            self._dispatch_smtp(msg)

        try:
            await run_in_threadpool(_send)
            logger.info(f"HTML email successfully sent to {to_email}")
        except Exception as e:
            logger.error(f"Failed to send HTML email: {str(e)}")
            raise e

    @staticmethod
    async def send_registration_email(to_email: str, company_name: str, phone: str) -> None:
        """Send welcome email after registration."""
        try:
            subject = "Welcome to CreditDataWatch"
            body = (
                f"Hello,\n\n"
                f"Thank you for registering with CreditDataWatch.\n\n"
                f"Company: {company_name}\n"
                f"Phone: {phone}\n\n"
                f"You can now log in and use the platform.\n\n"
                f"Thank you!"
            )
            svc = EmailService()
            await svc.send_email(to_email, subject, body)
        except Exception as e:
            logger.warning("Registration email failed: %s", e)


async def send_otp_email(email_to: str, otp_code: str) -> bool:
    """Send OTP email via EmailService for registration and authentication."""
    subject = f"{otp_code} is your CreditDataWatch Verification Code"
    html = f"""
    <h2>Welcome to CreditDataWatch</h2>
    <p>Your verification code is: <strong style="font-size: 24px; color: #2563eb;">{otp_code}</strong></p>
    <p>This code will expire in 10 minutes.</p>
    """
    svc = EmailService()
    try:
        await svc.send_email_html(email_to, subject, html, text_fallback=f"Your OTP Code is: {otp_code}")
        return True
    except Exception as e:
        logger.error(f"Failed to dispatch OTP: {e}")
        return False


async def send_email(to_email: str, subject: str, body: str):
    """Standalone wrapper for EmailService.send_email"""
    svc = EmailService()
    return await svc.send_email(to_email, subject, body)


async def send_email_with_attachment(
    to_email: str,
    subject: str,
    body: str,
    attachment_path: str = None,
    attachment_name: str = "Legal_Notice.pdf"
):
    svc = EmailService()
    
    if not svc.smtp_user or not svc.smtp_password or svc.smtp_password == "testpassword":
        print(f"[MOCK ATTACHMENT EMAIL] To: {to_email} | Subject: {subject} | Attachment: {attachment_name}")
        return True

    msg = MIMEMultipart()
    msg['From'] = svc.from_header
    msg['To'] = to_email
    msg['Subject'] = subject
    msg.attach(MIMEText(body, 'plain'))

    if attachment_path and os.path.exists(attachment_path):
        def _read_attachment():
            with open(attachment_path, 'rb') as f:
                return f.read()
        
        file_data = await run_in_threadpool(_read_attachment)
        part = MIMEBase('application', 'octet-stream')
        part.set_payload(file_data)
        encoders.encode_base64(part)
        part.add_header('Content-Disposition', f'attachment; filename="{attachment_name}"')
        msg.attach(part)

    def _send_email():
        svc._dispatch_smtp(msg)
        return True

    try:
        return await run_in_threadpool(_send_email)
    except Exception as e:
        logger.error(f"Failed to send email with attachment: {str(e)}")
        return False