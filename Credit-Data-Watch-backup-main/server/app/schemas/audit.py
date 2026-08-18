"""
Pydantic schemas for audit logs
"""
from pydantic import BaseModel
from typing import Optional, Any, Dict
from datetime import datetime


class AuditLogBase(BaseModel):
    """Base audit log schema"""
    action: str
    entity: str
    entity_id: Optional[str] = None
    extra_data: Optional[Dict[str, Any]] = None


class AuditLogCreate(AuditLogBase):
    """Schema for creating an audit log"""
    user_id: str


class AuditLogResponse(AuditLogBase):
    """Schema for audit log response"""
    id: str
    user_id: str
    timestamp: datetime

    class Config:
        from_attributes = True
