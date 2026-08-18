"""
Pydantic schemas for features (PO, defaulter, credit report, settlement, invoice)
"""
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import Optional, List, Dict, Any, Union
from datetime import datetime
from uuid import UUID


class PurchaseOrderRequest(BaseModel):
    """Create/update purchase order"""
    po_number: str = Field(..., min_length=1, max_length=100)
    vendor: str = Field(..., min_length=2, max_length=255)
    gstin: Optional[str] = Field(None, min_length=15, max_length=15)
    amount: float = Field(..., gt=0)
    due_date: datetime
    vendor_email: Optional[str] = None
    vendor_phone: Optional[str] = None
    status: Optional[str] = "Open"
    notes: Optional[str] = None
    document_url: Optional[str] = None
    evidence_url: Optional[str] = None
    supplier_address: Optional[str] = None
    delivery_address: Optional[str] = None
    invoice_address: Optional[str] = None
    payment_window_days: Optional[int] = 50
    reason: Optional[str] = None


class PurchaseOrderUpdate(BaseModel):
    """Update purchase order"""
    po_number: Optional[str] = None
    vendor: Optional[str] = None
    gstin: Optional[str] = None
    amount: Optional[float] = None
    due_date: Optional[datetime] = None
    vendor_email: Optional[str] = None
    vendor_phone: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    document_url: Optional[str] = None
    evidence_url: Optional[str] = None
    supplier_address: Optional[str] = None
    delivery_address: Optional[str] = None
    invoice_address: Optional[str] = None
    payment_window_days: Optional[int] = None
    reason: Optional[str] = None


class GenericReasonRequest(BaseModel):
    """Generic request with reason"""
    reason: Optional[str] = "No reason provided"


class ArchiveRequest(BaseModel):
    """Archive/unarchive request"""
    reason: Optional[str] = "PO archive status updated"


class ReminderRequest(BaseModel):
    """Manual vendor reminder request"""
    subject: Optional[str] = None
    body: Optional[str] = None
    scheduled_at: Optional[str] = None
    include_legal_notice: Optional[bool] = False
    legal_notice_content: Optional[str] = ""


class AdminSettingsRequest(BaseModel):
    """Update admin settings request"""
    reminder_subject_template: Optional[str] = None
    reminder_body_template: Optional[str] = None
    payment_window_days: Optional[int] = 50


class OTPVerifyRequest(BaseModel):
    """Generic OTP verification request"""
    otp: str = Field(..., min_length=6, max_length=6)
    token: Optional[str] = None


class PhoneChangeRequest(BaseModel):
    """Request to change phone number"""
    new_phone: str = Field(..., min_length=10, max_length=15)


class EmailChangeRequest(BaseModel):
    """Request to change email"""
    new_email: EmailStr


class POApprovalRequest(BaseModel):
    """Approve/reject PO request"""
    action: str = Field(..., pattern="^(APPROVE|REJECT)$")
    reason: Optional[str] = None


class PurchaseOrderResponse(BaseModel):
    """Purchase order response"""

    id: str
    number: str
    vendor_name: str
    vendor_gstin: Optional[str] = None
    amount: float
    due_date: datetime
    status: str
    document_url: Optional[str] = None
    evidence_url: Optional[str] = None
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class GSTINCheckRequest(BaseModel):
    """GSTIN check request"""
    gstin: str = Field(..., min_length=15, max_length=15)


class GSTINCheckResponse(BaseModel):
    """GSTIN check response"""
    status: str
    credibility_score: int
    risk_level: str


class BusinessRequestSchema(BaseModel):
    """Business risk analysis request"""
    id: str
    company_name: str
    gstin: Optional[str] = None
    status: str
    risk_score: Optional[int] = None
    recommendation: Optional[str] = None
    legal_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class BusinessReportSubmit(BaseModel):
    """LEGAL team report submission"""
    request_id: str
    risk_score: int = Field(..., ge=0, le=100)
    recommendation: str
    legal_notes: Optional[str] = None


class BusinessRequestCreate(BaseModel):
    """Create business risk analysis request"""
    company_name: str
    gstin: Optional[str] = Field(None, min_length=15, max_length=15)


class DefaulterCaseRequest(BaseModel):
    """Create defaulter case"""

    business_name: str = Field(..., min_length=2, max_length=255)
    business_gstin: Optional[str] = Field(None, min_length=15, max_length=15)
    pan: Optional[str] = Field(None, min_length=10, max_length=10)
    invoice_number: str = Field(..., min_length=1, max_length=100)
    amount: float = Field(..., gt=0)
    due_date: datetime
    notes: Optional[str] = None
    documents_drive_folder: Optional[str] = None


