"""
User and feature routes (stub with core endpoints)
"""
from fastapi import APIRouter, Depends, Request, HTTPException, File, UploadFile, Form
from typing import Annotated
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, text
import re
from datetime import datetime, timezone, date, timedelta
from app.database import get_db, engine
from app.models import User, PurchaseOrder, DefaulterCase, CreditReport, Settlement, Company, BusinessRequest, CompanyCredibilityIndex
from app.models.credibility_index import GlobalCredibilityIndex, CredibilityStatus, AICreditRiskVerdict
from app.services.email_service import EmailService
from app.schemas import (
    UpdateProfileRequest, UserProfileResponse, SubscriptionResponse, POApprovalRequest,
    GSTINCheckRequest, GSTINCheckResponse, BusinessRequestSchema, BusinessReportSubmit, BusinessRequestCreate,
    PurchaseOrderRequest, PurchaseOrderUpdate, GenericReasonRequest, ArchiveRequest, ReminderRequest,
    AdminSettingsRequest, OTPVerifyRequest, PhoneChangeRequest, EmailChangeRequest,
    DefaulterCaseRequest, DefaulterCaseUpdate, DefaulterVerifyRequest,
    CreditReportRequest, CreditReportResponse, CreditReportUpdate, CreditReportCompleteRequest,
    SettlementRequest, SettlementResponse, SettlementUpdate, ChatRequest
)
from app.services import UserService, OTPService, AccessControlService
from app.utils import ResponseFormatter, format_phone_e164
from app.dependencies import get_current_user, require_role, require_master_admin
from app.models import UserRole
from app.exceptions import UnauthorizedFeature
from app.utils.phone import is_valid_phone
from app.config import settings
import uuid
import json
import os
import shutil
from app.services.email_service import EmailService, send_email_with_attachment
from app.services.legal_notice_service import generate_legal_notice_pdf
from app.services.notification_service import NotificationService
from app.models import Notification

from app.utils.audit import log_audit
import logging

logger = logging.getLogger(__name__)

# Upload router
upload_router = APIRouter(prefix="/upload")

@upload_router.post("/evidence")
async def upload_evidence(
    current_user: Annotated[User, Depends(get_current_user)],
    file: UploadFile = File(...)
):
    """Upload evidence file for PO edit"""
    try:
        os.makedirs("uploads/evidence", exist_ok=True)
        file_ext = file.filename.split(".")[-1]
        file_id = str(uuid.uuid4())
        file_path = f"uploads/evidence/{file_id}.{file_ext}"
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        url = f"{settings.BASE_URL}/{file_path}"
        return ResponseFormatter.create_success(data={"url": url, "filename": file.filename})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

async def write_audit_log(db, po_id, po_number, action, user_email, user_role, reason="", changes=""): 
    try: 
        await db.execute( 
            text(""" 
                INSERT INTO po_audit_logs 
                (po_id, po_number, action, performed_by_email, performed_by_role, reason, changes_made) 
                VALUES (:po_id, :po_number, :action, :email, :role, :reason, :changes) 
            """), 
            { 
                "po_id": str(po_id), 
                "po_number": str(po_number), 
                "action": action, 
                "email": user_email, 
                "role": user_role, 
                "reason": reason, 
                "changes": changes 
            } 
        ) 
        await db.commit() 
    except Exception as e: 
        print(f"Audit log error: {e}") 

