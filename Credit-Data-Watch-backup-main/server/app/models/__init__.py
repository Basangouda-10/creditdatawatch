"""
SQLAlchemy ORM Models
"""
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey, Index, Enum, JSON
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import enum
import uuid

from app.database import Base


# Enums for membership and payment system
class UserRole(str, enum.Enum):
    """User roles in the system"""
    USER = "USER"
    COMPANY_ADMIN = "COMPANY_ADMIN"
    FINANCIAL = "FINANCIAL"
    OPERATION = "OPERATION"
    LEGAL = "LEGAL"
    MASTER_ADMIN = "MASTER_ADMIN"


class MembershipStatus(str, enum.Enum):
    """Membership subscription status"""
    PENDING = "PENDING"
    VERIFIED = "VERIFIED"
    PROCESSED = "PROCESSED"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    ACTIVE = "ACTIVE"
    EXPIRED = "EXPIRED"
    CANCELLED = "CANCELLED"


class PaymentStatus(str, enum.Enum):
    """Payment transaction status"""
    PENDING = "pending"
    SUCCESS = "success"
    FAILED = "failed"
    CANCELLED = "cancelled"


class PaymentMethod(str, enum.Enum):
    """Payment methods supported"""
    UPI = "upi"
    CREDIT_CARD = "credit_card"
    DEBIT_CARD = "debit_card"
    NET_BANKING = "net_banking"
    QR_CODE = "qr_code"


class DurationType(str, enum.Enum):
    """Plan duration types"""
    MONTHLY = "monthly"
    YEARLY = "yearly"

CASCADE_DELETE_ORPHAN = "all, delete-orphan"
USER_ID_FK = "users.id"
ONDELETE_CASCADE = "CASCADE"


class Company(Base):
    """Company entity"""

    __tablename__ = "companies"

    id = Column(String(36), primary_key=True, index=True)
    company_name = Column(String(255), nullable=False)
    gstin = Column(String(15), unique=True, nullable=False, index=True)
    domain_name = Column(String(255), nullable=False, index=True)
    is_verified = Column(Boolean, default=False, index=True)
    global_cbi_stars = Column(Float, default=0.0, index=True) # Manual ratings average (0-5 stars)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    users = relationship("User", back_populates="company", cascade=CASCADE_DELETE_ORPHAN)
    purchase_orders = relationship("PurchaseOrder", back_populates="company", cascade=CASCADE_DELETE_ORPHAN)
    sales_invoices = relationship("SalesInvoice", back_populates="company", cascade=CASCADE_DELETE_ORPHAN)
    received_ratings = relationship("CompanyRating", foreign_keys="CompanyRating.to_company_id", back_populates="to_company", cascade=CASCADE_DELETE_ORPHAN)
    given_ratings = relationship("CompanyRating", foreign_keys="CompanyRating.from_company_id", back_populates="from_company", cascade=CASCADE_DELETE_ORPHAN)


