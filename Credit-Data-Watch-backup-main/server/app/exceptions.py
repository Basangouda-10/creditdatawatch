"""
Custom exceptions
"""
from typing import Optional


class AppException(Exception):
    """Base exception for the application"""

    def __init__(self, code: str, message: str, status_code: int = 400, details: Optional[dict] = None):
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)


class InvalidGSTIN(AppException):
    def __init__(self, message: str = "Invalid GSTIN format"):
        super().__init__("INVALID_GSTIN", message, 400)


class InvalidPhone(AppException):
    def __init__(self, message: str = "Invalid phone number"):
        super().__init__("INVALID_PHONE", message, 400)


class UserNotFound(AppException):
    def __init__(self, message: str = "User not found"):
        super().__init__("USER_NOT_FOUND", message, 404)


class InvalidCredentials(AppException):
    def __init__(self, message: str = "Invalid email or password"):
        super().__init__("INVALID_CREDENTIALS", message, 401)


class SubscriptionNotFound(AppException):
    def __init__(self, message: str = "Subscription not found"):
        super().__init__("SUBSCRIPTION_NOT_FOUND", message, 404)


class UnauthorizedFeature(AppException):
    def __init__(self, feature: str = "This feature"):
        super().__init__(
            "UNAUTHORIZED_FEATURE",
            f"{feature} requires an active paid subscription",
            403,
        )


class OTPExpired(AppException):
    def __init__(self, message: str = "OTP has expired"):
        super().__init__("OTP_EXPIRED", message, 400)


class InvalidOTP(AppException):
    def __init__(self, message: str = "Invalid OTP"):
        super().__init__("INVALID_OTP", message, 400)


class DriveAccessDenied(AppException):
    def __init__(self, message: str = "Failed to access Google Drive"):
        super().__init__("DRIVE_ACCESS_DENIED", message, 403)


class InvalidEmail(AppException):
    def __init__(self, message: str = "Invalid email format"):
        super().__init__("INVALID_EMAIL", message, 400)


class InvalidPassword(AppException):
    def __init__(self, message: str = "Password must be at least 6 characters"):
        super().__init__("INVALID_PASSWORD", message, 400)


class DuplicateGSTIN(AppException):
    def __init__(self, message: str = "GSTIN already registered"):
        super().__init__("GSTIN_ALREADY_REGISTERED", message, 400)


class PlanNotFound(AppException):
    def __init__(self, message: str = "Plan not found or inactive"):
        super().__init__("PLAN_NOT_FOUND", message, 404)


class InvalidPlanId(AppException):
    def __init__(self, message: str = "Invalid plan ID"):
        super().__init__("INVALID_PLAN_ID", message, 400)


class NotFoundException(AppException):
    def __init__(self, message: str = "Resource not found"):
        super().__init__("NOT_FOUND", message, 404)


class BadRequestException(AppException):
    def __init__(self, message: str = "Bad request"):
        super().__init__("BAD_REQUEST", message, 400)


class DatabaseConnectionError(AppException):
    def __init__(self, message: str = "Database connection failed"):
        super().__init__("DATABASE_CONNECTION_ERROR", message, 503)
