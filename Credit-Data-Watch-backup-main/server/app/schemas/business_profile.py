"""Business Profile schemas"""
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional


class BusinessProfileResponse(BaseModel):
    """Business profile response"""
    id: str
    user_id: str
    name: str
    registered_name: str
    email: str
    phone: str
    gstin: Optional[str] = None
    profile_photo_url: Optional[str] = None
    company_logo_url: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class BusinessProfileUpdateRequest(BaseModel):
    """Business profile update request"""
    name: Optional[str] = None
    registered_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    gstin: Optional[str] = Field(None, min_length=15, max_length=15)
    profile_photo_url: Optional[str] = None
    company_logo_url: Optional[str] = None


class FileUploadRequest(BaseModel):
    """File upload response with Drive URL"""
    file_type: str = Field(..., description="'profile_photo' or 'company_logo'")
    drive_url: str = Field(..., description="Google Drive file URL")
