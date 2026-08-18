"""
New models for Global Credibility Index Auto-Addition Feature
"""
from sqlalchemy import Column, String, Integer, Float, DateTime, Text, ForeignKey, Index, Enum, JSON
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import enum
import uuid

from app.database import Base
from app.models import USER_ID_FK, ONDELETE_CASCADE, User, BusinessRequest, Company


# Enums for Credibility Review system
class CredibilityReviewStatus(str, enum.Enum):
    PENDING_FINANCIAL = "pending_financial"
    PENDING_LEGAL = "pending_legal"
    PENDING_OPERATIONS = "pending_operations"
    PENDING_MASTER_ADMIN = "pending_master_admin"
    APPROVED = "approved"
    REJECTED_FINAL = "rejected_final"
    REJECTED_FINANCIAL = "rejected_financial"
    REJECTED_LEGAL = "rejected_legal"
    REJECTED_OPERATIONS = "rejected_operations"


class CredibilityReviewStage(str, enum.Enum):
    FINANCIAL = "financial"
    LEGAL = "legal"
    OPERATIONS = "operations"
    MASTER_ADMIN = "master_admin"


class ReviewDecision(str, enum.Enum):
    APPROVED = "approved"
    REJECTED = "rejected"


class PaymentHistory(str, enum.Enum):
    EXCELLENT = "Excellent"
    GOOD = "Good"
    AVERAGE = "Average"
    POOR = "Poor"


class FinancialRiskLevel(str, enum.Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"


class LegalStatus(str, enum.Enum):
    CLEAN = "Clean"
    MINOR_DISPUTES = "Minor Disputes"
    ACTIVE_LITIGATION = "Active Litigation"
    BLACKLISTED = "Blacklisted"


class OperationalReliability(str, enum.Enum):
    EXCELLENT = "Excellent"
    GOOD = "Good"
    AVERAGE = "Average"
    POOR = "Poor"


class DisputeHistory(str, enum.Enum):
    NONE = "None"
    MINOR = "Minor"
    MAJOR = "Major"


class AICreditRiskVerdict(str, enum.Enum):
    LOW_RISK = "Low Risk"
    MEDIUM_RISK = "Medium Risk"
    HIGH_RISK = "High Risk"
    NOT_RATED = "Not Rated"


class CredibilityStatus(str, enum.Enum):
    CREDIBILITY_VERIFIED = "Credibility Verified"
    STANDARD = "Standard"


class CredibilityReview(Base):
    """Main review record for company credibility"""
    __tablename__ = "credibility_reviews"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    business_request_id = Column(String(36), ForeignKey("business_requests.id", ondelete=ONDELETE_CASCADE), nullable=True, index=True)
    company_name = Column(String(255), nullable=False)
    company_registration_no = Column(String(50), nullable=True)
    submitted_by_user_id = Column(String(36), ForeignKey(USER_ID_FK, ondelete=ONDELETE_CASCADE), nullable=False, index=True)
    status = Column(Enum(CredibilityReviewStatus), default=CredibilityReviewStatus.PENDING_FINANCIAL, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    business_request = relationship("BusinessRequest", foreign_keys=[business_request_id])
    submitted_by_user = relationship("User", foreign_keys=[submitted_by_user_id])
    stages = relationship("CredibilityReviewStage", back_populates="review", cascade="all, delete-orphan")
    global_credibility_entry = relationship("GlobalCredibilityIndex", back_populates="credibility_review", uselist=False)


class CredibilityReviewStage(Base):
    """Individual stage review details"""
    __tablename__ = "credibility_review_stages"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    credibility_review_id = Column(String(36), ForeignKey("credibility_reviews.id", ondelete=ONDELETE_CASCADE), nullable=False, index=True)
    stage = Column(Enum(CredibilityReviewStage), nullable=False, index=True)
    reviewed_by_user_id = Column(String(36), ForeignKey(USER_ID_FK, ondelete=ONDELETE_CASCADE), nullable=True, index=True)
    decision = Column(Enum(ReviewDecision), nullable=True)

    # Financial stage fields
    financial_health_score = Column(Integer, nullable=True)  # 1-10
    payment_history = Column(Enum(PaymentHistory), nullable=True)
    financial_risk_level = Column(Enum(FinancialRiskLevel), nullable=True)

    # Legal stage fields
    legal_status = Column(Enum(LegalStatus), nullable=True)
    compliance_score = Column(Integer, nullable=True)  # 1-10
    court_cases = Column(Integer, nullable=True)

    # Operations stage fields
    operational_reliability = Column(Enum(OperationalReliability), nullable=True)
    dispute_history = Column(Enum(DisputeHistory), nullable=True)
    partner_trust_score = Column(Float, nullable=True)  # 1-5 stars
    ai_credit_risk_verdict = Column(Enum(AICreditRiskVerdict), nullable=True)

    notes = Column(Text, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)

    # Relationships
    review = relationship("CredibilityReview", back_populates="stages")
    reviewed_by_user = relationship("User", foreign_keys=[reviewed_by_user_id])


class GlobalCredibilityIndex(Base):
    """Companies approved and added to Global Credibility Index"""
    __tablename__ = "global_credibility_index"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    company_id = Column(String(36), ForeignKey("companies.id", ondelete=ONDELETE_CASCADE), nullable=True, index=True, unique=True)
    company_name = Column(String(255), nullable=False, index=True)
    company_registration_no = Column(String(50), nullable=True, index=True)

    partner_trust_score = Column(Float, nullable=False, default=0.0)
    ai_credit_risk_verdict = Column(Enum(AICreditRiskVerdict), default=AICreditRiskVerdict.NOT_RATED)
    credibility_status = Column(Enum(CredibilityStatus), default=CredibilityStatus.STANDARD)

    # Scores from reviews
    financial_health_score = Column(Integer, nullable=True)
    legal_status = Column(Enum(LegalStatus), nullable=True)
    operational_reliability = Column(Enum(OperationalReliability), nullable=True)

    approved_by_master_admin_id = Column(String(36), ForeignKey(USER_ID_FK, ondelete=ONDELETE_CASCADE), nullable=True, index=True)
    approved_at = Column(DateTime, nullable=True)
    credibility_review_id = Column(String(36), ForeignKey("credibility_reviews.id", ondelete=ONDELETE_CASCADE), nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    approved_by_master_admin = relationship("User", foreign_keys=[approved_by_master_admin_id])
    credibility_review = relationship("CredibilityReview", back_populates="global_credibility_entry")
    company = relationship("Company", foreign_keys=[company_id])