class User(Base):
    """User account model (belongs to Company)"""

    __tablename__ = "users"

    id = Column(String(36), primary_key=True, index=True)
    company_id = Column(String(36), ForeignKey("companies.id", ondelete=ONDELETE_CASCADE), nullable=True, index=True)
    name = Column(String(255), nullable=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.USER, index=True)  # MASTER_ADMIN, FINANCIAL, OPERATION, LEGAL, COMPANY_ADMIN, USER
    status = Column(String(20), default="ACTIVE", index=True)  # PENDING, ACTIVE
    phone = Column(String(20), nullable=True, index=True)
    gstin = Column(String(15), nullable=False, index=True)
    company_name = Column(String(255), nullable=True)  # Deprecated display; prefer Company.company_name
    is_active = Column(Boolean, default=True, index=True)
    created_by = Column(String(36), ForeignKey("users.id"), nullable=True)
    subscription_bypass = Column(Boolean, default=False, nullable=False, index=True)
    full_access = Column(Boolean, default=False, nullable=False, index=True)
    subscription_status = Column(String(20), default="INACTIVE", nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    company = relationship("Company", back_populates="users")
    subscription = relationship("Subscription", foreign_keys="Subscription.user_id", back_populates="user", uselist=False, cascade=CASCADE_DELETE_ORPHAN)
    payments = relationship("Payment", back_populates="user", cascade=CASCADE_DELETE_ORPHAN)
    settings = relationship("UserSettings", back_populates="user", uselist=False, cascade=CASCADE_DELETE_ORPHAN)
    business_profiles = relationship("BusinessProfile", back_populates="user", cascade=CASCADE_DELETE_ORPHAN)
    purchase_orders = relationship("PurchaseOrder", foreign_keys="PurchaseOrder.user_id", back_populates="user", cascade=CASCADE_DELETE_ORPHAN)
    sales_invoices = relationship("SalesInvoice", back_populates="user", cascade="all, delete-orphan")
    invoices = relationship("Invoice", back_populates="user", cascade=CASCADE_DELETE_ORPHAN)
    defaulter_cases = relationship("DefaulterCase", back_populates="user", cascade=CASCADE_DELETE_ORPHAN)
    credit_reports = relationship("CreditReport", back_populates="user", cascade=CASCADE_DELETE_ORPHAN)
    settlements = relationship("Settlement", back_populates="user", cascade=CASCADE_DELETE_ORPHAN)
    appointments = relationship("Appointment", back_populates="user", cascade=CASCADE_DELETE_ORPHAN)
    wallet = relationship("Wallet", back_populates="user", uselist=False, cascade=CASCADE_DELETE_ORPHAN)
    audit_logs = relationship("AuditLog", back_populates="user", cascade=CASCADE_DELETE_ORPHAN)

    __table_args__ = (
        Index("idx_user_email_active", "email", "is_active"),
        Index("idx_user_role", "role"),
        Index("idx_user_company", "company_id", "status"),
    )


class AuditLog(Base):
    """Audit log for system traceability"""

    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, index=True)
    user_id = Column(String(36), ForeignKey(USER_ID_FK, ondelete=ONDELETE_CASCADE), nullable=True, index=True)
    user_email = Column(String(255), nullable=True)
    user_name = Column(String(255), nullable=True)
    action = Column(String(50), nullable=False, index=True)
    entity_type = Column(String(50), default="PO", index=True)
    entity_id = Column(String(36), nullable=True, index=True)
    po_number = Column(String(100), nullable=True)
    vendor_name = Column(String(255), nullable=True)
    reason = Column(Text, nullable=True)
    old_data = Column(Text, nullable=True)
    new_data = Column(Text, nullable=True)
    metadata_json = Column(JSON, nullable=True)  # New metadata field as requested
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Relationships
    user = relationship("User", back_populates="audit_logs")

    __table_args__ = (
        Index("idx_audit_log_action", "action", "created_at"),
        Index("idx_audit_log_user_action", "user_id", "action"),
    )


class Subscription(Base):
    """Subscription/plan model"""

    __tablename__ = "subscriptions"

    id = Column(String(36), primary_key=True, index=True)
    user_id = Column(String(36), ForeignKey(USER_ID_FK, ondelete=ONDELETE_CASCADE), nullable=False, index=True)
    plan_id = Column(String(36), ForeignKey("plans.id"), nullable=False, index=True)
    status = Column(String(20), default=MembershipStatus.PENDING, nullable=False, index=True)
    is_active = Column(Boolean, default=False, index=True)
    start_date = Column(DateTime, nullable=True)
    expiry_date = Column(DateTime, nullable=True, index=True)
    payment_id = Column(String(36), ForeignKey("payments.id"), nullable=True, index=True)  # Link to successful payment
    payment_proof_url = Column(String(500), nullable=True)  # QR payment proof
    verified_by = Column(String(36), ForeignKey("users.id"), nullable=True)  # FINANCIAL user
    processed_by = Column(String(36), ForeignKey("users.id"), nullable=True)  # OPERATION user
    approved_by = Column(String(36), ForeignKey("users.id"), nullable=True)  # MASTER_ADMIN user
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="subscription")
    plan = relationship("Plan", back_populates="subscriptions")
    payment = relationship("Payment", back_populates="subscription", foreign_keys=[payment_id])

    __table_args__ = (
        Index("idx_subscription_user_active", "user_id", "is_active"),
        Index("idx_subscription_status", "status"),
    )


