from app.services.email_service import EmailService
from fastapi import APIRouter, Depends, HTTPException, Request, Form, File, UploadFile
from typing import Annotated, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import User, Invoice
from app.dependencies import get_current_user
from app.utils import ResponseFormatter
import uuid
import os
import shutil
from datetime import datetime, timezone, date

invoice_router = APIRouter(prefix="/api/v1/invoices", tags=["Invoices"])

@invoice_router.get("")
async def list_invoices(
    current_user: Annotated[User, Depends(get_current_user)], 
    db: Annotated[AsyncSession, Depends(get_db)],
    skip: int = 0,
    limit: int = 50,
    status: Optional[str] = None
):
    try:
        query = select(Invoice)
        
        # Safely get user attributes
        company_id = getattr(current_user, "company_id", None) or (current_user.get("company_id") if isinstance(current_user, dict) else None)
        role = getattr(current_user, "role", "")
        if isinstance(role, str):
            role = role.upper()
        
        # Filter by company if not an admin
        if role not in ["SUPER_ADMIN", "MASTER_ADMIN"] and company_id:
            query = query.where(Invoice.company_id == str(company_id))
            
        if status:
            query = query.where(Invoice.status == status)
            
        query = query.order_by(Invoice.created_at.desc()).offset(skip).limit(limit)
        result = await db.execute(query)
        invoices = result.scalars().all()
        
        today = date.today()
        rows = []
        for inv in invoices:
            # Bulletproof Date Parsing
            due_dt = None
            if inv.due_date:
                if hasattr(inv.due_date, "date"):
                    due_dt = inv.due_date.date()
                elif isinstance(inv.due_date, str):
                    try:
                        due_dt = datetime.fromisoformat(inv.due_date.replace("Z", "+00:00")).date()
                    except Exception:
                        pass
            
            days_left = (due_dt - today).days if due_dt else 0
            
            inv_date_str = None
            if inv.invoice_date:
                if hasattr(inv.invoice_date, "isoformat"):
                    inv_date_str = inv.invoice_date.isoformat()
                else:
                    inv_date_str = str(inv.invoice_date)
            
            cust_name = getattr(inv, "counterparty_name", getattr(inv, "customer_name", getattr(inv, "customer", "Customer")))
            pan_val = getattr(inv, "counterparty_pan", getattr(inv, "pan", getattr(inv, "customer_pan", "")))
            email_val = getattr(inv, "customer_email", getattr(inv, "email", ""))
            mobile_val = getattr(inv, "customer_mobile", getattr(inv, "phone", getattr(inv, "mobile", "")))
            
            rows.append({
                "id": str(inv.id),
                "invoice_number": inv.invoice_number,
                "counterparty_name": cust_name,
                "customer": cust_name,
                "email": email_val,
                "mobile": mobile_val,
                "counterparty_pan": pan_val,
                "invoice_date": inv_date_str,
                "due_date": due_dt.isoformat() if due_dt else None,
                "days_left": days_left,
                "status": inv.status or "pending",
                "total": float(inv.total or 0.0),
                "amount": float(inv.total or 0.0),
                "document_url": getattr(inv, "document_url", None),
                "is_archived": getattr(inv, "is_archived", False)
            })
        return ResponseFormatter.create_success(data={"invoices": rows, "total": len(rows)})
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@invoice_router.post("")
@invoice_router.post("/")
async def create_invoice(
    request: Request,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    invoice_number: Optional[str] = Form(None),
    counterparty_name: Optional[str] = Form(None),
    counterparty_pan: Optional[str] = Form(None),
    email: Optional[str] = Form(None),
    mobile: Optional[str] = Form(None),
    invoice_date: Optional[str] = Form(None),
    due_date: Optional[str] = Form(None),
    amount: Optional[float] = Form(0.0),
    status: Optional[str] = Form("pending"),
    items: Optional[str] = Form(None),
    notes: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None)
):
    try:
        if not invoice_number and request.headers.get("content-type", "").startswith("application/json"):
            body = await request.json()
            invoice_number = body.get("invoice_number")
            counterparty_name = body.get("counterparty_name") or body.get("customer") or body.get("bill_to_name")
            counterparty_pan = body.get("counterparty_pan") or body.get("pan") or body.get("bill_to_pan")
            email = body.get("email") or body.get("customer_email") or body.get("bill_to_email")
            mobile = body.get("mobile") or body.get("customer_mobile") or body.get("bill_to_mobile")
            invoice_date = body.get("invoice_date")
            due_date = body.get("due_date")
            amount = float(body.get("amount") or body.get("total") or 0.0)
            status = body.get("status", "pending")
            notes = body.get("notes")

        if not counterparty_pan or not str(counterparty_pan).strip():
            raise HTTPException(status_code=400, detail="Counterparty PAN is mandatory.")

        user_id = getattr(current_user, "id", None) or (current_user.get("id") if isinstance(current_user, dict) else None)
        company_id = getattr(current_user, "company_id", None) or (current_user.get("company_id") if isinstance(current_user, dict) else None)

        if not user_id:
            raise HTTPException(status_code=400, detail="Authenticated user ID is missing.")

        invoice_id = str(uuid.uuid4())
        inv_number = invoice_number or f"INV-{uuid.uuid4().hex[:6].upper()}"
        cust_name = counterparty_name or "Customer"
        tot = float(amount or 0.0)

        document_url_final = None
        if file and file.filename:
            os.makedirs("uploads/invoices", exist_ok=True)
            filename = f"{uuid.uuid4().hex[:8]}_{file.filename}"
            filepath = f"uploads/invoices/{filename}"
            with open(filepath, "wb") as f_out:
                shutil.copyfileobj(file.file, f_out)
            document_url_final = f"/uploads/invoices/{filename}"

        now_naive = datetime.now(timezone.utc).replace(tzinfo=None)
        inv_date_obj = datetime.strptime(invoice_date, "%Y-%m-%d") if invoice_date else now_naive
        due_date_obj = datetime.strptime(due_date, "%Y-%m-%d") if due_date else now_naive

        inv = Invoice(
            id=invoice_id,
            invoice_number=inv_number,
            user_id=str(user_id),
            company_id=str(company_id) if company_id else None,
            total=tot,
            invoice_date=inv_date_obj,
            due_date=due_date_obj,
            status=status.lower(),
            document_url=document_url_final,
            created_at=now_naive,
            updated_at=now_naive
        )

        for field in ["customer_name", "counterparty_name", "customer"]:
            try: setattr(inv, field, cust_name)
            except Exception: pass

        for field in ["counterparty_pan", "pan", "customer_pan"]:
            try: setattr(inv, field, str(counterparty_pan).strip().upper())
            except Exception: pass

        for field in ["customer_email", "email"]:
            try: setattr(inv, field, str(email).strip() if email else "")
            except Exception: pass

        for field in ["customer_mobile", "mobile", "phone"]:
            try: setattr(inv, field, str(mobile).strip() if mobile else "")
            except Exception: pass

        db.add(inv)
        await db.commit()
        return ResponseFormatter.create_success(data={"id": invoice_id, "invoice_number": inv_number}, message="Invoice created successfully")
    except HTTPException as he:
        raise he
    except Exception as e:
        await db.rollback()
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@invoice_router.put("/{invoice_id}")
async def update_invoice(
    invoice_id: str,
    request: Request,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    counterparty_name: Optional[str] = Form(None),
    counterparty_pan: Optional[str] = Form(None),
    email: Optional[str] = Form(None),
    mobile: Optional[str] = Form(None),
    invoice_number: Optional[str] = Form(None),
    amount: Optional[float] = Form(None),
    status: Optional[str] = Form(None),
    due_date: Optional[str] = Form(None),
    notes: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None)
):
    try:
        stmt = select(Invoice).where(Invoice.id == invoice_id)
        inv = (await db.execute(stmt)).scalars().first()
        if not inv:
            raise HTTPException(status_code=404, detail="Invoice not found")

        if request.headers.get("content-type", "").startswith("application/json"):
            body = await request.json()
            c_name = body.get("counterparty_name") or body.get("customer") or body.get("bill_to_name")
            if c_name:
                for f in ["customer_name", "counterparty_name", "customer"]:
                    try: setattr(inv, f, c_name)
                    except: pass
            
            c_pan = body.get("counterparty_pan") or body.get("pan") or body.get("bill_to_pan")
            if c_pan:
                for f in ["counterparty_pan", "pan", "customer_pan"]:
                    try: setattr(inv, f, str(c_pan).strip().upper())
                    except: pass
            
            c_email = body.get("email") or body.get("customer_email") or body.get("bill_to_email")
            if c_email is not None:
                for f in ["customer_email", "email"]:
                    try: setattr(inv, f, str(c_email).strip())
                    except: pass
                    
            c_mobile = body.get("mobile") or body.get("customer_mobile") or body.get("bill_to_mobile")
            if c_mobile is not None:
                for f in ["customer_mobile", "mobile", "phone"]:
                    try: setattr(inv, f, str(c_mobile).strip())
                    except: pass

            if body.get("amount") is not None or body.get("total") is not None:
                inv.total = float(body.get("amount") or body.get("total"))
            if body.get("status"):
                inv.status = body.get("status").lower()
            if body.get("invoice_number"):
                inv.invoice_number = body.get("invoice_number")
        else:
            if counterparty_name:
                for f in ["customer_name", "counterparty_name", "customer"]:
                    try: setattr(inv, f, counterparty_name)
                    except: pass
            if counterparty_pan:
                if not str(counterparty_pan).strip():
                    raise HTTPException(status_code=400, detail="Counterparty PAN is mandatory.")
                for f in ["counterparty_pan", "pan", "customer_pan"]:
                    try: setattr(inv, f, str(counterparty_pan).strip().upper())
                    except: pass
            if email is not None:
                for f in ["customer_email", "email"]:
                    try: setattr(inv, f, str(email).strip())
                    except: pass
            if mobile is not None:
                for f in ["customer_mobile", "mobile", "phone"]:
                    try: setattr(inv, f, str(mobile).strip())
                    except: pass
            if amount is not None:
                inv.total = amount
            if status:
                inv.status = status.lower()
            if invoice_number:
                inv.invoice_number = invoice_number
            if due_date:
                inv.due_date = datetime.strptime(due_date, "%Y-%m-%d")

        if file and file.filename:
            os.makedirs("uploads/invoices", exist_ok=True)
            filename = f"{uuid.uuid4().hex[:8]}_{file.filename}"
            filepath = f"uploads/invoices/{filename}"
            with open(filepath, "wb") as f_out:
                shutil.copyfileobj(file.file, f_out)
            inv.document_url = f"/uploads/invoices/{filename}"

        inv.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)
        await db.commit()
        return ResponseFormatter.create_success(message="Invoice updated successfully")
    except HTTPException as he:
        raise he
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@invoice_router.post("/{invoice_id}/acknowledge")
async def acknowledge_invoice(invoice_id: str, current_user: Annotated[User, Depends(get_current_user)], db: Annotated[AsyncSession, Depends(get_db)]):
    stmt = select(Invoice).where(Invoice.id == invoice_id)
    inv = (await db.execute(stmt)).scalars().first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    inv.status = "acknowledged" if inv.status != "acknowledged" else "pending"
    inv.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)
    await db.commit()
    return ResponseFormatter.create_success(message="Invoice acknowledgment updated successfully")

