from datetime import datetime
import uuid
from sqlalchemy import (
    Column,
    String,
    Integer,
    Float,
    Boolean,
    DateTime,
    Date,
    Text,
    ForeignKey,
    Index,
    JSON,
    Numeric,
    func,
)
from sqlalchemy.orm import relationship
from app.database import Base

USER_ID_FK = "users.id"
ONDELETE_CASCADE = "CASCADE"


class Invoice(Base):
    """Master Sales Invoice schema containing company snapshot, tax, and banking details."""

    __tablename__ = "invoices"

    # Primary Keys & Ownership
    id = Column(String(36), primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    company_id = Column(
        String(36),
        ForeignKey("companies.id", ondelete=ONDELETE_CASCADE),
        nullable=True,
        index=True,
    )
    user_id = Column(
        String(36),
        ForeignKey(USER_ID_FK, ondelete=ONDELETE_CASCADE),
        nullable=False,
        index=True,
    )

    # Issuer Company Snapshot
    company_name = Column(String(255), nullable=True)
    company_address = Column(Text, nullable=True)
    company_gstin = Column(String(15), nullable=True, index=True)
    company_pan = Column(String(10), nullable=True, index=True)
    cin = Column(String(50), nullable=True)
    msme_no = Column(String(50), nullable=True)

    # Invoice Identifiers & Dates
    invoice_number = Column(String(100), nullable=False, index=True)
    invoice_date = Column(DateTime, nullable=True, index=True)
    payment_due_date = Column(DateTime, nullable=True, index=True)
    payment_terms = Column(String(100), nullable=True, default="Net 30")
    po_number = Column(String(100), nullable=True, index=True)
    po_date = Column(DateTime, nullable=True)
    expected_delivery_date = Column(DateTime, nullable=True)

    # Counterparty & Addresses
    counterparty_name = Column(String(255), nullable=False)
    counterparty_gstin = Column(String(15), nullable=True, index=True)
    counterparty_pan = Column(String(10), nullable=True, index=True)
    
    # --- NEW COLUMNS ADDED HERE ---
    customer_email = Column(String(255), nullable=True)
    customer_mobile = Column(String(50), nullable=True)
    # ------------------------------

    bill_to = Column(JSON, nullable=True)
    ship_to = Column(JSON, nullable=True)

    # Tax Compliance & Location
    country = Column(String(2), default="IN", nullable=False)
    currency = Column(String(3), default="INR", nullable=False)
    lut_arn = Column(String(50), nullable=True)
    lut_filing_date = Column(DateTime, nullable=True)
    place_of_supply = Column(String(100), nullable=True)
    is_sez_export = Column(Boolean, default=False)

    # Financial Amounts & Line Items
    items = Column(JSON, default=list)
    subtotal = Column(Float, default=0.0)
    discount_amount = Column(Float, default=0.0)
    tax_breakdown = Column(JSON, nullable=True)
    tax_amount = Column(Float, default=0.0)
    round_off = Column(Float, default=0.0)
    total = Column(Float, default=0.0, nullable=False)
    balance_due = Column(Float, default=0.0)
    exchange_rate = Column(Float, default=1.0)

    # Logistics & GST Rules
    reverse_charge = Column(Boolean, default=False)
    eway_bill_number = Column(String(100), nullable=True)

    # Banking Snapshot
    bank_account_name = Column(String(255), nullable=True)
    bank_account_number = Column(String(100), nullable=True)
    bank_ifsc = Column(String(20), nullable=True)
    bank_name = Column(String(255), nullable=True)
    bank_upi_id = Column(String(100), nullable=True)

    # Status & Tracking
    status = Column(String(50), default="Draft", index=True)
    archived = Column(Boolean, default=False, index=True)
    document_url = Column(String(500), nullable=True)
    notes = Column(Text, nullable=True)

    # Compatibility Aliases & Follow-ups
    amount = Column(Float, nullable=True)
    due_date = Column(DateTime, nullable=True)
    reminder_frequency_days = Column(Integer, default=7)
    reminder_next_at = Column(DateTime, nullable=True)
    last_follow_up_at = Column(DateTime, nullable=True)
    follow_up_history = Column(JSON, default=list)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="invoices")

    __table_args__ = (
        Index("idx_inv_company_status", "company_id", "status"),
        Index("idx_inv_number", "invoice_number"),
        Index("idx_inv_counterparty", "counterparty_gstin", "counterparty_pan"),
    )


class PurchaseOrder(Base):
    """Standalone schema for handling Purchase Orders with company foreign key."""

    __tablename__ = "purchase_orders"

    id = Column(String(100), primary_key=True, default=lambda: str(uuid.uuid4()))
    company_id = Column(
        String(36),
        ForeignKey("companies.id", ondelete=ONDELETE_CASCADE),
        nullable=True,
        index=True,
    )
    user_id = Column(
        String(100),
        ForeignKey(USER_ID_FK, ondelete=ONDELETE_CASCADE),
        nullable=False,
        index=True,
    )
    po_number = Column(String(100), index=True)
    vendor = Column(String(255), nullable=True)
    vendor_name = Column(String(255), nullable=True)
    vendor_gstin = Column(String(50), nullable=True)
    vendor_email = Column(String(255), nullable=True)
    vendor_mobile = Column(String(50), nullable=True)
    amount = Column(Numeric(12, 2))
    due_date = Column(DateTime, nullable=True, index=True)
    status = Column(String(50), default="PENDING", index=True)
    document_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    company = relationship("Company", back_populates="purchase_orders")
    user = relationship("User", back_populates="purchase_orders")