class Plan(Base):
    """Membership plan model (admin-configurable)"""

    __tablename__ = "plans"

    id = Column(String(36), primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True, index=True)  # basic, pro, premium
    display_name = Column(String(100), nullable=False)  # "Basic", "Pro", "Premium"
    description = Column(Text, nullable=True)
    duration_type = Column(String(20), default="monthly", nullable=False, index=True)  # monthly, yearly
    price = Column(Float, nullable=False, default=0)  # in INR
    validity_days = Column(Integer, nullable=False, default=30)  # Calculated from duration_type
    follow_up_limit = Column(Integer, nullable=False, default=10)  # max follow-ups per case
    legal_assistance_limit = Column(Integer, nullable=False, default=2)  # max legal escalations per case
    is_active = Column(Boolean, default=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    subscriptions = relationship("Subscription", back_populates="plan", cascade=CASCADE_DELETE_ORPHAN)

    __table_args__ = (
        Index("idx_plan_active", "is_active"),
        Index("idx_plan_duration", "duration_type", "is_active"),
    )


class BusinessProfile(Base):
    """Business profile for multi-unit companies"""

    __tablename__ = "business_profiles"

    id = Column(String(36), primary_key=True, index=True)
    user_id = Column(String(36), ForeignKey(USER_ID_FK, ondelete=ONDELETE_CASCADE), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    registered_name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=False)
    gstin = Column(String(15), nullable=True, index=True)
    profile_photo_url = Column(String(512), nullable=True)  # Google Drive URL
    company_logo_url = Column(String(512), nullable=True)   # Google Drive URL
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="business_profiles")


class CompanyCredibilityIndex(Base):
    __tablename__ = "company_credibility_index"
    id = Column(String(36), primary_key=True, index=True)
    company_id = Column(String(36), ForeignKey("companies.id", ondelete=ONDELETE_CASCADE), nullable=False, unique=True, index=True)
    score = Column(Integer, nullable=False, default=0, index=True)
    grade = Column(String(10), nullable=False, default="D", index=True)
    risk_level = Column(String(20), nullable=False, default="High", index=True)
    ai_summary = Column(Text, nullable=True)
    calculation_window_days = Column(Integer, nullable=False, default=90)
    total_pos = Column(Integer, nullable=False, default=0)
    paid_on_time = Column(Integer, nullable=False, default=0)
    paid_late = Column(Integer, nullable=False, default=0)
    unpaid = Column(Integer, nullable=False, default=0)
    avg_delay_days = Column(Float, nullable=False, default=0.0)
    max_delay_days = Column(Integer, nullable=False, default=0)
    overdue_count = Column(Integer, nullable=False, default=0)
    last_calculated_at = Column(DateTime, nullable=True, index=True)


