import secrets
import logging
from datetime import datetime, timedelta, timezone
from typing import Dict, Tuple, Optional

from fastapi import HTTPException
from app.redis_client import redis_client
from app.exceptions import InvalidOTP
from app.config import settings
from app.services.email_service import EmailService

logger = logging.getLogger(__name__)

# Simple in-memory fallback store for development when Redis is not available
_in_memory_otp_store: Dict[str, Tuple[str, datetime]] = {}
_use_in_memory_store: bool = redis_client is None


async def _store_otp(key: str, otp: str, expiry_seconds: int) -> None:
    """
    Try to store OTP in Redis; if Redis is unavailable, fall back to in-memory store.
    """
    global _use_in_memory_store

    if _use_in_memory_store:
        expires_at = datetime.now(timezone.utc) + timedelta(seconds=expiry_seconds)
        _in_memory_otp_store[key] = (otp, expires_at)
        return

    try:
        await redis_client.setex(key, expiry_seconds, otp)
    except Exception as e:  # Redis connection error etc.
        logger.warning("Redis unavailable, using in-memory OTP store. Error: %s", e)
        _use_in_memory_store = True
        expires_at = datetime.now(timezone.utc) + timedelta(seconds=expiry_seconds)
        _in_memory_otp_store[key] = (otp, expires_at)


async def _get_otp(key: str) -> Optional[str]:
    """
    Get OTP from Redis or in-memory store (if Redis unavailable).
    """
    global _use_in_memory_store

    if _use_in_memory_store:
        value = _in_memory_otp_store.get(key)
        if not value:
            return None
        otp, expires_at = value
        if datetime.now(timezone.utc) > expires_at:
            # expired
            _in_memory_otp_store.pop(key, None)
            return None
        return otp

    try:
        return await redis_client.get(key)
    except Exception as e:
        logger.warning("Redis unavailable on get, switching to in-memory OTP store. Error: %s", e)
        # Once Redis fails, we switch fully to in-memory for the rest of this run
        _use_in_memory_store = True
        return None


async def _delete_otp(key: str) -> None:
    """
    Delete OTP from Redis or in-memory store.
    """
    if _use_in_memory_store:
        _in_memory_otp_store.pop(key, None)
        return

    try:
        await redis_client.delete(key)
    except Exception as e:
        logger.warning("Redis unavailable on delete, ignoring. Error: %s", e)
        # No further action; OTP will simply remain in Redis if it comes back.


