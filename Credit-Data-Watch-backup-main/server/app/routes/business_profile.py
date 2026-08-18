from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone
import uuid
import logging

from app.database import get_db
from app.dependencies import get_current_user
from app.models import User, BusinessProfile

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/account", tags=["Business Profile"])

@router.get("/profile")
async def get_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    user_id = str(getattr(current_user, "id", ""))
    user_email = str(getattr(current_user, "email", "unknown_user"))
    company_name = getattr(current_user, "company_name", None) or getattr(current_user, "name", None) or "Company"
    user_phone = getattr(current_user, "phone", "") or ""
    user_gstin = getattr(current_user, "gstin", "") or ""

    try:
        stmt = select(BusinessProfile).where(BusinessProfile.user_id == user_id)
        result = await db.execute(stmt)
        profile = result.scalars().first()

        if not profile:
            now_naive = datetime.now(timezone.utc).replace(tzinfo=None)

            profile = BusinessProfile(
                id=str(uuid.uuid4()),
                user_id=user_id,
                name=company_name,
                registered_name=company_name,
                email=user_email,
                phone=user_phone,
                gstin=user_gstin,
                created_at=now_naive,
                updated_at=now_naive
            )
            db.add(profile)
            await db.commit()
            await db.refresh(profile)

        return {
            "status": "success",
            "data": {
                "id": str(profile.id),
                "user_id": str(profile.user_id),
                "name": profile.name,
                "registered_name": profile.registered_name,
                "email": profile.email,
                "phone": profile.phone,
                "gstin": profile.gstin,
                "profile_photo_url": getattr(profile, "profile_photo_url", None),
                "company_logo_url": getattr(profile, "company_logo_url", None),
                "created_at": profile.created_at.isoformat() if getattr(profile, "created_at", None) else None,
                "updated_at": profile.updated_at.isoformat() if getattr(profile, "updated_at", None) else None,
            }
        }

    except Exception as e:
        await db.rollback()
        logger.error(f"Error fetching business profile for {user_email}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to load or initialize business profile."
        )