class DefaulterCaseUpdate(BaseModel):
    """Update defaulter case"""
    business_name: Optional[str] = None
    business_gstin: Optional[str] = None
    pan: Optional[str] = None
    invoice_number: Optional[str] = None
    amount: Optional[float] = None
    due_date: Optional[datetime] = None
    notes: Optional[str] = None
    documents_drive_folder: Optional[str] = None
    ledger_url: Optional[str] = None
    ca_certificate_url: Optional[str] = None


class DefaulterVerifyRequest(BaseModel):
    """Admin verifies defaulter case"""
    action: str = Field(..., pattern="^(approve|reject)$")
    notes: Optional[str] = None


class POReminderConfigUpdate(BaseModel):
    """Update PO reminder configuration"""
    before_days: Optional[int] = Field(None, ge=1)
    after_due_daily_enabled: Optional[bool] = None
    reminder_subject: Optional[str] = None
    reminder_body: Optional[str] = None


class DefaulterCaseResponse(BaseModel):
    """Defaulter case response"""

    id: str
    business_name: str
    business_gstin: Optional[str] = None
    invoice_number: str
    amount: float
    due_date: datetime
    status: str
    notes: Optional[str] = None
    documents_drive_folder: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CreditReportRequest(BaseModel):
    """Request credit report"""

    entity_name: str = Field(..., min_length=2, max_length=255)
    entity_gstin: Optional[str] = Field(None, min_length=15, max_length=15)


class CreditReportUpdate(BaseModel):
    """Update credit report (admin/system)"""

    credit_score: Optional[int] = Field(None, ge=0, le=900)
    status: Optional[str] = None
    report_url: Optional[str] = None
    last_updated: Optional[datetime] = None


class CreditReportCompleteRequest(BaseModel):
    """LEGAL completes credit report"""

    report_url: str
    credit_score: int = Field(..., ge=0, le=900)


class CreditReportResponse(BaseModel):
    """Credit report response"""

    id: str
    entity_name: str
    entity_gstin: Optional[str] = None
    credit_score: Optional[int] = None
    status: str
    report_url: Optional[str] = None
    last_updated: Optional[datetime] = None
    requested_at: datetime
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SettlementRequest(BaseModel):
    """Create settlement record"""

    case_reference: str = Field(..., min_length=1, max_length=255)
    notes: Optional[str] = None


class SettlementUpdate(BaseModel):
    """Update settlement record"""

    case_reference: Optional[str] = Field(None, min_length=1, max_length=255)
    status: Optional[str] = None
    notes: Optional[str] = None
    documents_drive_folder: Optional[str] = None


class ChatRequest(BaseModel):
    """AI Chat request"""
    message: str = Field(..., min_length=1)


class SettlementResponse(BaseModel):
    """Settlement response"""

    id: str
    case_reference: str
    status: str
    notes: Optional[str] = None
    documents_drive_folder: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# =====================================================================
# INVOICE SCHEMAS (Master Sales Invoice & Compliance Compatible)
# =====================================================================

class InvoiceCreate(BaseModel):
    """Create invoice schema matching master sales schema & form inputs"""

    # Primary Customer & Invoice identifiers
    counterparty_name: str = Field(..., min_length=1, max_length=255)
    invoice_number: Optional[str] = None
    amount: Optional[float] = Field(None, ge=0)
    due_date: Optional[datetime] = None
    payment_due_date: Optional[datetime] = None
    invoice_date: Optional[datetime] = None

    # Issuer Company details
    company_name: Optional[str] = None
    company_address: Optional[str] = None
    company_gstin: Optional[str] = None
    company_pan: Optional[str] = None
    cin: Optional[str] = None
    msme_no: Optional[str] = None
    email: Optional[EmailStr] = None

    # Counterparty details
    counterparty_gstin: Optional[str] = None
    counterparty_pan: Optional[str] = None
    bill_to: Optional[Dict[str, Any]] = None
    ship_to: Optional[Dict[str, Any]] = None

    # Order Identifiers & Tax settings
    po_number: Optional[str] = None
    po_date: Optional[datetime] = None
    expected_delivery_date: Optional[datetime] = None
    payment_terms: Optional[str] = "Net 30"
    country: Optional[str] = "IN"
    currency: Optional[str] = "INR"
    lut_arn: Optional[str] = None
    lut_filing_date: Optional[datetime] = None
    place_of_supply: Optional[str] = None
    is_sez_export: Optional[bool] = False

    # Financial Line Items & Amounts
    items: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    subtotal: Optional[float] = 0.0
    discount_amount: Optional[float] = 0.0
    tax_breakdown: Optional[Dict[str, Any]] = None
    tax_amount: Optional[float] = 0.0
    round_off: Optional[float] = 0.0
    total: Optional[float] = 0.0
    balance_due: Optional[float] = 0.0
    exchange_rate: Optional[float] = 1.0

    # Logistics & Banking
    reverse_charge: Optional[bool] = False
    eway_bill_number: Optional[str] = None
    bank_account_name: Optional[str] = None
    bank_account_number: Optional[str] = None
    bank_ifsc: Optional[str] = None
    bank_name: Optional[str] = None
    bank_upi_id: Optional[str] = None

    # Status, Reminders & Notes
    status: Optional[str] = "pending"
    reminder_frequency_days: Optional[int] = Field(7, ge=1, le=365)
    notes: Optional[str] = None