@invoice_router.post("/{invoice_id}/submit-to-ops")
async def submit_invoice_to_ops(invoice_id: str, current_user: Annotated[User, Depends(get_current_user)], db: Annotated[AsyncSession, Depends(get_db)]):
    stmt = select(Invoice).where(Invoice.id == invoice_id)
    inv = (await db.execute(stmt)).scalars().first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    inv.status = "submitted_to_ops"
    inv.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)
    await db.commit()
    return ResponseFormatter.create_success(message="Invoice submitted to operations successfully")

@invoice_router.post("/{invoice_id}/notify")
async def notify_invoice_customer(invoice_id: str, current_user: Annotated[User, Depends(get_current_user)], db: Annotated[AsyncSession, Depends(get_db)]):
    stmt = select(Invoice).where(Invoice.id == invoice_id)
    inv = (await db.execute(stmt)).scalars().first()
    
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
        
    # Safely get the customer's email
    target_email = getattr(inv, "customer_email", getattr(inv, "email", None))
    
    if not target_email or not str(target_email).strip():
        raise HTTPException(status_code=400, detail="No email address saved for this customer. Please edit the invoice and add an email.")

    # Prepare email details
    cust_name = getattr(inv, "counterparty_name", getattr(inv, "customer_name", "Customer"))
    amount = inv.total or 0.0
    due_date = inv.due_date.date() if hasattr(inv.due_date, 'date') else inv.due_date
    company_name = getattr(current_user, "company_name", "Our Company")

    subject = f"Invoice Reminder: {inv.invoice_number} from {company_name}"
    
    body = f"""
    Dear {cust_name},

    This is a polite reminder regarding Invoice {inv.invoice_number} for the amount of ₹{amount:,.2f}.
    The due date for this invoice is {due_date}.

    Please process the payment at your earliest convenience. If you have already made the payment, please ignore this email.

    Thank you,
    {company_name}
    """
    
    # Send the email
    try:
        await EmailService().send_email(target_email, subject, body)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")

    return ResponseFormatter.create_success(message=f"Reminder email successfully sent to {target_email}")

