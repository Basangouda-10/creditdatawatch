"""
Public invitation routes: verify and accept
"""
from fastapi import APIRouter, HTTPException, Depends, Request
from typing import Annotated
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import Invitation, Company, User
from app.utils import hash_password
from uuid import uuid4
from sqlalchemy.exc import IntegrityError
from datetime import datetime as _dt
from app.utils.response import ResponseFormatter

router = APIRouter(prefix="/invitations", tags=["Invitations"])


@router.get("/verify")
async def verify_invitation(
    token: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    http_request: Request = None
):
    stmt = select(Invitation).where(Invitation.token == token, Invitation.status == "PENDING")
    res = await db.execute(stmt)
    inv = res.scalars().first()
    if not inv:
        raise HTTPException(status_code=400, detail="Invalid or expired invitation")
    if inv.expires_at and inv.expires_at < _dt.utcnow():
        raise HTTPException(status_code=400, detail="Invitation expired")
    cstmt = select(Company).where(Company.id == inv.company_id)
    cres = await db.execute(cstmt)
    company = cres.scalars().first()
    if not company:
        raise HTTPException(status_code=400, detail="Company not found")
    data = {
        "email": inv.email,
        "role": inv.role,
        "company_id": company.id,
        "company_name": company.company_name,
        "expires_at": inv.expires_at.isoformat() if inv.expires_at else None,
        "status": inv.status,
    }
    return ResponseFormatter.create_success(data=data, message="Invitation valid", request_id=getattr(getattr(http_request, 'state', None), 'request_id', ''))


@router.post("/accept")
async def accept_invitation(
    db: Annotated[AsyncSession, Depends(get_db)],
    payload: dict,
    http_request: Request = None
):
    token = payload.get("token")
    password = payload.get("password")
    if not token or not password:
        raise HTTPException(status_code=400, detail="Missing token or password")
    stmt = select(Invitation).where(Invitation.token == token, Invitation.status == "PENDING")
    res = await db.execute(stmt)
    inv = res.scalars().first()
    if not inv:
        raise HTTPException(status_code=400, detail="Invalid or expired invitation")
    if inv.expires_at and inv.expires_at < _dt.utcnow():
        raise HTTPException(status_code=400, detail="Invitation expired")
    cstmt = select(Company).where(Company.id == inv.company_id)
    cres = await db.execute(cstmt)
    company = cres.scalars().first()
    if not company:
        raise HTTPException(status_code=400, detail="Company not found")
    # Ensure email is unique
    existing_stmt = select(User).where(User.email == inv.email)
    existing_res = await db.execute(existing_stmt)
    existing_user = existing_res.scalars().first()
    if existing_user:
        # If user already belongs to same company, mark invitation accepted and return success
        if existing_user.company_id == company.id:
            inv.status = "ACCEPTED"
            await db.commit()
            return ResponseFormatter.create_success(message="Invitation accepted (existing user)")
        raise HTTPException(status_code=400, detail="Email already registered")
    # Create user
    try:
        pwd_hash = hash_password(password)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    user = User(
        id=str(uuid4()),
        company_id=company.id,
        name=inv.email.split("@", 1)[0],
        email=inv.email,
        password_hash=pwd_hash,
        role=inv.role,
        status="ACTIVE",
        phone="",
        is_active=True,
        company_name=company.company_name,
        gstin=company.gstin,
    )
    db.add(user)
    inv.status = "ACCEPTED"
    try:
        await db.commit()
        
        from app.utils.audit import log_audit
        await log_audit(
            db=db,
            user=user,
            action="INVITATION_ACCEPTED",
            entity_obj=inv,
            reason=f"User {user.email} accepted invitation"
        )
    except IntegrityError as e:
        await db.rollback()
        err = str(getattr(e, "orig", e)).lower()
        if "email" in err:
            raise HTTPException(status_code=409, detail="Email already registered")
        if "gstin" in err:
            raise HTTPException(status_code=409, detail="GSTIN conflict within company")
        raise HTTPException(status_code=400, detail=f"Failed to accept invitation: {str(e)}")
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=f"Failed to accept invitation: {str(e)}")
    return ResponseFormatter.create_success(message="Invitation accepted; account created")


@router.post("/accept-invitation")
async def accept_invitation_strict(
    db: Annotated[AsyncSession, Depends(get_db)],
    payload: dict,
    http_request: Request = None
):
    """
    Strict acceptance requiring explicit fields to guard against mismatches.
    Required: token, email, password, confirm_password, role, company_id
    """
    token = (payload.get("token") or "").strip()
    email = (payload.get("email") or "").lower().strip()
    password = payload.get("password") or ""
    confirm_password = payload.get("confirm_password") or ""
    role = (payload.get("role") or "").upper().strip()
    company_id = (payload.get("company_id") or "").strip()
    if not all([token, email, password, confirm_password, role, company_id]):
        raise HTTPException(status_code=400, detail="Missing required fields")
    if password != confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")
    stmt = select(Invitation).where(Invitation.token == token, Invitation.status == "PENDING")
    res = await db.execute(stmt)
    inv = res.scalars().first()
    if not inv:
        raise HTTPException(status_code=400, detail="Invalid or expired invitation")
    if inv.expires_at and inv.expires_at < _dt.utcnow():
        raise HTTPException(status_code=400, detail="Invitation expired")
    if email != (inv.email or "").lower():
        raise HTTPException(status_code=400, detail="Email does not match invitation")
    # Role is always USER for invitations
    if role != "USER":
        raise HTTPException(status_code=400, detail="Invalid role for invitation")
    if company_id != (inv.company_id or ""):
        raise HTTPException(status_code=400, detail="Company does not match invitation")
    cstmt = select(Company).where(Company.id == inv.company_id)
    cres = await db.execute(cstmt)
    company = cres.scalars().first()
    if not company:
        raise HTTPException(status_code=400, detail="Company not found")
    if "@" not in email or email.split("@", 1)[1] != company.domain_name:
        raise HTTPException(status_code=400, detail="Email domain mismatch")
    # Duplicate email
    existing_stmt = select(User).where(User.email == email)
    existing_res = await db.execute(existing_stmt)
    existing_user = existing_res.scalars().first()
    if existing_user:
        if existing_user.company_id == company.id:
            inv.status = "ACCEPTED"
            await db.commit()
            return ResponseFormatter.create_success(message="Invitation accepted (existing user)")
        raise HTTPException(status_code=409, detail="Email already registered with another company")
    # Hash password
    try:
        pwd_hash = hash_password(password)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    user = User(
        id=str(uuid4()),
        company_id=company.id,
        name=email.split("@", 1)[0],
        email=email,
        password_hash=pwd_hash,
        role="USER",
        status="ACTIVE",
        phone="",
        is_active=True,
        company_name=company.company_name,
        gstin=company.gstin,
    )
    db.add(user)
    inv.status = "ACCEPTED"
    try:
        await db.commit()
    except IntegrityError as e:
        await db.rollback()
        err = str(getattr(e, "orig", e)).lower()
        if "email" in err:
            raise HTTPException(status_code=409, detail="Email already registered")
        if "gstin" in err:
            raise HTTPException(status_code=409, detail="GSTIN conflict within company")
        raise HTTPException(status_code=400, detail=f"Failed to accept invitation: {str(e)}")
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=f"Failed to accept invitation: {str(e)}")
    return ResponseFormatter.create_success(message="Invitation accepted; account created")
