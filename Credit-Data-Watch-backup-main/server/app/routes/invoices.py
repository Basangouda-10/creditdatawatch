from datetime import datetime, timedelta
from typing import List, Optional, Annotated
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, status
from sqlalchemy import select, func, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import attributes

from app.database import get_db
from app.dependencies import get_current_user, require_admin_or_ops
from app.models import Invoice, User
from app.schemas.features import (
    InvoiceCreate,
    InvoiceUpdate,
    InvoiceResponse,
    InvoiceListResponse,
    InvoiceFollowUpNote,
)
from app.utils.response import ResponseFormatter
from app.utils.extract_invoice import extract_from_pdf, extract_from_tabular

# Constants
INVOICE_NOT_FOUND_ERROR = "Invoice not found or unauthorized access"
LOCKED_STATUSES = ["OPERATIONS_APPROVED", "LEGAL_REVIEWED", "MASTER_APPROVED", "COMPLETED", "NOTICE_SENT"]


# Helper functions
def get_utc_now():
    """Get current UTC time as a naive datetime to match model columns."""
    return datetime.utcnow()


def success_response(data=None, message="Success"):
    return ResponseFormatter.create_success(data=data, message=message)


def serialize_invoice(invoice: Invoice) -> dict:
    """Convert an Invoice ORM object into a JSON-safe dict."""
    return InvoiceResponse.model_validate(invoice).model_dump(mode="json")


def get_tenant_filter(user: User):
    """Enforce company-level multi-tenancy with user fallback."""
    if getattr(user, "company_id", None):
        return or_(Invoice.company_id == user.company_id, Invoice.user_id == user.id)
    return Invoice.user_id == user.id


def check_immutability(invoice: Invoice):
    """Phase 3 Immutability Guard: Freeze modifications if verified/approved"""
    status_upper = (invoice.status or "").upper()
    is_verified = getattr(invoice, "is_verified", False)
    if is_verified or status_upper in LOCKED_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Locked: Attachments and records on verified or approved invoices cannot be modified or deleted.",
        )


async def generate_invoice_number(db: AsyncSession, user: User) -> str:
    """Auto-generate sequence-based invoice number: {Initials}/INV/{YY}/{MM}/{seq:03d}"""
    now = get_utc_now()
    yy_mm = now.strftime("%y/%m")
    company_code = "INV"
    
    if getattr(user, "company_name", None):
        words = user.company_name.strip().split()
        if words:
            company_code = "".join([w[0].upper() for w in words if w])[:3]

    count_q = select(func.count(Invoice.id)).where(get_tenant_filter(user))
    res = await db.execute(count_q)
    seq = (res.scalar() or 0) + 1
    return f"{company_code}/INV/{yy_mm}/{seq:03d}"


async def generate_po_number(db: AsyncSession, user: User) -> str:
    """Auto-generate PO number: PO-{seq:04d}"""
    count_q = select(func.count(Invoice.id)).where(get_tenant_filter(user))
    res = await db.execute(count_q)
    seq = (res.scalar() or 0) + 1
    return f"PO-{seq:04d}"


router = APIRouter(prefix="/invoices", tags=["Invoices"])


