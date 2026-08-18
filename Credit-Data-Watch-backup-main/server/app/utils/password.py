"""
Password utilities using passlib with bcrypt_sha256 for long password support
"""

import unicodedata
from passlib.context import CryptContext
from passlib.exc import PasswordValueError

pwd_context = CryptContext(
    schemes=["bcrypt_sha256", "bcrypt"],
    deprecated=["bcrypt"]
)


def normalize_password(password: str) -> str:
    """
    Normalize and validate password before hashing
    """
    if not isinstance(password, str):
        raise PasswordValueError("Password must be a string")

    # Strip leading/trailing whitespace (common copy-paste issue)
    password = password.strip()

    # Check for empty password after stripping
    if not password:
        raise PasswordValueError("Password cannot be empty")

    # 🚨 HARD BLOCK NULL BYTES (before normalization)
    if "\x00" in password:
        raise PasswordValueError("Password contains invalid characters")

    # Normalize Unicode to prevent encoding issues
    try:
        password = unicodedata.normalize("NFKC", password)
    except Exception:
        raise PasswordValueError("Password contains invalid characters")

    # 🚨 DOUBLE CHECK NULL BYTES (after normalization)
    if "\x00" in password:
        raise PasswordValueError("Password contains invalid characters")

    # Protect against extremely large inputs
    if len(password) > 4096:
        raise PasswordValueError("Password is too long")

    return password


def hash_password(password: str) -> str:
    """
    Hash password using bcrypt_sha256 (fallback verify for bcrypt)
    """
    try:
        password = normalize_password(password)
        # Force bcrypt_sha256 to avoid 72-byte bcrypt limit on long/multibyte passwords
        return pwd_context.hash(password, scheme="bcrypt_sha256")
    except PasswordValueError:
        # Re-raise with same message
        raise
    except Exception as e:
        # Catch any other unexpected errors
        raise PasswordValueError(f"Password hashing failed: {str(e)}")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify password against hash
    """
    try:
        plain_password = normalize_password(plain_password)
        result = pwd_context.verify(plain_password, hashed_password)
        if not result:
            import logging
            logging.getLogger("app.utils.password").warning(f"Password verification failed for hash starting with {hashed_password[:10]}")
        return result
    except Exception as e:
        import logging
        logging.getLogger("app.utils.password").error(f"Password verification error: {e}")
        return False
