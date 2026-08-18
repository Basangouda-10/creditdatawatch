from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum


class PaymentHistory(str, Enum):
    EXCELLENT = "Excellent"
    GOOD = "Good"
    AVERAGE = "Average"
    POOR = "Poor"


class FinancialRiskLevel(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"


class LegalStatus(str, Enum):
    CLEAN = "Clean"
    MINOR_DISPUTES = "Minor Disputes"
    ACTIVE_LITIGATION = "Active Litigation"
    BLACKLISTED = "Blacklisted"


class OperationalReliability(str, Enum):
    EXCELLENT = "Excellent"
    GOOD = "Good"
    AVERAGE = "Average"
    POOR = "Poor"


class DisputeHistory(str, Enum):
    NONE = "None"
    MINOR = "Minor"
    MAJOR = "Major"


class AICreditRiskVerdict(str, Enum):
    LOW_RISK = "Low Risk"
    MEDIUM_RISK = "Medium Risk"
    HIGH_RISK = "High Risk"
    NOT_RATED = "Not Rated"


class CredibilityStatus(str, Enum):
    CREDIBILITY_VERIFIED = "Credibility Verified"
    STANDARD = "Standard"


# Input Schemas
class CredibilityReviewInitiate(BaseModel):
    business_request_id: str
    company_registration_no: Optional[str] = None


class FinancialReviewSubmit(BaseModel):
    approve: bool
    financial_health_score: int = Field(..., ge=1, le=10)
    payment_history: PaymentHistory
    financial_risk_level: FinancialRiskLevel
    notes: Optional[str] = None


class LegalReviewSubmit(BaseModel):
    approve: bool
    legal_status: LegalStatus
    compliance_score: int = Field(..., ge=1, le=10)
    court_cases: int = Field(..., ge=0)
    notes: Optional[str] = None


class OperationsReviewSubmit(BaseModel):
    approve: bool
    operational_reliability: OperationalReliability
    dispute_history: DisputeHistory
    partner_trust_score: float = Field(..., ge=1.0, le=5.0)
    ai_credit_risk_verdict: AICreditRiskVerdict
    notes: Optional[str] = None


class MasterAdminDecisionSubmit(BaseModel):
    approve: bool
    partner_trust_score: Optional[float] = Field(None, ge=1.0, le=5.0)
    ai_credit_risk_verdict: Optional[AICreditRiskVerdict] = None
    credibility_status: CredibilityStatus = CredibilityStatus.STANDARD
    notes: Optional[str] = None


# Output Schemas
class CredibilityReviewOut(BaseModel):
    id: str
    business_request_id: str
    company_name: str
    company_registration_no: Optional[str] = None
    submitted_by_user_id: str
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CredibilityReviewStageOut(BaseModel):
    id: str
    credibility_review_id: str
    stage: str
    reviewed_by_user_id: Optional[str] = None
    decision: Optional[str] = None
    financial_health_score: Optional[int] = None
    payment_history: Optional[str] = None
    financial_risk_level: Optional[str] = None
    legal_status: Optional[str] = None
    compliance_score: Optional[int] = None
    court_cases: Optional[int] = None
    operational_reliability: Optional[str] = None
    dispute_history: Optional[str] = None
    partner_trust_score: Optional[float] = None
    ai_credit_risk_verdict: Optional[str] = None
    notes: Optional[str] = None
    reviewed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CredibilityReviewWithStagesOut(CredibilityReviewOut):
    stages: list[CredibilityReviewStageOut] = []

    class Config:
        from_attributes = True


class CredibilityReviewFullOut(CredibilityReviewWithStagesOut):
    pass


class GlobalCredibilityIndexOut(BaseModel):
    id: str
    company_name: str
    company_registration_no: Optional[str] = None
    partner_trust_score: float
    ai_credit_risk_verdict: str
    credibility_status: str
    financial_health_score: Optional[int] = None
    legal_status: Optional[str] = None
    operational_reliability: Optional[str] = None
    approved_by_master_admin_id: Optional[str] = None
    approved_at: Optional[datetime] = None
    credibility_review_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