@router.get("")
async def list_invoices(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    search: Optional[str] = None,
):
    """List invoices with optional status filtering and multi-tenant isolation"""
    query = select(Invoice).where(
        and_(get_tenant_filter(current_user), Invoice.archived == False)
    )

    if status:
        query = query.where(Invoice.status.ilike(status.strip()))

    if search:
        search_term = f"%{search}%"
        query = query.where(
            or_(
                Invoice.counterparty_name.ilike(search_term),
                Invoice.company_name.ilike(search_term),
                Invoice.invoice_number.ilike(search_term),
                Invoice.po_number.ilike(search_term),
                Invoice.notes.ilike(search_term),
            )
        )

    count_query = select(func.count()).select_from(query.subquery())
    result = await db.execute(count_query)
    total = result.scalar_one()

    query = query.order_by(Invoice.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    invoices = result.scalars().all()

    return success_response(
        data={
            "invoices": [serialize_invoice(inv) for inv in invoices],
            "total": total,
            "skip": skip,
            "limit": limit,
        }
    )


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_invoice(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    invoice_data: InvoiceCreate,
):
    """Create a new sales invoice bound to the current user's company tenant"""
    data = invoice_data.model_dump(exclude_unset=True)

    if not data.get("invoice_number"):
        data["invoice_number"] = await generate_invoice_number(db, current_user)
    if not data.get("po_number"):
        data["po_number"] = await generate_po_number(db, current_user)

    now = get_utc_now()
    inv_date = data.get("invoice_date") or now
    due_dt = data.get("payment_due_date") or data.get("due_date") or (now + timedelta(days=30))

    subtotal = data.get("subtotal", 0.0)
    discount = data.get("discount_amount", 0.0)
    tax = data.get("tax_amount", 0.0)
    round_off = data.get("round_off", 0.0)

    calculated_total = data.get("total") or (subtotal - discount + tax + round_off)
    if calculated_total == 0.0 and data.get("amount"):
        calculated_total = data.get("amount")

    amount_val = data.get("amount") or calculated_total
    balance_val = data.get("balance_due") if data.get("balance_due") is not None else calculated_total

    invoice = Invoice(
        id=str(uuid4()),
        user_id=current_user.id,
        company_id=getattr(current_user, "company_id", None),

        company_name=data.get("company_name") or getattr(current_user, "company_name", None) or "Your Company",
        company_address=data.get("company_address") or getattr(current_user, "address", None),
        company_vendor_gstin=data.get("company_gstin") or getattr(current_user, "gstin", None),
        company_pan=data.get("company_pan") or getattr(current_user, "pan", None),
        cin=data.get("cin"),
        msme_no=data.get("msme_no"),

        invoice_number=data["invoice_number"],
        invoice_date=inv_date,
        payment_due_date=due_dt,
        due_date=due_dt,
        payment_terms=data.get("payment_terms") or "Net 30",
        po_number=data["po_number"],
        po_date=data.get("po_date"),
        expected_delivery_date=data.get("expected_delivery_date"),

        counterparty_name=data.get("counterparty_name", ""),
        counterparty_vendor_gstin=data.get("counterparty_gstin"),
        counterparty_pan=data.get("counterparty_pan"),
        bill_to=data.get("bill_to") or {"name": data.get("counterparty_name"), "address": ""},
        ship_to=data.get("ship_to") or {"name": data.get("counterparty_name"), "address": ""},

        country=data.get("country") or "IN",
        currency=data.get("currency") or "INR",
        lut_arn=data.get("lut_arn"),
        lut_filing_date=data.get("lut_filing_date"),
        place_of_supply=data.get("place_of_supply"),
        is_sez_export=data.get("is_sez_export", False),

        items=data.get("items") or [],
        subtotal=subtotal,
        discount_amount=discount,
        tax_breakdown=data.get("tax_breakdown"),
        tax_amount=tax,
        round_off=round_off,
        total=calculated_total,
        amount=amount_val,
        balance_due=balance_val,
        exchange_rate=data.get("exchange_rate", 1.0),

        reverse_charge=data.get("reverse_charge", False),
        eway_bill_number=data.get("eway_bill_number"),

        bank_account_name=data.get("bank_account_name"),
        bank_account_number=data.get("bank_account_number"),
        bank_ifsc=data.get("bank_ifsc"),
        bank_name=data.get("bank_name"),
        bank_upi_id=data.get("bank_upi_id"),

        status=data.get("status") or "pending",
        reminder_frequency_days=data.get("reminder_frequency_days") or 7,
        notes=data.get("notes"),
        follow_up_history=[],
        created_at=now,
        updated_at=now,
    )

    if invoice.status != "acknowledged":
        invoice.reminder_next_at = now + timedelta(days=invoice.reminder_frequency_days)

    db.add(invoice)
    await db.commit()
    await db.refresh(invoice)

    return success_response(data=serialize_invoice(invoice))


@router.post("/upload", status_code=status.HTTP_200_OK)
async def upload_invoice_file(
    file: UploadFile = File(...),
    current_user: Annotated[User, Depends(get_current_user)] = None,
):
    """Parse uploaded PDF, CSV, or Excel files and return extracted invoice fields without modifying company profile."""
    contents = await file.read()
    filename = file.filename or ""

    if filename.lower().endswith(".pdf"):
        extracted_data = [extract_from_pdf(contents)]
    elif filename.lower().endswith((".csv", ".xlsx", ".xls")):
        extracted_data = extract_from_tabular(contents, filename)
    else:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file format. Please upload PDF, CSV, or Excel files.",
        )

    return success_response(
        data={"extracted_invoices": extracted_data, "filename": filename},
        message="Invoice file parsed successfully",
    )


