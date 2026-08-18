from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from enum import Enum

class TransactionType(str, Enum):
    CREDIT = "CREDIT"
    DEBIT = "DEBIT"

class ReferenceType(str, Enum):
    SUBSCRIPTION = "SUBSCRIPTION"
    REFERRAL = "REFERRAL"
    SETTLEMENT_FEE = "SETTLEMENT_FEE"
    BONUS = "BONUS"
    OTHER = "OTHER"

class WalletTransactionResponse(BaseModel):
    id: str
    amount: float
    trans_type: TransactionType
    reference_type: ReferenceType
    reference_id: Optional[str] = None
    description: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class WalletResponse(BaseModel):
    id: str
    user_id: str
    balance: float
    currency: str
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class WalletBalanceResponse(BaseModel):
    balance: float
    currency: str

class WalletHistoryResponse(BaseModel):
    items: List[WalletTransactionResponse]
    total: int
    page: int
    page_size: int

class RedeemRequest(BaseModel):
    amount: float
    reference: str = "SUBSCRIPTION_DISCOUNT"
