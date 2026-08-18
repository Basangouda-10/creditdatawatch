"""
User settings routes for theme and preferences
"""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import Annotated
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.user_settings import UserSettingsResponse, UpdateUserSettingsRequest
from app.services.user_settings_service import UserSettingsService
from app.exceptions import UserNotFound
from app.utils.response import ResponseFormatter
from app.dependencies import get_current_user
import logging

logger = logging.getLogger(__name__)

router = APIRouter(tags=["User Settings"])


@router.get("", response_model=dict)
async def get_user_settings(
    current_user: Annotated[dict, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Get user settings (theme, language, notifications)
    
    Args:
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        User settings
    """
    try:
        settings = await UserSettingsService.get_user_settings(
            user_id=current_user["id"],
            db=db,
        )
        
        return ResponseFormatter.create_success(
            message="User settings retrieved",
            data={
                "theme_preference": settings.theme_preference,
                "language": settings.language,
                "notifications_enabled": settings.notifications_enabled,
            },
        )
    except Exception as e:
        logger.error(f"Error getting user settings: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get user settings",
        )


@router.put("", response_model=dict)
async def update_user_settings(
    request: UpdateUserSettingsRequest,
    current_user: Annotated[dict, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Update user settings (theme, language, notifications)
    
    Args:
        request: Update settings request
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        Updated user settings
    """
    try:
        settings = await UserSettingsService.update_user_settings(
            user_id=current_user["id"],
            theme_preference=request.theme_preference,
            language=request.language,
            notifications_enabled=request.notifications_enabled,
            db=db,
        )
        
        await db.commit()
        
        return ResponseFormatter.create_success(
            message="User settings updated successfully",
            data={
                "theme_preference": settings.theme_preference,
                "language": settings.language,
                "notifications_enabled": settings.notifications_enabled,
            },
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Error updating user settings: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update user settings",
        )