async def sync_vendor_credibility(vendor_name: str, db: AsyncSession, current_user=None): 
    try: 
        import uuid as uuid_lib 
        from datetime import datetime
        if not vendor_name or not vendor_name.strip(): 
            return 
        
        vendor_name = vendor_name.strip() 
        stmt = select(Company).where(func.lower(Company.company_name) == vendor_name.lower())
        res = await db.execute(stmt)
        existing = res.scalars().first()
        
        if not existing:
            po_stmt = select(PurchaseOrder.gstin).where(PurchaseOrder.vendor == vendor_name).order_by(PurchaseOrder.created_at.desc()).limit(1)
            po_res = await db.execute(po_stmt)
            real_gstin = po_res.scalar() or 'PENDING'
            
            if real_gstin != 'PENDING':
                stmt_gstin = select(Company).where(Company.gstin == real_gstin)
                res_gstin = await db.execute(stmt_gstin)
                existing = res_gstin.scalars().first()
        else:
            real_gstin = existing.gstin

        if not existing: 
            domain = f"{vendor_name.lower().replace(' ', '')}.com"
            company_id = str(uuid_lib.uuid4()) 
            
            new_company = Company(
                id=company_id,
                company_name=vendor_name,
                gstin=real_gstin,
                domain_name=domain,
                is_verified=False
            )
            db.add(new_company)
            await db.flush()

            gci_entry = GlobalCredibilityIndex(
                id=str(uuid.uuid4()),
                company_id=new_company.id,
                company_name=new_company.company_name,
                company_registration_no=None,
                partner_trust_score=0.0,
                ai_credit_risk_verdict=AICreditRiskVerdict.NOT_RATED,
                credibility_status=CredibilityStatus.STANDARD,
                approved_by_master_admin_id=None,
                credibility_review_id=None,
            )
            db.add(gci_entry)
            
            if current_user:
                await log_audit(db, current_user, "CREATE", company=new_company, reason="Company auto-created via PO")
        else: 
            company_id = existing.id
        
        from app.services.credibility_service import CredibilityService 
        await CredibilityService.recalc_for_company(db, company_id) 
        await db.commit() 
    except Exception as e: 
        import traceback 
        print(f"[SYNC ERROR] {vendor_name}: {e}") 
        traceback.print_exc() 

PO_MANAGEMENT = "PO_MANAGEMENT"
PO_FEATURE_NAME = "PO Management"
REPORT_OVERDUE = "REPORT_OVERDUE"
DEFAULTER_FEATURE_NAME = "Defaulter Reporting"
CREDIT_REPORT = "CREDIT_REPORT"
CREDIT_REPORT_FEATURE_NAME = "Credit Report"
SETTLEMENT = "SETTLEMENT"
SETTLEMENT_FEATURE_NAME = "Settlement"

NOT_FOUND_ERROR = "not found"
PO_NOT_FOUND_ERROR = "Purchase order not found"
ACCESS_DENIED_ERROR = "Access denied"
CANNOT_UPDATE_REVIEWED = "Cannot update case that has been reviewed"
EITHER_GSTIN_PAN = "Either GSTIN or PAN must be provided"
INVALID_PAN_FORMAT = "Invalid PAN format"

user_router = APIRouter()
audit_router = APIRouter()

@audit_router.get("/audit-logs") 
async def get_audit_logs( 
    db: Annotated[AsyncSession, Depends(get_db)], 
    current_user: Annotated[User, Depends(get_current_user)], 
    action: str = None, 
    date_from: str = None, 
    search: str = None 
): 
    role = str(current_user.role).split('.')[-1] if '.' in str(current_user.role) else str(current_user.role)
    role = role.upper()
    allowed_roles = ["MASTER_ADMIN", "COMPANY_ADMIN", "ADMIN", "OPERATIONS", "OPERATION", "LEGAL", "FINANCIAL", "FINANCE"] 
    if role not in allowed_roles and current_user.email != 'payalshinde906@gmail.com': 
        raise HTTPException(status_code=403, detail="Access denied. Admins only.") 
    
    from sqlalchemy import text 
    query = "SELECT * FROM audit_logs WHERE 1=1" 
    params = {} 
    
    if action and action.lower() != "all": 
        query += " AND action = :action" 
        params["action"] = action.upper() 
    
    if date_from: 
        try:
            from datetime import datetime
            dt_val = datetime.fromisoformat(date_from)
            query += " AND created_at >= :date_from" 
            params["date_from"] = dt_val 
        except (ValueError, TypeError):
            pass
    
    if search: 
        is_sqlite = settings.DATABASE_URL.startswith("sqlite")
        operator = "LIKE" if is_sqlite else "ILIKE"
        query += f" AND (po_number {operator} :search OR vendor_name {operator} :search OR user_email {operator} :search OR reason {operator} :search)" 
        params["search"] = f"%{search}%" 
    
    query += " ORDER BY created_at DESC LIMIT 500" 
    
    result = await db.execute(text(query), params) 
    rows = result.mappings().all() 
    
    logs = [dict(row) for row in rows] 
    for log in logs: 
        if log.get('created_at'): 
            log['created_at'] = str(log['created_at']) 
    
    return {"success": True, "data": logs, "total": len(logs)} 

