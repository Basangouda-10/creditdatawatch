# Email Service Setup Guide

This guide explains how to configure the secure email service module for sending emails via Gmail SMTP.

## Security Features

✅ **SMTP_SSL** - Uses SSL/TLS encryption (port 465)  
✅ **EmailMessage** - Modern Python email API  
✅ **Connection Timeout** - Prevents hanging connections  
✅ **Exception Handling** - Graceful error handling  
✅ **Credential Validation** - Ensures sender matches Gmail login  
✅ **Environment Variables** - No hardcoded credentials  

## Prerequisites

1. **Gmail Account** - A valid Gmail account
2. **App Password** - NOT your regular Gmail password

## Step 1: Enable 2-Factor Authentication

1. Go to your [Google Account settings](https://myaccount.google.com/)
2. Navigate to **Security**
3. Enable **2-Step Verification** if not already enabled

## Step 2: Generate Gmail App Password

1. Go to [Google App Passwords](https://myaccount.google.com/apppasswords)
2. Select **Mail** as the app
3. Select **Other (Custom name)** as the device
4. Enter a name like "CreditDataWatch Email Service"
5. Click **Generate**
6. Copy the 16-character password (it looks like: `abcd efgh ijkl mnop`)

## Step 3: Configure Environment Variables

Create or update your `.env` file in the `server/` directory:

```env
# Gmail SMTP Configuration
GOOGLE_SMTP_HOST=smtp.gmail.com
GOOGLE_SMTP_PORT=465
GOOGLE_SMTP_USER=your-email@gmail.com
GOOGLE_SMTP_PASSWORD=abcdefghijklmnop
SENDER_EMAIL=your-email@gmail.com  # Optional: defaults to GOOGLE_SMTP_USER
SMTP_TIMEOUT=30  # Connection timeout in seconds (optional)
```

**Important Notes:**
- `GOOGLE_SMTP_USER` should be your full Gmail address
- `GOOGLE_SMTP_PASSWORD` should be the 16-character App Password (remove spaces)
- `SENDER_EMAIL` should match `GOOGLE_SMTP_USER` (Gmail requirement)
- Never commit the `.env` file to version control

## Step 4: Verify Configuration

Test the email service:

```python
from app.services.email_service import EmailService

# Send test OTP email
success = await EmailService.send_otp_email(
    to_email="recipient@example.com",
    otp_code="123456",
    reason="test verification"
)

if success:
    print("✓ Email sent successfully")
else:
    print("✗ Failed to send email")
```

## Usage Examples

### Send OTP Email

```python
from app.services.email_service import EmailService

success = await EmailService.send_otp_email(
    to_email="user@example.com",
    otp_code="654321",
    reason="phone verification",
    expiry_minutes=10
)
```

### Send Password Reset Email

```python
success = await EmailService.send_password_reset_email(
    to_email="user@example.com",
    reset_token="abc123xyz789",
    reset_url="https://yourapp.com/reset-password?token=abc123xyz789"
)
```

### Send Notification Email

```python
success = await EmailService.send_notification_email(
    to_email="user@example.com",
    title="Account Update",
    message="Your account has been updated successfully.",
    notification_type="success"  # info, success, warning, error
)
```

### Send Custom Email (Reusable Function)

```python
success = EmailService.send_email(
    to_email="user@example.com",
    subject="Custom Subject",
    html_body="<h1>Hello</h1><p>This is a custom email.</p>",
    plain_text_body="Hello\n\nThis is a custom email.",  # Optional
    cc=["cc@example.com"],  # Optional
    bcc=["bcc@example.com"]  # Optional
)
```

## Troubleshooting

### Error: "SMTP authentication failed"

- Make sure you're using an **App Password**, not your regular Gmail password
- Verify the App Password has no spaces
- Ensure 2-Step Verification is enabled on your Google account

### Error: "Sender email differs from SMTP user"

- Gmail requires `SENDER_EMAIL` to match `GOOGLE_SMTP_USER`
- Set `SENDER_EMAIL` to the same value as `GOOGLE_SMTP_USER` or leave it empty

### Error: "SMTP connection error"

- Check your internet connection
- Verify firewall isn't blocking port 465
- Ensure `GOOGLE_SMTP_HOST` is set to `smtp.gmail.com`
- Verify `GOOGLE_SMTP_PORT` is set to `465` (NOT 587)

### Error: "Recipient email rejected"

- Verify the recipient email address is valid
- Check for typos in the email address
- Ensure the email address format is correct (contains @)

## Production Recommendations

1. **Use Environment Variables** - Never hardcode credentials
2. **Rotate App Passwords** - Regularly update your App Passwords
3. **Monitor Logs** - Check application logs for email sending failures
4. **Rate Limiting** - Implement rate limiting to prevent abuse
5. **Email Validation** - Validate email addresses before sending
6. **Retry Logic** - Implement retry logic for transient failures
7. **Queue System** - Use a queue system (e.g., Celery) for async email sending

## Security Best Practices

✅ Credentials stored in environment variables  
✅ App Passwords used instead of regular passwords  
✅ SMTP_SSL for encrypted connections  
✅ Connection timeouts to prevent hanging  
✅ Sender validation (must match Gmail login)  
✅ No credentials exposed in code or logs  

## API Reference

See `server/app/services/email_service.py` for complete API documentation.