@invoice_router.post("/{invoice_id}/archive")
async def archive_invoice(invoice_id: str, current_user: Annotated[User, Depends(get_current_user)], db: Annotated[AsyncSession, Depends(get_db)]):
    stmt = select(Invoice).where(Invoice.id == invoice_id)
    inv = (await db.execute(stmt)).scalars().first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    current_archived = getattr(inv, "is_archived", False)
    inv.is_archived = not current_archived
    inv.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)
    await db.commit()
    return ResponseFormatter.create_success(data={"is_archived": inv.is_archived}, message="Invoice archive status updated")

@invoice_router.post("/{invoice_id}/send-to-legal")
async def invoice_legal_support(invoice_id: str, request: Request, current_user: Annotated[User, Depends(get_current_user)], db: Annotated[AsyncSession, Depends(get_db)]):
    stmt = select(Invoice).where(Invoice.id == invoice_id)
    inv = (await db.execute(stmt)).scalars().first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    inv.status = "legal_review"
    inv.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)
    await db.commit()
    return ResponseFormatter.create_success(message="Invoice forwarded to legal support team successfully")

@invoice_router.delete("/{invoice_id}")
async def delete_invoice(invoice_id: str, current_user: Annotated[User, Depends(get_current_user)], db: Annotated[AsyncSession, Depends(get_db)]):
    stmt = select(Invoice).where(Invoice.id == invoice_id)
    inv = (await db.execute(stmt)).scalars().first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    await db.delete(inv)
    await db.commit()
    return ResponseFormatter.create_success(message="Invoice deleted successfully")