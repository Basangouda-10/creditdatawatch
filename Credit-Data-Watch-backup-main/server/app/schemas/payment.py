"""Payment schemas"""
from pydantic import BaseModel, Field, validator
from datetime import datetime
from typing import Optional, Any, Dict
from enum import Enum


class PaymentMethodEnum(str, Enum):
    """Payment method options"""
    UPI = "upi"
    CREDIT_CARD = "credit_card"
    DEBIT_CARD = "debit_card"
    NET_BANKING = "net_banking"
    QR_CODE = "qr_code"


class PaymentStatusEnum(str, Enum):
    """Payment status options"""
    PENDING = "pending"
    SUCCESS = "success"
    FAILED = "failed"
    CANCELLED = "cancelled"


class PaymentInitiateRequest(BaseModel):
    """Initiate payment request schema"""
    plan_id: str = Field(..., description="Plan ID e.g., BASE, ROYAL, GROUPS, ENTERPRISE")
    payment_method: Optional[str] = Field(default="qr_code", description="Payment method e.g. qr_code, upi")

    @validator("payment_method", pre=True, always=True)
    def normalize_payment_method(cls, v):
        if not v:
            return "qr_code"
        return str(v).lower().strip()


class PaymentVerifyRequest(BaseModel):
    """Verify payment request schema"""
    transaction_id: str = Field(..., description="Transaction ID / UTR Number from payment proof")
    gateway_order_id: Optional[str] = Field(None, description="Gateway order ID if applicable")
    gateway_payment_id: Optional[str] = Field(None, description="Gateway payment ID if applicable")


class PaymentResponse(BaseModel):
    """Payment response schema"""
    id: str
    user_id: str
    plan_id: str
    amount: float
    currency: str = "INR"
    payment_method: str
    payment_provider: Optional[str] = None
    status: str
    transaction_id: Optional[str] = None
    reference_id: str
    gateway_order_id: Optional[str] = None
    gateway_payment_id: Optional[str] = None
    failure_reason: Optional[str] = None
    payment_metadata: Dict[str, Any] = {}
    initiated_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class PaymentInitiateResponse(BaseModel):
    """Payment initiation response schema"""
    payment_id: str
    reference_id: str
    amount: float
    currency: str = "INR"
    plan: Dict[str, Any]
    payment_options: Dict[str, Any]


class PaymentStatusResponse(BaseModel):
    """Payment status response schema"""
    payment_id: str
    status: str
    transaction_id: Optional[str] = None
    amount: float
    created_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None


class PaymentHistoryResponse(BaseModel):
    """Payment history entry schema"""
    id: str
    plan_name: str
    amount: float
    status: str
    payment_method: str
    transaction_id: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True