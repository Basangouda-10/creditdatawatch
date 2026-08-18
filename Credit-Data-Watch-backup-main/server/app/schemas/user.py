"""
Pydantic schemas for user
"""
from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from datetime import datetime


class UserProfileResponse(BaseModel):
    """User profile response"""

    id: str
    role: str
    gstin: str
    company_name: Optional[str] = None
    email: str
    phone: Optional[str] = None
    is_active: bool
    subscription_status: Optional[str] = None
    subscription_bypass: Optional[bool] = None
    full_access: Optional[bool] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UpdateProfileRequest(BaseModel):
    """Update user profile"""

    company_name: Optional[str] = Field(None, min_length=2, max_length=255)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, min_length=10, max_length=20)


class CreateInternalUserRequest(BaseModel):
    """Admin creates a back-office user"""
    email: str = Field(..., description="Email address")
    password: str = Field(..., min_length=6, description="Initial password")
    role: str = Field(..., description="LEGAL, OPERATION, FINANCIAL, etc")
    name: Optional[str] = Field(None, description="User full name")
    gstin: Optional[str] = Field(None, description="GSTIN (optional for internal)")


class InvitationCreate(BaseModel):
    """Admin invites a user"""
    email: str = Field(..., description="Email address")
    expiry_hours: int = Field(24, ge=1, le=168, description="Hours until expiry")


class InvitationUpdate(BaseModel):
    """Admin updates an invitation"""
    expiry_hours: Optional[int] = Field(None, ge=1, le=168, description="Hours until expiry")


class UserRoleUpdateRequest(BaseModel):
    """Admin updates user role"""
    role: str = Field(..., pattern="^(USER|COMPANY_ADMIN)$")


class SubscriptionResponse(BaseModel):
    """Subscription/plan response"""

    id: str
    plan: str
    is_active: bool
    start_date: datetime
    expiry_date: Optional[datetime] = None

    class Config:
        from_attributes = True
