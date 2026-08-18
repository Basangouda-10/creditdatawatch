"""
Subscription management routes
"""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import Annotated
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timezone
from app.database import get_db
from app.schemas import (
    SubscriptionRequest, SubscriptionResponse, SubscriptionStatusResponse, 
    WorkflowActionRequest, ProofUploadRequest, RejectRequest
)
from app.services.subscription_service import SubscriptionService
from app.exceptions import PlanNotFound, UserNotFound
from app.utils.response import ResponseFormatter
from app.utils.audit import log_audit
from app.dependencies import get_current_user, require_role, require_master_admin
from app.models import UserRole, Subscription, User, Plan
from sqlalchemy import select, or_
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/subscriptions", tags=["Subscriptions"])


@router.get("/plans", response_model=dict)
async def list_plans(db: Annotated[AsyncSession, Depends(get_db)]):
    """List all membership plans (public)"""
    try:
        stmt = select(Plan).where(Plan.is_active == True).order_by(Plan.price)
        result = await db.execute(stmt)
        plans = result.scalars().all()
        
        if not plans:
            return ResponseFormatter.create_success(
                data=[
                    {"id": "BASE", "name": "BASE", "display_name": "Base Plan", "price": 500, "validity_days": 30},
                    {"id": "ROYAL", "name": "ROYAL", "display_name": "Royal Plan", "price": 1000, "validity_days": 180},
                    {"id": "GROUPS", "name": "GROUPS", "display_name": "Groups Plan", "price": 2000, "validity_days": 365},
                    {"id": "ENTERPRISE", "name": "ENTERPRISE", "display_name": "Enterprise Plan", "price": 100000, "validity_days": 365},
                ]
            )
        
        return ResponseFormatter.create_success(
            data=[{
                "id": p.id,
                "name": p.name,
                "display_name": p.display_name,
                "description": p.description,
                "duration_type": p.duration_type.value if hasattr(p.duration_type, 'value') else str(p.duration_type),
                "price": p.price,
                "validity_days": p.validity_days,
                "features": {
                    "follow_up_limit": getattr(p, 'follow_up_limit', 0),
                    "legal_assistance_limit": getattr(p, 'legal_assistance_limit', 0),
                }
            } for p in plans]
        )
    except Exception as e:
        logger.error(f"Error in list_plans: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("", response_model=dict)
async def list_subscriptions(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    status: str = None
):
    """List subscriptions with role-based filtering"""
    stmt = select(Subscription).order_by(Subscription.created_at.desc())
    
    if current_user.role == UserRole.USER:
        stmt = stmt.where(Subscription.user_id == current_user.id)
        
    if status:
        stmt = stmt.where(Subscription.status == status)
        
    result = await db.execute(stmt)
    subscriptions = result.scalars().all()
    
    return ResponseFormatter.create_success(
        data=[SubscriptionResponse.from_orm(s) for s in subscriptions]
    )


@router.post("", response_model=dict)
async def purchase_subscription(
    request: SubscriptionRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Purchase a subscription plan"""
    try:
        plan_query = str(request.plan_id or "").strip()
        
        stmt = select(Plan).where(
            or_(
                Plan.id == plan_query,
                Plan.name == plan_query.upper(),
                Plan.display_name == plan_query
            )
        )
        res = await db.execute(stmt)
        matched_plan = res.scalars().first()
        
        target_plan_id = matched_plan.id if matched_plan else plan_query.upper()

        subscription = await SubscriptionService.purchase_subscription(
            user_id=getattr(current_user, "id"),
            plan_id=target_plan_id,
            payment_proof_url=request.payment_proof_url or "",
            payment_id=request.transaction_id or "",
            db=db,
        )
        
        await db.commit()
        
        await log_audit(
            db=db,
            user=current_user,
            action="SUBSCRIPTION_PURCHASED",
            entity_obj=subscription,
            reason=f"Purchased plan: {subscription.plan_id}"
        )
        
        try:
            from app.services.workflow_service import WorkflowService
            await WorkflowService.create_subscription_request(
                db=db,
                user_id=str(current_user.id),
                user_email=current_user.email,
                company_name=current_user.company_name or "Unknown Company",
                plan_name=matched_plan.display_name if matched_plan else target_plan_id,
                amount=float(matched_plan.price if matched_plan else 0.0)
            )
        except Exception as workflow_err:
            logger.error(f"Failed to trigger workflow: {workflow_err}")
        
        return ResponseFormatter.create_success(
            message="Subscription request submitted. Waiting for verification.",
            data={
                "subscription_id": subscription.id,
                "status": subscription.status.value if hasattr(subscription.status, 'value') else str(subscription.status),
            },
        )
    except PlanNotFound:
        logger.warning(f"User {getattr(current_user, 'id', 'unknown')} tried to purchase non-existent plan")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plan not found or inactive",
        )
    except UserNotFound:
        logger.error(f"Authenticated user {getattr(current_user, 'id', 'unknown')} not found in database")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    except Exception as e:
        logger.error(f"Error purchasing subscription: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to purchase subscription: {str(e)}",
        )


@router.post("/verify", response_model=dict)
async def verify_subscription(
    admin: Annotated[User, Depends(require_role(["FINANCIAL", "MASTER_ADMIN"]))],
    db: Annotated[AsyncSession, Depends(get_db)],
    request: WorkflowActionRequest
):
    """Verify payment (FINANCIAL only)"""
    sub = await SubscriptionService.process_workflow(
        subscription_id=request.subscription_id,
        action="VERIFY",
        admin_id=admin.id,
        db=db,
        notes=request.notes
    )
    await db.commit()
    await log_audit(
        db=db,
        user=admin,
        action="SUBSCRIPTION_VERIFIED",
        entity_obj=sub,
        reason=request.notes
    )
    return ResponseFormatter.create_success(message="Subscription payment verified")


@router.post("/process", response_model=dict)
async def process_subscription(
    admin: Annotated[User, Depends(require_role(["OPERATION", "MASTER_ADMIN"]))],
    db: Annotated[AsyncSession, Depends(get_db)],
    request: WorkflowActionRequest
):
    """Process subscription (OPERATION only)"""
    sub = await SubscriptionService.process_workflow(
        subscription_id=request.subscription_id,
        action="PROCESS",
        admin_id=admin.id,
        db=db,
        notes=request.notes
    )
    await db.commit()
    await log_audit(
        db=db,
        user=admin,
        action="SUBSCRIPTION_PROCESSED",
        entity_obj=sub,
        reason=request.notes
    )
    return ResponseFormatter.create_success(message="Subscription request processed")


@router.post("/approve", response_model=dict)
async def approve_subscription(
    admin: Annotated[User, Depends(require_master_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
    request: WorkflowActionRequest
):
    """Approve or Reject subscription (MASTER_ADMIN only)"""
    action = request.action if request.action in ["APPROVE", "REJECT"] else "APPROVE"
    sub = await SubscriptionService.process_workflow(
        subscription_id=request.subscription_id,
        action=action,
        admin_id=admin.id,
        db=db,
        notes=request.notes
    )
    await db.commit()

    audit_action = "SUBSCRIPTION_APPROVED" if action == "APPROVE" else "SUBSCRIPTION_REJECTED"
    display_action = "approved" if action == "APPROVE" else "rejected"

    await log_audit(
        db=db,
        user=admin,
        action=audit_action,
        entity_obj=sub,
        reason=request.notes
    )
    return ResponseFormatter.create_success(message=f"Subscription {display_action} successfully")


@router.get("/status", response_model=dict)
async def get_subscription_status(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Get current subscription status for authenticated user"""
    try:
        subscription = await SubscriptionService.get_active_subscription(
            user_id=getattr(current_user, "id"),
            db=db,
        )
        
        has_active = False
        days_remaining = None
        is_expired = False
        
        if subscription:
            is_valid = await SubscriptionService.is_subscription_valid(subscription)
            has_active = is_valid
            
            if subscription.expiry_date:
                now = datetime.now()
                if subscription.expiry_date < now:
                    is_expired = True
                    days_remaining = 0
                else:
                    delta = subscription.expiry_date - now
                    days_remaining = delta.days
        
        subscription_data = None
        if subscription:
            expiry_isoformat = subscription.expiry_date.isoformat() if subscription.expiry_date else None
            subscription_data = {
                "id": subscription.id,
                "plan_id": subscription.plan_id,
                "is_active": subscription.is_active,
                "start_date": subscription.start_date.isoformat(),
                "expiry_date": expiry_isoformat,
                "status": subscription.status.value if hasattr(subscription.status, 'value') else str(subscription.status),
            }

        return ResponseFormatter.create_success(
            message="Subscription status retrieved",
            data={
                "has_active_subscription": has_active,
                "is_expired": is_expired,
                "days_remaining": days_remaining,
                "subscription": subscription_data,
            },
        )
    except Exception as e:
        logger.error(f"Error getting subscription status: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get subscription status: {str(e)}",
        )


@router.post("/{subscription_id}/upload-proof")
async def upload_proof(
    subscription_id: str,
    req: ProofUploadRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """USER uploads payment proof"""
    subscription = await SubscriptionService.get_subscription_details(subscription_id, db)
    if subscription.user_id != getattr(current_user, "id"):
        raise HTTPException(status_code=403, detail="Not authorized to update this subscription")
        
    updated = await SubscriptionService.upload_payment_proof(subscription_id, req.payment_proof_url, db)
    await db.commit()
    
    await log_audit(
        db=db,
        user=current_user,
        action="SUBSCRIPTION_PROOF_UPLOAD",
        entity_obj=updated,
        reason=f"Uploaded proof: {req.payment_proof_url}"
    )
    
    return ResponseFormatter.create_success(message="Proof uploaded successfully")


@router.get("/{subscription_id}", response_model=dict)
async def get_subscription_details(
    subscription_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Get details of a specific subscription"""
    try:
        subscription = await SubscriptionService.get_subscription_details(
            subscription_id=subscription_id,
            db=db,
        )
        
        if subscription.user_id != getattr(current_user, "id"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Unauthorized to view this subscription",
            )
        
        return ResponseFormatter.create_success(
            message="Subscription details retrieved",
            data={
                "id": subscription.id,
                "plan_id": subscription.plan_id,
                "is_active": subscription.is_active,
                "start_date": subscription.start_date.isoformat(),
                "expiry_date": subscription.expiry_date.isoformat() if subscription.expiry_date else None,
            },
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting subscription details: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get subscription details",
        )