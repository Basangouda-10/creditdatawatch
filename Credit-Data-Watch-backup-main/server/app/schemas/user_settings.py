"""User settings schemas"""
from pydantic import BaseModel, Field
from typing import Optional, Literal


class ThemePreference(str):
    """Theme preference options"""
    LIGHT = "light"
    DARK = "dark"
    SYSTEM = "system"


class UserSettingsResponse(BaseModel):
    """User settings response schema"""
    theme_preference: str = Field(default="system", description="Theme preference: light, dark, or system")
    language: str = Field(default="en", description="Language preference")
    notifications_enabled: bool = Field(default=True, description="Notifications enabled/disabled")

    class Config:
        from_attributes = True


class UpdateUserSettingsRequest(BaseModel):
    """Update user settings request"""
    theme_preference: Optional[Literal["light", "dark", "system"]] = Field(None, description="Theme preference")
    language: Optional[str] = Field(None, description="Language preference")
    notifications_enabled: Optional[bool] = Field(None, description="Notifications enabled/disabled")