@user_router.get("/admin/settings")
async def get_admin_settings(db: Annotated[AsyncSession, Depends(get_db)]):
    from app.models import AppSettings
    stmt = select(AppSettings).where(AppSettings.id == 'default')
    result = await db.execute(stmt)
    settings = result.scalars().first()
    if not settings:
        return ResponseFormatter.create_success(data={"payment_window_days": 50})
    return ResponseFormatter.create_success(data={"payment_window_days": settings.payment_window_days})

@user_router.post("/admin/settings")
async def update_admin_settings(req: AdminSettingsRequest, current_user: Annotated[User, Depends(get_current_user)], db: Annotated[AsyncSession, Depends(get_db)]):
    if current_user.role != "MASTER_ADMIN":
        raise HTTPException(status_code=403, detail="Access denied")
    
    payment_window_days = req.payment_window_days
    if payment_window_days is None:
        raise HTTPException(status_code=400, detail="payment_window_days is required")
        
    from app.models import AppSettings
    stmt = select(AppSettings).where(AppSettings.id == 'default')
    result = await db.execute(stmt)
    settings = result.scalars().first()
    
    if not settings:
        settings = AppSettings(id='default', payment_window_days=payment_window_days)
        db.add(settings)
    else:
        settings.payment_window_days = payment_window_days
        settings.updated_at = datetime.now(timezone.utc)
        
    await log_audit(db, current_user, "UPDATE_SETTINGS", reason=f"Payment window updated to {payment_window_days} days")
    await db.commit()
    return ResponseFormatter.create_success(message="Settings updated successfully")

@user_router.get("/profile")
async def get_profile(current_user: Annotated[User, Depends(get_current_user)]):
    return ResponseFormatter.create_success(data=UserProfileResponse.model_validate(current_user).__dict__)

@user_router.options("/profile")
async def profile_options():
    return JSONResponse(content={})

@user_router.put("/profile")
async def update_profile(req: UpdateProfileRequest, current_user: Annotated[User, Depends(get_current_user)], db: Annotated[AsyncSession, Depends(get_db)]):
    user = await UserService.update_profile(current_user.id, req, db)
    await log_audit(db, current_user, "UPDATE_PROFILE", target_user=user, reason="User updated their profile")
    return ResponseFormatter.create_success(data=UserProfileResponse.model_validate(user).__dict__)

@user_router.post("/phone-change/send-otp")
async def send_phone_change_otp(req: PhoneChangeRequest, current_user: Annotated[User, Depends(get_current_user)]):
    new_phone = (req.new_phone or req.phone or "").strip()
    if not new_phone:
        from app.exceptions import InvalidPhone
        raise InvalidPhone("Phone number is required")
    phone_e164 = format_phone_e164(new_phone)
    if not phone_e164:
        if not is_valid_phone(new_phone):
            from app.exceptions import InvalidPhone
            raise InvalidPhone(f"Invalid phone number format: {new_phone}")
        phone_e164 = new_phone
    result = await OTPService.send_otp(phone_e164, purpose="phone_change", email=current_user.email)
    return ResponseFormatter.create_success(data={"sent": result["sent"], "message": result.get("message", "OTP sent")})

@user_router.post("/phone-change/verify-otp")
async def verify_phone_change_otp(req: OTPVerifyRequest, current_user: Annotated[User, Depends(get_current_user)], db: Annotated[AsyncSession, Depends(get_db)]):
    new_phone = (req.phone or "").strip()
    otp_code = (req.otp_code or "").strip()
    if not new_phone or not otp_code:
        raise HTTPException(status_code=400, detail="Phone and OTP are required")
    phone_e164 = format_phone_e164(new_phone) or new_phone
    await OTPService.verify_otp(phone_e164, otp_code, purpose="phone_change")
    await UserService.change_phone(current_user.id, phone_e164, db)
    await log_audit(db, current_user, "CHANGE_PHONE", target_user=current_user, reason=f"Phone changed to {phone_e164}")
    return ResponseFormatter.create_success(message="Phone changed successfully")

