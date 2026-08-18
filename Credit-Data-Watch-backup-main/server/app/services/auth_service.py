"""
Authentication service
"""
from typing import Optional
from uuid import uuid4
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status
from passlib.exc import PasswordValueError

from app.models import User, Company, Invitation, UserRole
from app.models.credibility_index import GlobalCredibilityIndex, CredibilityStatus, AICreditRiskVerdict
from app.schemas import RegisterRequest, LoginRequest
from app.utils import (
    hash_password,
    verify_password,
    is_valid_gstin,
    is_valid_phone,
    format_phone_e164,
    create_access_token,
    create_refresh_token,
    decode_token,
    verify_token_type,
)
from app.services.otp_service import OTPService
from app.exceptions import (
    InvalidGSTIN,
    InvalidPhone,
    InvalidCredentials,
    UserNotFound,
    InvalidOTP,
    OTPExpired,
    DuplicateGSTIN,
    BadRequestException,
)
from app.config import settings

import logging
from sqlalchemy.exc import IntegrityError

logger = logging.getLogger(__name__)


class AuthService:
    """Authentication and authorization service"""

    @staticmethod
    async def register(request: RegisterRequest, db: AsyncSession) -> dict:
        """Register new user with company claim model"""

        if not is_valid_gstin(request.gstin):
            raise InvalidGSTIN()
        if not is_valid_phone(request.phone):
            raise InvalidPhone()

        phone_e164 = format_phone_e164(request.phone)
        gstin_normalized = request.gstin.upper()
        email_normalized = request.email.lower()

        # Derive email domain
        if "@" not in email_normalized:
            raise InvalidCredentials("Invalid email")
        _, email_domain = email_normalized.split("@", 1)
        # REMOVED: Restriction on public domains like gmail.com to allow testing and small businesses

        # Check company existence by GSTIN
        company_stmt = select(Company).where(Company.gstin == gstin_normalized)
        company_result = await db.execute(company_stmt)
        existing_company: Optional[Company] = company_result.scalars().first()
        if existing_company:
            raise DuplicateGSTIN("Company with this GSTIN is already registered. Please contact your admin for an invitation.")

        # Create company (unverified)
        try:
            password_hash: str = hash_password(request.password)
        except PasswordValueError as e:
            raise BadRequestException(str(e))

        company = Company(
            id=str(uuid4()),
            company_name=request.company_name,
            gstin=gstin_normalized,
            domain_name=email_domain,
            is_verified=False,
        )
        db.add(company)
        await db.flush()

        # Auto-add to Global Credibility Index
        gci_entry = GlobalCredibilityIndex(
            id=str(uuid4()),
            company_id=company.id,
            company_name=company.company_name,
            company_registration_no=None,  # Not provided during registration
            partner_trust_score=0.0,
            ai_credit_risk_verdict=AICreditRiskVerdict.NOT_RATED,
            credibility_status=CredibilityStatus.STANDARD,
            approved_by_master_admin_id=None,
            credibility_review_id=None,
        )
        db.add(gci_entry)

        # First verified user becomes COMPANY_ADMIN; mark company verified after checks (OTP assumed verified upstream)
        user = User(
            id=str(uuid4()),
            company_id=company.id,
            name=request.company_name,
            email=email_normalized,
            password_hash=password_hash,
            role=UserRole.COMPANY_ADMIN,
            status="ACTIVE",
            phone=phone_e164,
            gstin=gstin_normalized,
            company_name=request.company_name,
            is_active=True,
        )
        db.add(user)
        company.is_verified = True
        try:
            await db.commit()
        except IntegrityError as e:
            await db.rollback()
            msg = str(e.orig).lower() if getattr(e, "orig", None) else str(e).lower()
            # Handle both PostgreSQL and SQLite unique constraint error messages
            is_unique = "unique" in msg or "duplicate key" in msg
            if "gstin" in msg and is_unique:
                raise DuplicateGSTIN("Company with this GSTIN is already registered.")
            if "email" in msg and is_unique:
                raise BadRequestException("Email already registered. Please login instead.")
            raise
        await db.refresh(user)

        logger.info(f"Company registered: {company.id} ({company.gstin}); admin user: {user.id}")

        tokens = AuthService._generate_tokens(user)

        return {
            "user": {
                "id": user.id,
                "email": user.email,
                "company_id": user.company_id,
                "company_name": company.company_name,
                "role": user.role,
            },
            "tokens": tokens,
        }

    @staticmethod
    async def login(email: str, password: str, gstin: str, db: AsyncSession) -> dict:
        """Login user with email, password and GSTIN"""
        email_normalized = email.strip().lower()
        gstin_normalized = gstin.strip().upper()

        stmt = select(User).where(
            User.email == email_normalized, 
            User.gstin == gstin_normalized,
            User.is_active
        )
        result = await db.execute(stmt)
        user: Optional[User] = result.scalars().first()

        if not user:
            logger.warning(f"Login failed: User not found for {email_normalized} with GSTIN {gstin_normalized}")
            raise InvalidCredentials("Invalid email, password, or GSTIN")
            
        if not verify_password(password, user.password_hash):  # type: ignore
            logger.warning(f"Login failed: Password mismatch for {email_normalized}")
            raise InvalidCredentials("Invalid email, password, or GSTIN")

        # For non-admin roles, if they have a company_id, ensure it exists or use Master Admin's if needed
        # (Already handled during user creation, but good to have safety)

        logger.info(f"User logged in: {user.id} ({user.role})")

        tokens = AuthService._generate_tokens(user)

        return {
            "user": {
                "id": user.id,
                "email": user.email,
                "company_id": user.company_id,
                "company_name": user.company_name,
                "role": user.role,
                "subscription_status": user.subscription_status,
                "gstin": user.gstin,
            },
            "tokens": tokens,
        }

    @staticmethod
    async def login_with_email_otp(email: str, gstin: str, otp_code: str, db: AsyncSession) -> dict:
        if not is_valid_gstin(gstin):
            raise InvalidGSTIN()
        try:
            await OTPService.verify_otp_for_login_email(email, otp_code)
        except (InvalidOTP, OTPExpired):
            raise InvalidCredentials("Invalid or expired OTP")
        stmt = select(User).where(
            User.email == email.lower(),
            User.gstin == gstin.upper(),
            User.is_active,
        )
        result = await db.execute(stmt)
        user: Optional[User] = result.scalars().first()
        if not user:
            raise UserNotFound()
        tokens = AuthService._generate_tokens(user)
        return {
            "user": {
                "id": user.id,
                "gstin": user.gstin,
                "email": user.email,
                "company_name": user.company_name,
                "role": user.role,
                "subscription_status": user.subscription_status,
            },
            "tokens": tokens,
        }

    @staticmethod
    async def refresh_access_token(refresh_token: str, db: AsyncSession) -> dict:
        """Refresh access token"""

        payload = decode_token(refresh_token)

        if not payload or not verify_token_type(payload, "refresh"):
            raise InvalidCredentials("Invalid or expired refresh token")

        user_id = payload.get("sub")
        if not user_id or not isinstance(user_id, str):
            raise InvalidCredentials("Invalid token payload")

        stmt = select(User).where(User.id == user_id)
        result = await db.execute(stmt)
        user: Optional[User] = result.scalars().first()

        if not user:
            raise UserNotFound()

        access_token = create_access_token({"sub": user.id})

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        }

    @staticmethod
    def _generate_tokens(user: User) -> dict:
        """Generate access & refresh tokens"""

        return {
            "access_token": create_access_token({"sub": user.id, "role": user.role}),
            "refresh_token": create_refresh_token({"sub": user.id}),
            "token_type": "bearer",
            "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        }

    @staticmethod
    async def reset_password(
        email: str,
        otp_code: str,
        new_password: str,
        db: AsyncSession,
    ) -> dict:
        """Reset password"""

        # Verify OTP before proceeding
        try:
            await OTPService.verify_otp_for_password_reset(email, otp_code)
        except (InvalidOTP, OTPExpired):
            raise InvalidCredentials("Invalid or expired OTP")

        stmt = select(User).where(
            User.email == email.lower(),
            User.is_active,
        )
        result = await db.execute(stmt)
        user: Optional[User] = result.scalars().first()

        if not user:
            raise UserNotFound()

        try:
            user.password_hash = hash_password(new_password)  # type: ignore
        except PasswordValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password contains invalid characters",
            )

        await db.commit()

        logger.info(f"Password reset for user: {user.id}")

        return {"message": "Password reset successful"}