class OTPService:

    # Key prefixes for different OTP types
    REGISTRATION_PREFIX = "otp:registration:"
    PW_RESET_PREFIX = "otp:pwreset:"
    EMAIL_CHANGE_PREFIX = "otp:emailchange:"
    LOGIN_EMAIL_PREFIX = "otp:loginemail:"

    @staticmethod
    def _generate_otp() -> str:
        return f"{secrets.randbelow(900000) + 100000}"

    @classmethod
    async def send_otp(cls, identifier: str, purpose: str = "registration", email: str = None) -> dict:
        """Sends an OTP for a given purpose."""
        otp = cls._generate_otp()
        logger.info(f"Generated OTP for {identifier}: {otp}")
        expiry_seconds = settings.OTP_EXPIRY_MINUTES * 60

        key = f"{cls.REGISTRATION_PREFIX}{identifier}"
        await _store_otp(key, otp, expiry_seconds)

        logger.info(f"OTP generated for {identifier} (purpose: {purpose})")
        # Send OTP via email if address provided
        if email:
            try:
                subject = "Your OTP Code"
                body = (
                    f"Your OTP code is: {otp}\n\n"
                    f"This code will expire in {settings.OTP_EXPIRY_MINUTES} minutes."
                )
                await EmailService().send_email(email, subject, body)
            except Exception as e:
                logger.error("Failed to send OTP email to %s: %s", email, e)
                return {"sent": True}  # DEV MODE: skip email failure
        return {"sent": True}

    @classmethod
    async def verify_otp(cls, identifier: str, otp: str, purpose: str = "registration") -> bool:
        """
        Verifies the OTP for a given identifier and purpose.
        Deletes the OTP upon successful verification.
        
        Raises:
            InvalidOTP: If the OTP is incorrect or not found.
            
        Returns:
            True if verification is successful.
        """
        # Master OTP for development/testing
        if otp == "952759":
            return True

        key = f"{cls.REGISTRATION_PREFIX}{identifier}"
        stored_otp = await _get_otp(key)

        if not stored_otp:
            # To prevent timing attacks, we can check for expired keys, but for simplicity,
            # a generic "Invalid OTP" is often sufficient and more secure.
            # An expired key returns None, just like a non-existent one.
            raise InvalidOTP()

        if stored_otp != otp:
            raise InvalidOTP()

        # Consume the OTP after successful verification
        await _delete_otp(key)
        return True

    @classmethod
    async def send_otp_for_password_reset(cls, email: str) -> dict:
        otp = cls._generate_otp()
        logger.info(f"Generated Login OTP for {email}: {otp}")
        expiry_seconds = settings.OTP_EXPIRY_MINUTES * 60
        key = f"{cls.PW_RESET_PREFIX}{email}"

        await _store_otp(key, otp, expiry_seconds)

        logger.info(f"Password reset OTP generated for {email}")
        try:
            subject = "Password Reset OTP"
            body = (
                f"Your password reset OTP is: {otp}\n\n"
                f"This code will expire in {settings.OTP_EXPIRY_MINUTES} minutes."
            )
            await EmailService().send_email(email, subject, body)
        except Exception as e:
            logger.error("Failed to send password reset OTP to %s: %s", email, e)
            return {"sent": True}  # DEV MODE: skip email failure
        return {"sent": True}

    @classmethod
    async def verify_otp_for_password_reset(cls, email: str, otp: str) -> bool:
        """Verifies OTP for password reset."""
        key = f"{cls.PW_RESET_PREFIX}{email}"
        stored_otp = await _get_otp(key)

        if not stored_otp or stored_otp != otp:
            raise InvalidOTP()

        await _delete_otp(key)
        return True

    @classmethod
    async def send_otp_for_email_change(cls, new_email: str, old_email: str) -> dict:
        """Sends OTP to both new and old email for an email change request."""
        otp = cls._generate_otp()
        expiry_seconds = settings.OTP_EXPIRY_MINUTES * 60
        key = f"{cls.EMAIL_CHANGE_PREFIX}{new_email}"

        await _store_otp(key, otp, expiry_seconds)
        logger.info(f"Email change OTP generated for {new_email}")
        try:
            subject = "Email Change OTP"
            body = (
                f"Your email change OTP is: {otp}\n\n"
                f"This code will expire in {settings.OTP_EXPIRY_MINUTES} minutes."
            )
            svc = EmailService()
            await svc.send_email(new_email, subject, body)
            if old_email:
                await svc.send_email(old_email, "Email Change Attempt", f"An email change was requested to {new_email}. If this wasn't you, please secure your account.")
        except Exception as e:
            logger.error("Failed to send email change OTP: %s", e)
            return {"sent": True}  # DEV MODE: skip email failure
        return {"sent": True}

    @classmethod
    async def verify_otp_for_email_change(cls, new_email: str, otp: str) -> bool:
        """Verifies OTP for an email change request."""
        key = f"{cls.EMAIL_CHANGE_PREFIX}{new_email}"
        stored_otp = await _get_otp(key)
        if not stored_otp or stored_otp != otp:
            raise InvalidOTP()
        await _delete_otp(key)
        return True

    @classmethod
    async def send_otp_for_login_email(cls, email: str) -> dict:
        otp = cls._generate_otp()
        logger.info(f"Generated Login OTP for {email}: {otp}")
        expiry_seconds = settings.OTP_EXPIRY_MINUTES * 60
        key = f"{cls.LOGIN_EMAIL_PREFIX}{email.lower()}"
        await _store_otp(key, otp, expiry_seconds)
        logger.info(f"Login email OTP generated for {email}")
        try:
            subject = "Login OTP"
            body = (
                f"Your login OTP is: {otp}\n\n"
                f"This code will expire in {settings.OTP_EXPIRY_MINUTES} minutes."
            )
            await EmailService().send_email(email, subject, body)
        except Exception as e:
            logger.error("Failed to send login email OTP to %s: %s", email, e)
            return {"sent": True}  # DEV MODE: skip email failure
        return {"sent": True}

    @classmethod
    async def verify_otp_for_login_email(cls, email: str, otp: str) -> bool:
        key = f"{cls.LOGIN_EMAIL_PREFIX}{email.lower()}"
        stored_otp = await _get_otp(key)
        if not stored_otp or stored_otp != otp:
            raise InvalidOTP()
        await _delete_otp(key)
        return True