class InvoiceUpdate(BaseModel):
    """Update invoice schema"""

    counterparty_name: Optional[str] = Field(None, min_length=1, max_length=255)
    company_name: Optional[str] = None
    email: Optional[EmailStr] = None
    invoice_number: Optional[str] = None
    amount: Optional[float] = Field(None, ge=0)
    total: Optional[float] = Field(None, ge=0)
    due_date: Optional[datetime] = None
    payment_due_date: Optional[datetime] = None
    status: Optional[str] = None
    reminder_frequency_days: Optional[int] = Field(None, ge=1, le=365)
    notes: Optional[str] = None
    items: Optional[List[Dict[str, Any]]] = None


class InvoiceResponse(BaseModel):
    """Invoice response schema"""

    id: Union[str, UUID]
    user_id: Union[str, UUID]
    company_id: Optional[Union[str, UUID]] = None

    # Issuer Company Snapshot
    company_name: Optional[str] = None
    company_address: Optional[str] = None
    company_gstin: Optional[str] = None
    company_pan: Optional[str] = None
    cin: Optional[str] = None
    msme_no: Optional[str] = None

    # Invoice Identifiers & Dates
    invoice_number: str
    invoice_date: Optional[datetime] = None
    payment_due_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    payment_terms: Optional[str] = None
    po_number: Optional[str] = None
    po_date: Optional[datetime] = None
    expected_delivery_date: Optional[datetime] = None

    # Counterparty details
    counterparty_name: str
    counterparty_gstin: Optional[str] = None
    counterparty_pan: Optional[str] = None
    bill_to: Optional[Dict[str, Any]] = None
    ship_to: Optional[Dict[str, Any]] = None

    # Tax Compliance & Location
    country: Optional[str] = "IN"
    currency: Optional[str] = "INR"
    lut_arn: Optional[str] = None
    lut_filing_date: Optional[datetime] = None
    place_of_supply: Optional[str] = None
    is_sez_export: Optional[bool] = False

    # Financial Amounts & Line Items
    items: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    subtotal: Optional[float] = 0.0
    discount_amount: Optional[float] = 0.0
    tax_breakdown: Optional[Dict[str, Any]] = None
    tax_amount: Optional[float] = 0.0
    round_off: Optional[float] = 0.0
    total: Optional[float] = 0.0
    amount: Optional[float] = 0.0
    balance_due: Optional[float] = 0.0
    exchange_rate: Optional[float] = 1.0

    # Logistics & Banking
    reverse_charge: Optional[bool] = False
    eway_bill_number: Optional[str] = None
    bank_account_name: Optional[str] = None
    bank_account_number: Optional[str] = None
    bank_ifsc: Optional[str] = None
    bank_name: Optional[str] = None
    bank_upi_id: Optional[str] = None

    # Status, Reminders & Follow-ups
    status: str = "pending"
    acknowledged_at: Optional[datetime] = None
    reminder_frequency_days: Optional[int] = 7
    reminder_next_at: Optional[datetime] = None
    last_follow_up_at: Optional[datetime] = None
    follow_up_history: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    notes: Optional[str] = None

    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class InvoiceListResponse(BaseModel):
    """List of invoices response wrapper"""

    invoices: List[InvoiceResponse]
    total: int
    skip: int
    limit: int


class InvoiceFollowUpNote(BaseModel):
    """Add follow-up note to invoice"""

    note: str = Field(..., min_length=1, max_length=2000)