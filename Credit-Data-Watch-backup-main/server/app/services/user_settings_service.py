"""
User settings service for theme and preferences management
"""
from uuid import uuid4
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from app.models import UserSettings, User
from app.exceptions import UserNotFound
import logging

logger = logging.getLogger(__name__)


class UserSettingsService:
    """Handle user settings and preferences"""

    @staticmethod
    async def get_user_settings(
        user_id: str,
        db: AsyncSession
    ) -> UserSettings:
        """
        Get user settings, creating defaults if not exists
        
        Args:
            user_id: User ID
            db: Database session
            
        Returns:
            UserSettings object
        """
        stmt = select(UserSettings).where(UserSettings.user_id == user_id)
        result = await db.execute(stmt)
        settings = result.scalars().first()
        
        # Create default settings if not exists
        if not settings:
            settings = await UserSettingsService.create_default_settings(user_id, db)
        
        return settings

    @staticmethod
    async def create_default_settings(
        user_id: str,
        db: AsyncSession
    ) -> UserSettings:
        """
        Create default user settings
        
        Args:
            user_id: User ID
            db: Database session
            
        Returns:
            Created UserSettings object
        """
        # Verify user exists
        user_stmt = select(User).where(User.id == user_id)
        user_result = await db.execute(user_stmt)
        user = user_result.scalars().first()
        
        if not user:
            raise UserNotFound()
        
        now = datetime.now(timezone.utc)
        settings = UserSettings(
            id=str(uuid4()),
            user_id=user_id,
            theme_preference="system",  # Default to system preference
            language="en",
            notifications_enabled=True,
            created_at=now,
            updated_at=now,
        )
        
        db.add(settings)
        await db.flush()
        
        logger.info(f"Default settings created for user: {user_id}")
        
        return settings

    @staticmethod
    async def update_user_settings(
        user_id: str,
        theme_preference: Optional[str] = None,
        language: Optional[str] = None,
        notifications_enabled: Optional[bool] = None,
        db: AsyncSession = None
    ) -> UserSettings:
        """
        Update user settings
        
        Args:
            user_id: User ID
            theme_preference: Theme preference (light/dark/system)
            language: Language preference
            notifications_enabled: Notifications enabled/disabled
            db: Database session
            
        Returns:
            Updated UserSettings object
        """
        settings = await UserSettingsService.get_user_settings(user_id, db)
        
        if theme_preference is not None:
            if theme_preference not in ["light", "dark", "system"]:
                raise ValueError(f"Invalid theme_preference: {theme_preference}")
            settings.theme_preference = theme_preference
        
        if language is not None:
            settings.language = language
        
        if notifications_enabled is not None:
            settings.notifications_enabled = notifications_enabled
        
        settings.updated_at = datetime.now(timezone.utc)
        
        await db.flush()
        
        logger.info(f"Settings updated for user: {user_id}")
        
        return settings