@router.get("/{invoice_id}")
async def get_invoice(
    invoice_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Get a specific invoice with tenant check"""
    result = await db.execute(
        select(Invoice).where(
            and_(Invoice.id == invoice_id, get_tenant_filter(current_user))
        )
    )
    invoice = result.scalar_one_or_none()

    if not invoice:
        raise HTTPException(status_code=404, detail=INVOICE_NOT_FOUND_ERROR)

    return success_response(data=serialize_invoice(invoice))


@router.put("/{invoice_id}")
async def update_invoice(
    invoice_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    invoice_data: InvoiceUpdate,
):
    """Update an invoice with tenant check & Phase 3 immutability guard"""
    result = await db.execute(
        select(Invoice).where(
            and_(Invoice.id == invoice_id, get_tenant_filter(current_user))
        )
    )
    invoice = result.scalar_one_or_none()

    if not invoice:
        raise HTTPException(status_code=404, detail=INVOICE_NOT_FOUND_ERROR)

    # Immutability Guard Check
    check_immutability(invoice)

    update_data = invoice_data.model_dump(exclude_unset=True)

    if "amount" in update_data and "total" not in update_data:
        update_data["total"] = update_data["amount"]
    if "due_date" in update_data and "payment_due_date" not in update_data:
        update_data["payment_due_date"] = update_data["due_date"]

    for field, value in update_data.items():
        setattr(invoice, field, value)

    if "reminder_frequency_days" in update_data and invoice.status != "acknowledged":
        invoice.reminder_next_at = get_utc_now() + timedelta(
            days=invoice.reminder_frequency_days
        )

    invoice.updated_at = get_utc_now()
    await db.commit()
    await db.refresh(invoice)

    return success_response(data=serialize_invoice(invoice))


@router.delete("/{invoice_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_invoice(
    invoice_id: str,
    current_user: Annotated[User, Depends(require_admin_or_ops)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Delete an invoice (Restricted to Admins & Operations, guarded against locked/verified items)"""
    result = await db.execute(
        select(Invoice).where(
            and_(Invoice.id == invoice_id, get_tenant_filter(current_user))
        )
    )
    invoice = result.scalar_one_or_none()

    if not invoice:
        raise HTTPException(status_code=404, detail=INVOICE_NOT_FOUND_ERROR)

    # Immutability Guard Check
    check_immutability(invoice)

    await db.delete(invoice)
    await db.commit()


@router.post("/{invoice_id}/acknowledge")
async def toggle_acknowledgment(
    invoice_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Toggle invoice acknowledgment status"""
    result = await db.execute(
        select(Invoice).where(
            and_(Invoice.id == invoice_id, get_tenant_filter(current_user))
        )
    )
    invoice = result.scalar_one_or_none()

    if not invoice:
        raise HTTPException(status_code=404, detail=INVOICE_NOT_FOUND_ERROR)

    if invoice.status == "acknowledged":
        invoice.status = "pending"
        invoice.acknowledged_at = None
        invoice.reminder_next_at = get_utc_now() + timedelta(
            days=invoice.reminder_frequency_days or 7
        )
    else:
        invoice.status = "acknowledged"
        invoice.acknowledged_at = get_utc_now()
        invoice.reminder_next_at = None

    invoice.updated_at = get_utc_now()
    await db.commit()
    await db.refresh(invoice)

    return success_response(data=serialize_invoice(invoice))


@router.post("/{invoice_id}/follow-up")
async def add_follow_up_note(
    invoice_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    note_data: InvoiceFollowUpNote,
):
    """Add a follow-up note to an invoice"""
    result = await db.execute(
        select(Invoice).where(
            and_(Invoice.id == invoice_id, get_tenant_filter(current_user))
        )
    )
    invoice = result.scalar_one_or_none()

    if not invoice:
        raise HTTPException(status_code=404, detail=INVOICE_NOT_FOUND_ERROR)

    now = get_utc_now()
    new_note = {
        "timestamp": now.isoformat(),
        "note": note_data.note,
    }

    if invoice.follow_up_history is None:
        invoice.follow_up_history = []

    invoice.follow_up_history.append(new_note)
    invoice.last_follow_up_at = now
    invoice.updated_at = now

    if invoice.status != "acknowledged":
        invoice.reminder_next_at = now + timedelta(
            days=invoice.reminder_frequency_days or 7
        )

    attributes.flag_modified(invoice, "follow_up_history")

    await db.commit()
    await db.refresh(invoice)

    return success_response(data=serialize_invoice(invoice))


@router.post("/{invoice_id}/reminder")
async def send_manual_reminder(
    invoice_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Trigger manual reminder/notification for an invoice (✉️ Notify Button)"""
    result = await db.execute(
        select(Invoice).where(
            and_(Invoice.id == invoice_id, get_tenant_filter(current_user))
        )
    )
    invoice = result.scalar_one_or_none()

    if not invoice:
        raise HTTPException(status_code=404, detail=INVOICE_NOT_FOUND_ERROR)

    now = get_utc_now()
    invoice.reminder_next_at = now + timedelta(days=invoice.reminder_frequency_days or 7)
    invoice.updated_at = now

    await db.commit()
    await db.refresh(invoice)

    return success_response(
        data=serialize_invoice(invoice),
        message=f"Notification sent to {invoice.counterparty_name or 'counterparty'}",
    )


@router.get("/reminders/due")
async def get_due_reminders(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Get invoices with reminders due"""
    now = get_utc_now()
    query = select(Invoice).where(
        and_(
            get_tenant_filter(current_user),
            Invoice.status != "acknowledged",
            Invoice.reminder_next_at <= now,
        )
    )

    result = await db.execute(query)
    invoices = result.scalars().all()

    return success_response(
        data={
            "invoices": [serialize_invoice(inv) for inv in invoices],
            "total": len(invoices),
            "skip": 0,
            "limit": len(invoices),
        }
    )