class CredibilityConfig(Base):
    __tablename__ = "credibility_config"
    id = Column(String(36), primary_key=True, index=True)
    calculation_window_days = Column(Integer, nullable=False, default=90)
    last_updated_at = Column(DateTime, nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class PurchaseOrderAuditLog(Base):
    __tablename__ = "purchase_order_audit_logs"
    id = Column(String(36), primary_key=True, index=True)
    purchase_order_id = Column(String(36), ForeignKey("purchase_orders.id", ondelete=ONDELETE_CASCADE), nullable=False, index=True)
    action = Column(String(50), nullable=False, index=True)  # e.g., MARK_PAID
    performed_by_user_id = Column(String(36), ForeignKey(USER_ID_FK, ondelete=ONDELETE_CASCADE), nullable=False, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    details = Column(JSON, nullable=True)

class CompanyUserEditRequest(Base):
    """Company or User edit/delete request from Operations Team (needs Master Admin approval)"""
    __tablename__ = "company_user_edit_requests"

    id = Column(String(36), primary_key=True, index=True)
    entity_type = Column(String(50), nullable=False, index=True)  # "COMPANY", "USER", "DELETE_USER"
    entity_id = Column(String(36), nullable=False, index=True)
    old_data = Column(JSON, nullable=True)
    new_data = Column(JSON, nullable=True)
    reason = Column(Text, nullable=False)
    requested_by_email = Column(String(255), nullable=False)
    status = Column(String(50), default="PENDING", index=True)
    reviewed_by_email = Column(String(255), nullable=True)
    review_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Re-export Notification
from app.models.notification import Notification

# Re-export Invoice and PurchaseOrder from invoice module
from .invoice import Invoice, PurchaseOrder


class DefaulterCase(Base):
    """Defaulter reporting case"""

    __tablename__ = "defaulter_cases"

    id = Column(String(36), primary_key=True, index=True)
    user_id = Column(String(36), ForeignKey(USER_ID_FK, ondelete=ONDELETE_CASCADE), nullable=False, index=True)
    business_name = Column(String(255), nullable=False)
    business_gstin = Column(String(15), nullable=True, index=True)  # GSTIN optional, PAN fallback allowed
    pan = Column(String(10), nullable=True, index=True)  # PAN as fallback
    invoice_number = Column(String(100), nullable=False)
    amount = Column(Float, nullable=False)
    due_date = Column(DateTime, nullable=False, index=True)
    approval_status = Column(String(50), default="pending", index=True)  # pending, approved, rejected
    verified_by = Column(String(36), nullable=True)  # Admin user ID who verified
    verification_date = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    documents_drive_folder = Column(String(500), nullable=True)  # Google Drive folder ID
    ledger_url = Column(String(500), nullable=True)
    ca_certificate_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="defaulter_cases")

    __table_args__ = (
        Index("idx_defaulter_user_status", "user_id", "approval_status"),
        Index("idx_defaulter_business_gstin", "business_gstin"),
        Index("idx_defaulter_approval_date", "approval_status", "created_at"),
    )


class CreditReport(Base):
    """Credit report request and data"""

    __tablename__ = "credit_reports"

    id = Column(String(36), primary_key=True, index=True)
    user_id = Column(String(36), ForeignKey(USER_ID_FK, ondelete=ONDELETE_CASCADE), nullable=False, index=True)
    entity_name = Column(String(255), nullable=False)
    entity_gstin = Column(String(15), nullable=True, index=True)
    credit_score = Column(Integer, nullable=True)
    status = Column(String(50), default="Requested", index=True)  # Requested, Ready, Pending refresh
    report_url = Column(String(500), nullable=True)  # Google Drive link
    last_updated = Column(DateTime, nullable=True)
    requested_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="credit_reports")

    __table_args__ = (
        Index("idx_credit_user_status", "user_id", "status"),
        Index("idx_credit_entity_gstin", "entity_gstin"),
    )


class Settlement(Base):
    """Settlement/finalization record"""

    __tablename__ = "settlements"

    id = Column(String(36), primary_key=True, index=True)
    user_id = Column(String(36), ForeignKey(USER_ID_FK, ondelete=ONDELETE_CASCADE), nullable=False, index=True)
    case_reference = Column(String(255), nullable=False)  # Reference to defaulter case or PO
    status = Column(String(50), default="Open", index=True)
    notes = Column(Text, nullable=True)
    documents_drive_folder = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="settlements")

    __table_args__ = (
        Index("idx_settlement_user_status", "user_id", "status"),
    )


class Appointment(Base):
    """Appointment booking model"""

    __tablename__ = "appointments"

    id = Column(String(36), primary_key=True, index=True)
    user_id = Column(String(36), ForeignKey(USER_ID_FK, ondelete=ONDELETE_CASCADE), nullable=False, index=True)
    contact_name = Column(String(255), nullable=False)
    contact_email = Column(String(255), nullable=False)
    contact_phone = Column(String(20), nullable=False)
    appointment_date = Column(DateTime, nullable=False, index=True)
    purpose = Column(String(500), nullable=False)
    status = Column(String(50), default="scheduled", index=True)  # scheduled, confirmed, completed, cancelled
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="appointments")

    __table_args__ = (
        Index("idx_appointment_user_status", "user_id", "status"),
        Index("idx_appointment_date", "appointment_date"),
    )


