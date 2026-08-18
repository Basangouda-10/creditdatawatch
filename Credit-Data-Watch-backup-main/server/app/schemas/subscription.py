"""Subscription schemas"""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class PlanCreate(BaseModel):
    """Admin creates a plan"""
    name: str = Field(..., min_length=1)
    display_name: str = Field(..., min_length=1)
    description: Optional[str] = None
    price: float = Field(..., ge=0)
    validity_days: int = Field(..., gt=0)
    follow_up_limit: int = Field(..., ge=0)
    legal_assistance_limit: int = Field(..., ge=0)


class PlanUpdate(BaseModel):
    """Admin updates a plan"""
    display_name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = Field(None, ge=0)
    validity_days: Optional[int] = Field(None, gt=0)
    follow_up_limit: Optional[int] = Field(None, ge=0)
    legal_assistance_limit: Optional[int] = Field(None, ge=0)


class PlanResponse(BaseModel):
    """Plan response schema"""
    id: str
    name: str
    display_name: str
    description: Optional[str] = None
    duration_type: str  # "monthly" or "yearly"
    price: float
    validity_days: int
    follow_up_limit: int
    legal_assistance_limit: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class SubscriptionRequest(BaseModel):
    """Subscription purchase request"""
    plan_id: str = Field(..., description="Plan ID to purchase")
    payment_proof_url: Optional[str] = Field(None, description="URL of payment screenshot")
    transaction_id: Optional[str] = Field(None, description="Payment transaction ID")


class ProofUploadRequest(BaseModel):
    """Payment proof upload request"""
    payment_proof_url: str = Field(..., description="URL of payment screenshot")


class RejectRequest(BaseModel):
    """Subscription rejection request"""
    reason: str = Field(..., min_length=1)


class WorkflowActionRequest(BaseModel):
    """Workflow action request (verify, process, approve/reject)"""
    subscription_id: str = Field(...)
    action: str = Field(..., pattern="^(VERIFY|PROCESS|APPROVE|REJECT)$")
    notes: Optional[str] = None


class SubscriptionResponse(BaseModel):
    """Subscription response schema"""
    id: str
    user_id: str
    plan_id: str
    status: str  # PENDING, VERIFIED, PROCESSED, APPROVED, REJECTED, ACTIVE
    is_active: bool
    start_date: Optional[datetime] = None
    expiry_date: Optional[datetime] = None
    payment_id: Optional[str] = None
    payment_proof_url: Optional[str] = None
    transaction_id: Optional[str] = None
    verified_by: Optional[str] = None
    processed_by: Optional[str] = None
    approved_by: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    plan: Optional[PlanResponse] = None

    class Config:
        from_attributes = True


class SubscriptionStatusResponse(BaseModel):
    """Current subscription status"""
    has_active_subscription: bool
    subscription: Optional[SubscriptionResponse] = None
    days_remaining: Optional[int] = None
    is_expired: bool = False
