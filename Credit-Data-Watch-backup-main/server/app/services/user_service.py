"""
User service
"""
from uuid import uuid4
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models import User
from app.schemas import UpdateProfileRequest
from app.utils import format_phone_e164, is_valid_phone
from app.exceptions import UserNotFound, InvalidPhone
import logging

logger = logging.getLogger(__name__)


class UserService:
    """User profile and account management"""

    @staticmethod
    async def get_user_profile(user_id: str, db: AsyncSession) -> User:
        """
        Get user profile
        
        Args:
            user_id: User ID
            db: Database session
            
        Returns:
            User object
        """
        stmt = select(User).where(User.id == user_id)
        result = await db.execute(stmt)
        user = result.scalars().first()
        
        if not user:
            raise UserNotFound()
        
        return user

    @staticmethod
    async def update_profile(user_id: str, request: UpdateProfileRequest, db: AsyncSession) -> User:
        """
        Update user profile
        
        Args:
            user_id: User ID
            request: Update request
            db: Database session
            
        Returns:
            Updated user object
        """
        user = await UserService.get_user_profile(user_id, db)
        
        # Update fields
        if request.company_name:
            user.company_name = request.company_name
        
        if request.email:
            user.email = request.email.lower()
        
        if request.phone:
            if not is_valid_phone(request.phone):
                raise InvalidPhone()
            user.phone = format_phone_e164(request.phone)
        
        await db.commit()
        await db.refresh(user)
        
        logger.info(f"User profile updated: {user_id}")
        
        return user

    @staticmethod
    async def change_phone(user_id: str, new_phone: str, db: AsyncSession) -> User:
        """
        Change user phone number (after OTP verification)
        
        Args:
            user_id: User ID
            new_phone: New phone number (already formatted)
            db: Database session
            
        Returns:
            Updated user object
        """
        user = await UserService.get_user_profile(user_id, db)
        user.phone = new_phone
        
        await db.commit()
        await db.refresh(user)
        
        logger.info(f"Phone changed for user: {user_id}")
        
        return user