class BusinessRequest(Base):
    """Business risk analysis request for LEGAL role"""
    __tablename__ = "business_requests"

    id = Column(String(36), primary_key=True, index=True)
    user_id = Column(String(36), ForeignKey(USER_ID_FK, ondelete=ONDELETE_CASCADE), nullable=False, index=True)
    user_email = Column(String(255), nullable=True, index=True)
    company_name = Column(String(255), nullable=False)
    gstin = Column(String(15), nullable=True, index=True)
    status = Column(String(20), default="PENDING", index=True)  # PENDING, ANALYZING, COMPLETED
    risk_score = Column(Integer, nullable=True)
    recommendation = Column(Text, nullable=True)
    legal_notes = Column(Text, nullable=True)
    analyzed_by = Column(String(36), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", foreign_keys=[user_id])
    analyzer = relationship("User", foreign_keys=[analyzed_by])


class SupportRequest(Base):
    """Additional support requests from users"""
    __tablename__ = "support_requests"

    id = Column(String(36), primary_key=True, index=True)
    user_id = Column(String(36), ForeignKey(USER_ID_FK, ondelete=ONDELETE_CASCADE), nullable=False, index=True)
    user_name = Column(String(255), nullable=True)
    user_email = Column(String(255), nullable=False, index=True)
    company_name = Column(String(255), nullable=True)
    request_type = Column(String(100), nullable=False, index=True)
    request_details = Column(Text, nullable=False)
    status = Column(String(20), default="PENDING", index=True)  # PENDING, RESOLVED
    admin_response = Column(Text, nullable=True)
    resolved_by = Column(String(36), ForeignKey("users.id"), nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", foreign_keys=[user_id])
    resolver = relationship("User", foreign_keys=[resolved_by])


class Wallet(Base):
    """User wallet for points/credits"""

    __tablename__ = "wallets"

    id = Column(String(36), primary_key=True, index=True)
    user_id = Column(String(36), ForeignKey(USER_ID_FK, ondelete=ONDELETE_CASCADE), nullable=False, unique=True, index=True)
    balance = Column(Float, default=0.0, nullable=False)
    currency = Column(String(20), default="INR_POINTS")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="wallet")
    transactions = relationship("WalletTransaction", back_populates="wallet", cascade=CASCADE_DELETE_ORPHAN)


class WalletTransaction(Base):
    """History of wallet credits/debits"""

    __tablename__ = "wallet_transactions"

    id = Column(String(36), primary_key=True, index=True)
    wallet_id = Column(String(36), ForeignKey("wallets.id", ondelete=ONDELETE_CASCADE), nullable=False, index=True)
    amount = Column(Float, nullable=False)  # Positive for credit, negative for debit
    trans_type = Column(String(20), nullable=False) # CREDIT, DEBIT
    reference_type = Column(String(50), nullable=False) # SUBSCRIPTION, REFERRAL, etc.
    reference_id = Column(String(36), nullable=True)
    description = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Relationships
    wallet = relationship("Wallet", back_populates="transactions")

    __table_args__ = (
        Index("idx_wallet_trans_wallet_date", "wallet_id", "created_at"),
    )


class Payment(Base):
    """Payment transaction model"""

    __tablename__ = "payments"

    id = Column(String(36), primary_key=True, index=True)
    user_id = Column(String(36), ForeignKey(USER_ID_FK, ondelete=ONDELETE_CASCADE), nullable=False, index=True)
    plan_id = Column(String(36), ForeignKey("plans.id"), nullable=False, index=True)
    amount = Column(Float, nullable=False)  # in INR
    currency = Column(String(10), default="INR", nullable=False)
    payment_method = Column(String(20), nullable=False, index=True)
    payment_provider = Column(String(50), nullable=True)  # "razorpay", "payu", "stripe", etc.
    status = Column(String(20), default="pending", nullable=False, index=True)
    transaction_id = Column(String(255), unique=True, nullable=True, index=True)  # Gateway transaction ID
    reference_id = Column(String(255), unique=True, nullable=False, index=True)  # Internal reference
    gateway_order_id = Column(String(255), nullable=True)  # Payment gateway order ID
    gateway_payment_id = Column(String(255), nullable=True)  # Payment ID from gateway
    failure_reason = Column(Text, nullable=True)  # If failed
    payment_metadata = Column(JSON, default=dict)  # Additional payment data
    payment_proof_url = Column(String(500), nullable=True)
    payment_proof_filename = Column(String(255), nullable=True)
    initiated_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="payments")
    plan = relationship("Plan")
    subscription = relationship("Subscription", back_populates="payment", uselist=False)

    __table_args__ = (
        Index("idx_payment_user_status", "user_id", "status"),
        Index("idx_payment_status_created", "status", "created_at"),
    )


