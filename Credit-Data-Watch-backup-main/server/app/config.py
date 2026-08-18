"""
Environment configuration and settings
"""
from pydantic_settings import BaseSettings
from typing import List
from pathlib import Path
from dotenv import load_dotenv
import os

# Ensure environment variables load correctly regardless of current working directory.
# Prefer server/.env, then fall back to project root .env if present.
_server_env = Path(__file__).resolve().parent.parent / ".env"
if _server_env.exists():
    load_dotenv(dotenv_path=str(_server_env), override=True)
else:
    load_dotenv(override=True)


class Settings(BaseSettings):
    """Application settings from environment variables"""

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://user:password@localhost/creditdatawatch"

    # Redis
    # Default local Redis instance; can be overridden via REDIS_URL in .env
    REDIS_URL: str = "redis://localhost:6379/0"

    # JWT
    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Cookie settings
    COOKIE_DOMAIN: str | None = None
    COOKIE_PATH: str = "/"
    COOKIE_SECURE: bool = False  # Set to True in production with HTTPS
    COOKIE_HTTPONLY: bool = True
    COOKIE_SAMESITE: str = "lax"

    # Google SMTP (Email) - Using SMTP_SSL on port 465
    GOOGLE_SMTP_HOST: str = "smtp.gmail.com"
    GOOGLE_SMTP_PORT: int = 465  # SMTP_SSL port (NOT 587 for starttls)
    GOOGLE_SMTP_USER: str = ""
    GOOGLE_SMTP_PASSWORD: str = ""  # Gmail App Password (not regular password)
    SENDER_EMAIL: str = "no-reply@creditdatawatch.com"
    SENDER_NAME: str = "CreditDataWatch"

    # Main SMTP Config (for general use)
    SMTP_HOST: str = "localhost"
    SMTP_PORT: int = 1025
    SMTP_USER: str | None = None
    SMTP_PASSWORD: str | None = None
    SMTP_FROM: str = "noreply@creditdata.watch"




    SMTP_TIMEOUT: int = 30  # Connection timeout in seconds

    # Google Drive OAuth2
    GOOGLE_CLIENT_CREDENTIALS_FILE: str = "server/credentials/client-credentials.json"
    GOOGLE_SERVICE_ACCOUNT_FILE: str = "server/credentials/service-account.json"
    GOOGLE_FOLDER_ID: str = ""
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/api/v1/drive/callback"

    # OTP (Twilio - optional, can use stub)
    OTP_PROVIDER: str = "smtp"  # or "twilio" or "mock"
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_PHONE_NUMBER: str = ""
    OTP_EXPIRY_MINUTES: int = 10

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://127.0.0.1:3001"]
    ALLOWED_HOSTS: List[str] = ["localhost", "127.0.0.1", "0.0.0.0", "localhost:8000", "127.0.0.1:8000"]

    # Logging
    LOG_LEVEL: str = "INFO"
    ENVIRONMENT: str = "development"

    # Frontend URL for building links in emails
    FRONTEND_URL: str = "http://localhost:3001"
    BASE_URL: str = "http://localhost:8000"
    HOST: str = "127.0.0.1"
    PORT: int = 8000
    ENABLE_SCHEDULER: bool = True
    DEBUG_RAW_ERRORS: bool = True

    # Admin Configuration (for seeding initial admin user)
    ADMIN_GSTIN: str = ""
    ADMIN_EMAIL: str = ""
    ADMIN_PASSWORD: str = ""
    ADMIN_COMPANY_NAME: str = ""
    ADMIN_PHONE: str = ""
    
    # Ollama LLM Configuration
    OLLAMA_BASE_URL: str = "http://localhost:11434"

    class Config:
        # Retain default for environments that run from server/ directory
        env_file = ".env"
        case_sensitive = True


settings = Settings()