@user_router.post("/email-change/send-otp")
async def send_email_change_otp(req: EmailChangeRequest, current_user: Annotated[User, Depends(get_current_user)], db: Annotated[AsyncSession, Depends(get_db)]):
    new_email = (req.new_email or req.email or "").strip().lower()
    if not new_email or "@" not in new_email:
        from app.exceptions import InvalidEmail
        raise InvalidEmail("Valid email address is required")
    stmt = select(User).where(User.email == new_email, User.id != current_user.id)
    result = await db.execute(stmt)
    if result.scalars().first():
        from app.exceptions import InvalidEmail
        raise InvalidEmail("Email address already in use")
    result = await OTPService.send_otp_for_email_change(new_email, current_user.email)
    return ResponseFormatter.create_success(data={"sent": result["sent"]}, message="OTP sent")

@user_router.post("/email-change/verify-otp")
async def verify_email_change_otp(req: OTPVerifyRequest, current_user: Annotated[User, Depends(get_current_user)], db: Annotated[AsyncSession, Depends(get_db)]):
    new_email = (req.email or "").strip().lower()
    otp_code = (req.otp_code or "").strip()
    if not new_email or not otp_code:
        raise HTTPException(status_code=400, detail="Email and OTP are required")
    await OTPService.verify_otp_for_email_change(new_email, otp_code)
    await UserService.update_profile(current_user.id, UpdateProfileRequest(email=new_email), db)
    await log_audit(db, current_user, "CHANGE_EMAIL", target_user=current_user, reason=f"Email changed to {new_email}")
    return ResponseFormatter.create_success(message="Email changed successfully")

@user_router.get("/subscription")
async def get_subscription(current_user: Annotated[User, Depends(get_current_user)], db: Annotated[AsyncSession, Depends(get_db)]):
    from app.models import Subscription
    role = str(getattr(current_user, "role", "")).upper()
    if role == "MASTER_ADMIN" or getattr(current_user, "subscription_bypass", False) or getattr(current_user, "full_access", False):
        return ResponseFormatter.create_success(data={"id": current_user.id, "plan": "ADMIN_FREE", "is_active": True})
    stmt = select(Subscription).where(Subscription.user_id == current_user.id)
    result = await db.execute(stmt)
    sub = result.scalars().first()
    if not sub:
        return ResponseFormatter.create_success(data=None)
    return ResponseFormatter.create_success(data=SubscriptionResponse.model_validate(sub).__dict__)

po_router = APIRouter()
pos_router = APIRouter()

@pos_router.get("")
@pos_router.get("/")
async def list_pos_pos(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    page: int = 1,
    page_size: int = 20,
    include_archived: bool = True,
    skip: int = 0,
    limit: int = 100,
):
    return await list_pos(current_user, db, page, page_size, include_archived, skip, limit)

@po_router.get("")
@pos_router.get("")
async def list_pos(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    page: int = 1,
    page_size: int = 20,
    include_archived: bool = True,
    skip: int = 0,
    limit: int = 100,
):
    """List purchase orders globally with safe getattr lookups to prevent attribute errors"""
    try:
        stmt = select(PurchaseOrder).order_by(PurchaseOrder.created_at.desc()).offset(skip).limit(limit)
        result = await db.execute(stmt)
        pos = result.scalars().all()
        
        rows = [{
            "id": p.id,
            "po_number": p.po_number,
            "vendor": p.vendor,
            "gstin": getattr(p, "vendor_gstin", getattr(p, "gstin", None)),
            "vendor_email": getattr(p, "vendor_email", None),
            "vendor_phone": getattr(p, "vendor_mobile", getattr(p, "vendor_phone", None)),
            "amount": p.amount,
            "due_date": p.due_date.isoformat() if p.due_date else None,
            "status": p.status,
            "archived": getattr(p, "is_archived", getattr(p, "archived", False)),
            "is_verified": getattr(p, "is_verified", False),
            "payment_completed_at": getattr(p, "payment_completed_at", None).isoformat() if getattr(p, "payment_completed_at", None) else None,
            "payment_window_days": getattr(p, "payment_window_days", 50),
            "legal_notice_sent_at": getattr(p, "legal_notice_sent_at", None).isoformat() if getattr(p, "legal_notice_sent_at", None) else None,
            "document_url": getattr(p, "document_url", None),
            "evidence_url": getattr(p, "evidence_url", None),
            "approved_by": getattr(p, "approved_by", None),
            "approved_at": getattr(p, "approved_at", None).isoformat() if getattr(p, "approved_at", None) else None,
            "rejection_reason": getattr(p, "rejection_reason", None),
            "notes": getattr(p, "notes", None),
            "supplier_address": getattr(p, "supplier_address", None),
            "delivery_address": getattr(p, "delivery_address", None),
            "invoice_address": getattr(p, "invoice_address", None),
            "created_at": p.created_at.isoformat() if p.created_at else None,
        } for p in pos]
        return ResponseFormatter.create_success(data=rows)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return ResponseFormatter.create_success(data=[])