class UserSettings(Base):
    """User settings and preferences model"""

    __tablename__ = "user_settings"

    id = Column(String(36), primary_key=True, index=True)
    user_id = Column(String(36), ForeignKey(USER_ID_FK, ondelete=ONDELETE_CASCADE), nullable=False, unique=True, index=True)
    theme_preference = Column(String(20), default="system", nullable=False)  # "light", "dark", "system"
    language = Column(String(10), default="en", nullable=False)
    notifications_enabled = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="settings")

    __table_args__ = (
        Index("idx_user_settings_user", "user_id"),
    )


class Invitation(Base):
    """Employee invitation to join Company"""

    __tablename__ = "invitations"

    id = Column(String(36), primary_key=True, index=True)
    company_id = Column(String(36), ForeignKey("companies.id", ondelete=ONDELETE_CASCADE), nullable=False, index=True)
    email = Column(String(255), nullable=False, index=True)
    role = Column(String(30), nullable=False)  # ADMIN, FINANCE, LEGAL, OPERATIONS
    token = Column(String(255), unique=True, nullable=False, index=True)
    expires_at = Column(DateTime, nullable=False, index=True)
    status = Column(String(20), default="PENDING", index=True)  # PENDING, ACCEPTED
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Relationships
    company = relationship("Company")

class POReminderConfig(Base):
    __tablename__ = "po_reminder_configs"
    id = Column(String(36), primary_key=True, index=True)
    before_days = Column(JSON, nullable=True)
    after_due_daily_enabled = Column(Boolean, default=False)
    reminder_subject = Column(String(255), nullable=True, default="Payment Reminder: PO {po_number} - {vendor_name}")
    reminder_body = Column(Text, nullable=True, default="Dear {vendor_name},\n\nThis is a reminder that PO {po_number} for the amount of ₹{amount} is due on {due_date}.\n\nPlease ensure payment is processed on time.\n\nRegards,\nTeam CreditWatch")