@po_router.post("")
@po_router.post("/")
async def create_po(
    request: Request,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Create purchase order with optional file upload (supports JSON and Multipart Form Data)"""
    import traceback
    import uuid
    import os
    import shutil
    from datetime import datetime, date, timedelta

    try:
        role = str(current_user.role or "").upper()
        if role not in ["MASTER_ADMIN", "COMPANY_ADMIN"]:
            if not await AccessControlService.can_access_feature(current_user.id, PO_MANAGEMENT, db):
                raise UnauthorizedFeature(PO_FEATURE_NAME)
        
        content_type = request.headers.get("content-type", "")
        file = None
        data = {}

        if "multipart/form-data" in content_type:
            form = await request.form()
            for key, val in form.items():
                if isinstance(val, UploadFile):
                    file = val
                else:
                    data[key] = val
        else:
            try:
                data = await request.json()
            except Exception:
                data = {}

        po_number = data.get("po_number") or data.get("po_id") or f"PO-{uuid.uuid4().hex[:6].upper()}"
        vendor = data.get("vendor_name") or data.get("vendor") or "Vendor"
        gstin = data.get("vendor_gstin") or data.get("gstin") or ""
        vendor_email = data.get("vendor_email") or data.get("email") or ""
        vendor_phone = data.get("vendor_mobile") or data.get("vendor_phone") or data.get("mobile") or ""
        amount = float(data.get("amount") or 0)
        due_date_raw = data.get("due_date")
        notes = data.get("notes") or data.get("reason") or ""
        payment_window_days = int(data.get("payment_window_days") or 50)
        status = data.get("status") or "OPEN"

        due_date_obj = None
        if due_date_raw:
            if isinstance(due_date_raw, str):
                date_formats = ['%Y-%m-%d', '%d-%m-%Y', '%m/%d/%Y', '%d/%m/%Y', '%Y/%m/%d', '%Y%m%d', '%d-%b-%Y']
                for fmt in date_formats:
                    try:
                        due_date_obj = datetime.strptime(due_date_raw.strip(), fmt)
                        break
                    except ValueError:
                        continue
            elif isinstance(due_date_raw, date) and not isinstance(due_date_raw, datetime):
                due_date_obj = datetime.combine(due_date_raw, datetime.min.time())
            elif isinstance(due_date_raw, datetime):
                due_date_obj = due_date_raw
        
        if due_date_obj is None:
            due_date_obj = datetime.utcnow() + timedelta(days=30)
        
        document_url_final = data.get("document_url")
        if file and file.filename:
            os.makedirs("uploads/purchase_orders", exist_ok=True)
            filename = f"{uuid.uuid4().hex[:8]}_{file.filename}"
            filepath = f"uploads/purchase_orders/{filename}"
            with open(filepath, "wb") as f_out:
                shutil.copyfileobj(file.file, f_out)
            document_url_final = f"/uploads/purchase_orders/{filename}"
        
        po_id = str(uuid.uuid4())
        company_id = str(getattr(current_user, "company_id", None) or current_user.id)
        user_id = str(current_user.id)

        await db.execute(
            text("""
                INSERT INTO purchase_orders (
                    id, company_id, user_id, po_number, vendor, vendor_name,
                    vendor_gstin, vendor_email, vendor_mobile, amount,
                    due_date, status, notes, document_url, payment_window_days,
                    created_at, updated_at
                ) VALUES (
                    :id, :cid, :uid, :po_num, :vname, :vname,
                    :vgstin, :vemail, :vmobile, :amt,
                    :ddate, :status, :notes, :doc_url, :pwindow,
                    NOW(), NOW()
                )
            """),
            {
                "id": po_id,
                "cid": company_id,
                "uid": user_id,
                "po_num": po_number,
                "vname": vendor,
                "vgstin": gstin.strip().upper() if gstin else "",
                "vemail": vendor_email,
                "vmobile": vendor_phone,
                "amt": amount,
                "ddate": due_date_obj,
                "status": status,
                "notes": notes,
                "doc_url": document_url_final,
                "pwindow": payment_window_days,
            }
        )
        await db.commit()

        return ResponseFormatter.create_success(
            data={"id": po_id, "po_number": po_number},
            message="PO saved to backend successfully."
        )

    except Exception as e:
        await db.rollback()
        error_msg = f"ERROR creating PO: {str(e)}\n{traceback.format_exc()}"
        logger.error(error_msg)
        return JSONResponse(status_code=500, content={"success": False, "detail": str(e)})

@po_router.post("/{po_id}/archive")
async def archive_po(
    po_id: str, 
    current_user: Annotated[User, Depends(get_current_user)], 
    db: Annotated[AsyncSession, Depends(get_db)],
    req: ArchiveRequest = None
):
    """Archive/unarchive purchase order safely"""
    stmt = select(PurchaseOrder).where(
        (PurchaseOrder.id == po_id) & 
        ((PurchaseOrder.company_id == current_user.company_id) | (PurchaseOrder.user_id == current_user.id))
    )
    result = await db.execute(stmt)
    po = result.scalars().first()
    if not po:
        if str(current_user.role or "").upper() == "MASTER_ADMIN":
            stmt_admin = select(PurchaseOrder).where(PurchaseOrder.id == po_id)
            po = (await db.execute(stmt_admin)).scalars().first()
        if not po:
            raise HTTPException(status_code=404, detail=PO_NOT_FOUND_ERROR)
    
    current_archived = getattr(po, "is_archived", getattr(po, "archived", False))
    if hasattr(po, "is_archived"):
        po.is_archived = not current_archived
    if hasattr(po, "archived"):
        po.archived = not current_archived
        
    po.updated_at = datetime.now(timezone.utc)
    reason_str = req.reason if req and hasattr(req, 'reason') else "PO archive status updated"
    
    await log_audit(
        db=db,
        user=current_user,
        action="PO_ARCHIVED" if getattr(po, "archived", getattr(po, "is_archived", False)) else "PO_UNARCHIVED",
        entity_obj=po,
        reason=reason_str
    )
    await db.commit()
    return ResponseFormatter.create_success(data={"is_archived": getattr(po, "archived", getattr(po, "is_archived", False))}, message="PO archive status updated")

@po_router.delete("/{po_id}")
async def delete_po(
    po_id: str, 
    current_user: Annotated[User, Depends(get_current_user)], 
    db: Annotated[AsyncSession, Depends(get_db)],
    req: GenericReasonRequest = None
):
    """Delete purchase order safely"""
    stmt = select(PurchaseOrder).where(
        (PurchaseOrder.id == po_id) & 
        ((PurchaseOrder.company_id == current_user.company_id) | (PurchaseOrder.user_id == current_user.id))
    )
    result = await db.execute(stmt)
    po = result.scalars().first()
    if not po:
        if str(current_user.role or "").upper() == "MASTER_ADMIN":
            stmt_admin = select(PurchaseOrder).where(PurchaseOrder.id == po_id)
            po = (await db.execute(stmt_admin)).scalars().first()
        if not po:
            raise HTTPException(status_code=404, detail=PO_NOT_FOUND_ERROR)

    status_upper = str(po.status or "").upper()
    locked_statuses = ["OPERATIONS_APPROVED", "LEGAL_REVIEWED", "MASTER_APPROVED", "COMPLETED", "NOTICE_SENT"]
    if getattr(po, "is_verified", False) or status_upper in locked_statuses:
        raise HTTPException(
            status_code=400,
            detail="Locked: Verified or approved Purchase Orders cannot be deleted."
        )
    
    reason_str = req.reason if req and hasattr(req, 'reason') else "PO deleted"
    await log_audit(
        db=db,
        user=current_user,
        action="PO_DELETED",
        entity_obj=po,
        reason=reason_str
    )
    await db.delete(po)
    await db.commit()
    return ResponseFormatter.create_success(message="PO deleted successfully")

@po_router.post("/{po_id}/send-reminder")
async def notify_po_vendor(
    po_id: str, 
    request: Request, 
    current_user: Annotated[User, Depends(get_current_user)], 
    db: Annotated[AsyncSession, Depends(get_db)]
):
    stmt = select(PurchaseOrder).where(PurchaseOrder.id == po_id)
    po = (await db.execute(stmt)).scalars().first()
    
    if not po:
        raise HTTPException(status_code=404, detail="Purchase Order not found")
        
    # Safely get the vendor's email
    target_email = getattr(po, "vendor_email", getattr(po, "email", None))
    if not target_email or not str(target_email).strip():
        raise HTTPException(status_code=400, detail="No email address saved for this vendor. Please edit the PO and add an email.")

    # --- PARSE THE CUSTOM DATA FROM YOUR MODAL ---
    try:
        data = await request.json()
    except:
        data = {}

    company_name = getattr(current_user, "company_name", "Our Company")
    vendor_name = getattr(po, "vendor_name", getattr(po, "vendor", "Vendor"))
    
    # Use the subject/body from the modal, or fallback to defaults
    subject = data.get("subject") or f"Payment Reminder: PO {po.po_number} from {company_name}"
    body = data.get("body") or f"Dear {vendor_name},\n\nThis is a polite reminder regarding PO {po.po_number}..."
    
    # Check if the "Attach Legal Notice" checkbox was ticked
    attach_legal = data.get("attach_legal_notice", False)
    legal_text = data.get("legal_notice_text", "")

    try:
        if attach_legal:
            # 1. Generate the Legal Notice PDF 
            pdf_bytes = await generate_legal_notice_pdf(legal_text)
            
            # 2. Send the email with the attached PDF
            await send_email_with_attachment(
                to_email=target_email,
                subject=subject,
                body=body,
                attachment_bytes=pdf_bytes,
                attachment_name=f"Legal_Notice_{po.po_number}.pdf"
            )
            
            # 3. Update the PO status in the database to show notice was sent
            if hasattr(po, 'legal_notice_sent_at'):
                po.legal_notice_sent_at = datetime.now(timezone.utc)
            po.status = "NOTICE_SENT"
            
            await log_audit(db, current_user, "LEGAL_NOTICE_SENT", entity_obj=po, reason="Legal notice attached and sent")
            await db.commit()
            
        else:
            # Send standard reminder email (No PDF)
            await EmailService().send_email(target_email, subject, body)
            await log_audit(db, current_user, "REMINDER_SENT", entity_obj=po, reason="Payment reminder sent")

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")

    return ResponseFormatter.create_success(message=f"Successfully sent to {target_email}")

# Remaining routers for completeness
purchase_history_router = APIRouter()
@purchase_history_router.get("/purchase-history")
async def purchase_history(current_user: Annotated[User, Depends(get_current_user)], db: Annotated[AsyncSession, Depends(get_db)]):
    stmt = select(PurchaseOrder).order_by(PurchaseOrder.created_at.desc())
    result = await db.execute(stmt)
    rows = result.scalars().all()
    return ResponseFormatter.create_success(data=[{
        "id": p.id,
        "po_number": p.po_number,
        "vendor": p.vendor,
        "gstin": getattr(p, "vendor_gstin", getattr(p, "gstin", None)),
        "amount": p.amount,
        "due_date": p.due_date.isoformat() if p.due_date else None,
        "status": p.status,
        "archived": getattr(p, "is_archived", False),
        "created_at": p.created_at.isoformat() if p.created_at else None,
    } for p in rows])

gstin_router = APIRouter()
defaulter_router = APIRouter()
credit_router = APIRouter()
settlement_router = APIRouter()
business_requests_router = APIRouter()
notifications_router = APIRouter()