class ScheduledReminder(Base):
    __tablename__ = "scheduled_reminders"
    id = Column(String(36), primary_key=True, index=True)
    purchase_order_id = Column(String(36), ForeignKey("purchase_orders.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    subject = Column(String(255), nullable=False)
    body = Column(Text, nullable=False)
    scheduled_at = Column(DateTime, nullable=False, index=True)
    sent_at = Column(DateTime, nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

class AppSettings(Base):
    __tablename__ = "app_settings"
    id = Column(String(36), primary_key=True, index=True)
    payment_window_days = Column(Integer, nullable=False, default=50)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class CompanyRating(Base):
    """Manual ratings from one company to another"""
    __tablename__ = "company_ratings"
    id = Column(String(36), primary_key=True, index=True)
    from_company_id = Column(String(36), ForeignKey("companies.id", ondelete=ONDELETE_CASCADE), nullable=False, index=True)
    to_company_id = Column(String(36), ForeignKey("companies.id", ondelete=ONDELETE_CASCADE), nullable=False, index=True)
    rating = Column(Integer, nullable=False, index=True)  # 1-5 stars
    review = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    from_company = relationship("Company", foreign_keys=[from_company_id], back_populates="given_ratings")
    to_company = relationship("Company", foreign_keys=[to_company_id], back_populates="received_ratings")

    __table_args__ = (
        Index("idx_rating_from_to", "from_company_id", "to_company_id", unique=True),
    )


class SOPDocument(Base):
    """SOP document for chat assistant context"""

    __tablename__ = "sop_documents"

    id = Column(String(36), primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    uploaded_by = Column(String(36), nullable=True)


# New models for Global Credibility Index Feature
from app.models.credibility_index import (
    CredibilityReview,
    CredibilityReviewStage,
    GlobalCredibilityIndex,
    CredibilityReviewStatus,
    CredibilityReviewStage as ReviewStageEnum,
    ReviewDecision,
    PaymentHistory,
    FinancialRiskLevel,
    LegalStatus,
    OperationalReliability,
    DisputeHistory,
    AICreditRiskVerdict,
    CredibilityStatus
)

class SalesInvoice(Base):
    """Tax invoice raised to a customer — new entry point replacing PO as the primary workflow start"""

    __tablename__ = "sales_invoices"

    id = Column(String(36), primary_key=True, index=True)
    company_id = Column(String(36), ForeignKey("companies.id", ondelete=ONDELETE_CASCADE), nullable=True, index=True)
    user_id = Column(String(36), ForeignKey(USER_ID_FK, ondelete=ONDELETE_CASCADE), nullable=False, index=True)

    invoice_number = Column(String(100), nullable=False, index=True)
    invoice_date = Column(DateTime, nullable=False, index=True)
    payment_due_date = Column(DateTime, nullable=False, index=True)

    po_number = Column(String(100), nullable=True, index=True)
    po_date = Column(DateTime, nullable=True)

    customer_name = Column(String(255), nullable=False)
    customer_address = Column(Text, nullable=True)
    customer_gstin = Column(String(15), nullable=True, index=True)
    customer_pan = Column(String(10), nullable=True)

    ship_to_name = Column(String(255), nullable=True)
    ship_to_address = Column(Text, nullable=True)

    country = Column(String(2), nullable=False, default="IN", index=True)

    lut_arn = Column(String(50), nullable=True)
    lut_filing_date = Column(DateTime, nullable=True)
    msme_no = Column(String(50), nullable=True)
    place_of_supply = Column(String(100), nullable=True)
    is_sez_supply = Column(Boolean, default=False)

    sub_total = Column(Float, nullable=False, default=0.0)
    tax_amount = Column(Float, nullable=False, default=0.0)
    total_amount = Column(Float, nullable=False, default=0.0)
    balance_due = Column(Float, nullable=False, default=0.0)

    status = Column(String(50), default="Draft", index=True)
    archived = Column(Boolean, default=False, index=True)

    document_url = Column(String(500), nullable=True)
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="sales_invoices")
    company = relationship("Company", back_populates="sales_invoices")
    items = relationship("SalesInvoiceItem", back_populates="invoice", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_sales_invoice_company_status", "company_id", "status"),
        Index("idx_sales_invoice_number", "invoice_number"),
        Index("idx_sales_invoice_due_date", "payment_due_date"),
    )


class SalesInvoiceItem(Base):
    """Line item on a sales invoice"""

    __tablename__ = "sales_invoice_items"

    id = Column(String(36), primary_key=True, index=True)
    invoice_id = Column(String(36), ForeignKey("sales_invoices.id", ondelete=ONDELETE_CASCADE), nullable=False, index=True)

    description = Column(Text, nullable=False)
    hsn_sac = Column(String(20), nullable=True)
    quantity = Column(Float, nullable=False, default=1.0)
    rate = Column(Float, nullable=False)
    igst_percent = Column(Float, nullable=True, default=0.0)
    amount = Column(Float, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    invoice = relationship("SalesInvoice", back_populates="items")


class SalesInvoiceAuditLog(Base):
    """Mirrors PurchaseOrderAuditLog for sales invoices"""

    __tablename__ = "sales_invoice_audit_logs"

    id = Column(String(36), primary_key=True, index=True)
    sales_invoice_id = Column(String(36), ForeignKey("sales_invoices.id", ondelete=ONDELETE_CASCADE), nullable=False, index=True)
    action = Column(String(50), nullable=False, index=True)
    performed_by_user_id = Column(String(36), ForeignKey(USER_ID_FK, ondelete=ONDELETE_CASCADE), nullable=False, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    details = Column(JSON, nullable=True)