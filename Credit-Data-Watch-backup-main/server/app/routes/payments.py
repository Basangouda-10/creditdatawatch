"""
Payment management routes
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.concurrency import run_in_threadpool
from typing import Annotated
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timezone
from app.database import get_db
from app.schemas.payment import (
    PaymentInitiateRequest, PaymentInitiateResponse,
    PaymentVerifyRequest, PaymentResponse, PaymentStatusResponse,
    PaymentHistoryResponse
)
from app.services.payment_service import PaymentService
from app.services.notification_service import NotificationService
from app.exceptions import PlanNotFound, UserNotFound
from app.utils.response import ResponseFormatter
from app.dependencies import get_current_user
from app.models import Payment, Plan, User
from app.utils.audit import log_audit
from sqlalchemy import select, text, or_
import logging
import os
import shutil
import uuid

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Payments"])


@router.post("/initiate", response_model=dict)
async def initiate_payment(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    request: PaymentInitiateRequest
):
    """
    Initiate payment for a plan
    
    Args:
        request: Payment initiation request
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        Payment details with payment options
    """
    user_id = str(getattr(current_user, "id", ""))
    user_email = str(getattr(current_user, "email", "unknown"))

    try:
        payment_method_str = (
            request.payment_method.value 
            if hasattr(request.payment_method, 'value') 
            else str(request.payment_method)
        )

        payment, payment_options = await PaymentService.initiate_payment(
            user_id=user_id,
            plan_id=request.plan_id,
            payment_method=payment_method_str,
            db=db,
        )
        
        # Get plan details with flexible matching (id, upper name, display name)
        plan_query = str(request.plan_id or "").strip()
        plan_stmt = select(Plan).where(
            or_(
                Plan.id == plan_query,
                Plan.name == plan_query.upper(),
                Plan.display_name == plan_query
            )
        )
        plan_result = await db.execute(plan_stmt)
        plan = plan_result.scalars().first()
        
        await db.commit()
        
        return ResponseFormatter.create_success(
            message="Payment initiated successfully",
            data={
                "payment_id": payment.id,
                "reference_id": payment.reference_id,
                "amount": payment.amount,
                "currency": payment.currency,
                "plan": {
                    "id": plan.id if plan else request.plan_id,
                    "name": plan.name if plan else request.plan_id,
                    "display_name": plan.display_name if plan else request.plan_id,
                    "duration_type": plan.duration_type.value if plan and hasattr(plan.duration_type, 'value') else str(getattr(plan, 'duration_type', 'monthly')),
                },
                "payment_options": payment_options,
            },
        )
    except PlanNotFound:
        await db.rollback()
        logger.warning("User %s tried to purchase non-existent plan: %s", user_id, request.plan_id)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plan not found or inactive",
        )
    except UserNotFound:
        await db.rollback()
        logger.error("Authenticated user %s not found in database", user_id)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    except HTTPException:
        await db.rollback()
        raise
    except Exception as e:
        await db.rollback()
        # SonarQube Fix: Removed f-string from logger
        logger.error("Error initiating payment for user %s: %s", user_email, str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to initiate payment: {str(e)}",
        )


@router.post("/{payment_id}/verify", response_model=dict)
async def verify_payment(
    payment_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    request: PaymentVerifyRequest
):
    """
    Verify payment completion
    
    Args:
        payment_id: Payment ID
        request: Payment verification request
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        Payment verification result with subscription details
    """
    user_id = str(getattr(current_user, "id", ""))

    try:
        payment = await PaymentService.get_payment_status(payment_id, db)
        if not payment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Payment not found",
            )
        
        if payment.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Unauthorized to verify this payment",
            )
        
        payment, subscription = await PaymentService.verify_payment(
            payment_id=payment_id,
            transaction_id=request.transaction_id,
            gateway_order_id=request.gateway_order_id,
            gateway_payment_id=request.gateway_payment_id,
            db=db,
        )
        
        await log_audit(
            db=db,
            user=current_user,
            action="PAYMENT_VERIFIED",
            entity_obj=payment,
            reason=f"Payment of {payment.amount} verified for plan {payment.plan_id}"
        )
        
        await db.commit()
        
        if subscription:
            try:
                plan_stmt = select(Plan.display_name).where(Plan.id == payment.plan_id)
                plan_res = await db.execute(plan_stmt)
                plan_name = plan_res.scalar() or "Premium"
                await NotificationService.notify_subscription_activated(db, current_user.email, plan_name)
            except Exception as e:
                logger.warning("Failed to trigger subscription notification: %s", str(e))

        subscription_data = None
        if subscription:
            subscription_data = {
                "id": subscription.id,
                "plan_id": subscription.plan_id,
                "status": subscription.status.value if hasattr(subscription.status, 'value') else str(subscription.status),
                "start_date": subscription.start_date.isoformat(),
                "expiry_date": subscription.expiry_date.isoformat() if subscription.expiry_date else None,
            }
        
        return ResponseFormatter.create_success(
            message="Payment verified successfully",
            data={
                "payment_id": payment.id,
                "transaction_id": payment.transaction_id,
                "status": payment.status.value if hasattr(payment.status, 'value') else str(payment.status),
                "subscription": subscription_data,
            },
        )
    except HTTPException:
        await db.rollback()
        raise
    except Exception as e:
        await db.rollback()
        # SonarQube Fix: Removed f-string from logger
        logger.error("Error verifying payment %s: %s", payment_id, str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to verify payment: {str(e)}",
        )


@router.get("/{payment_id}/status", response_model=dict)
async def get_payment_status(
    payment_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """
    Get payment status
    
    Args:
        payment_id: Payment ID
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        Payment status details
    """
    user_id = str(getattr(current_user, "id", ""))

    try:
        payment = await PaymentService.get_payment_status(payment_id, db)
        
        if not payment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Payment not found",
            )
        
        if payment.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Unauthorized to view this payment",
            )
        
        return ResponseFormatter.create_success(
            message="Payment status retrieved",
            data={
                "payment_id": payment.id,
                "status": payment.status.value if hasattr(payment.status, 'value') else str(payment.status),
                "transaction_id": payment.transaction_id,
                "amount": payment.amount,
                "payment_method": payment.payment_method.value if hasattr(payment.payment_method, 'value') else str(payment.payment_method),
                "created_at": payment.created_at.isoformat(),
                "completed_at": payment.completed_at.isoformat() if payment.completed_at else None,
            },
        )
    except HTTPException:
        await db.rollback()
        raise
    except Exception as e:
        await db.rollback()
        # SonarQube Fix: Removed f-string from logger
        logger.error("Error getting payment status for %s: %s", payment_id, str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get payment status",
        )


@router.get("/history", response_model=dict)
async def get_payment_history(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    limit: int = 50,
    offset: int = 0
):
    """
    Get user's payment history
    
    Args:
        current_user: Current authenticated user
        db: Database session
        limit: Maximum number of payments to return
        offset: Offset for pagination
        
    Returns:
        List of payment history entries
    """
    user_id = str(getattr(current_user, "id", ""))

    try:
        payments = await PaymentService.get_user_payment_history(
            user_id=user_id,
            limit=limit,
            offset=offset,
            db=db,
        )
        
        payment_data = []
        for payment in payments:
            plan_stmt = select(Plan).where(Plan.id == payment.plan_id)
            plan_result = await db.execute(plan_stmt)
            plan = plan_result.scalars().first()
            
            payment_data.append({
                "id": payment.id,
                "plan_name": plan.display_name if plan else "Unknown Plan",
                "amount": payment.amount,
                "status": payment.status.value if hasattr(payment.status, 'value') else str(payment.status),
                "payment_method": payment.payment_method.value if hasattr(payment.payment_method, 'value') else str(payment.payment_method),
                "transaction_id": payment.transaction_id,
                "failure_reason": payment.failure_reason,
                "created_at": payment.created_at.isoformat(),
            })
        
        return ResponseFormatter.create_success(
            message="Payment history retrieved",
            data={
                "payments": payment_data,
                "total": len(payment_data),
            },
        )
    except Exception as e:
        await db.rollback()
        logger.error("Error getting payment history for user %s: %s", user_id, str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get payment history",
        )


@router.post("/{payment_id}/cancel", response_model=dict)
async def cancel_payment(
    payment_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """
    Cancel a pending payment
    
    Args:
        payment_id: Payment ID
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        Cancelled payment details
    """
    user_id = str(getattr(current_user, "id", ""))

    try:
        payment = await PaymentService.cancel_payment(
            payment_id=payment_id,
            user_id=user_id,
            db=db,
        )
        
        await db.commit()
        
        return ResponseFormatter.create_success(
            message="Payment cancelled successfully",
            data={
                "payment_id": payment.id,
                "status": payment.status.value if hasattr(payment.status, 'value') else str(payment.status),
            },
        )
    except UserNotFound:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found or unauthorized",
        )
    except ValueError as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        await db.rollback()
        logger.error("Error cancelling payment %s: %s", payment_id, str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to cancel payment",
        )


def _save_file_to_disk(file_src, destination_path: str):
    """Synchronous file copy helper executed in threadpool"""
    os.makedirs(os.path.dirname(destination_path), exist_ok=True)
    with open(destination_path, "wb") as buffer:
        shutil.copyfileobj(file_src, buffer)


@router.post("/{payment_id}/upload-proof")
async def upload_payment_proof(
    payment_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    file: UploadFile = File(...)
):
    """Upload payment proof screenshot"""
    user_id = str(getattr(current_user, "id", ""))

    try:
        # SonarQube Fix: Sanitize filename to prevent path traversal
        safe_filename = os.path.basename(file.filename)
        filename = f"{uuid.uuid4()}_{safe_filename}"
        filepath = f"uploads/payment_proofs/{filename}"
        
        await run_in_threadpool(_save_file_to_disk, file.file, filepath)
        
        proof_url = f"/uploads/payment_proofs/{filename}"
        
        await db.execute(text("""
            UPDATE payments SET 
                payment_proof_url = :url, 
                payment_proof_filename = :filename 
            WHERE id = :id AND user_id = :uid
        """), {
            "url": proof_url, 
            "filename": safe_filename, 
            "id": payment_id, 
            "uid": user_id
        })
        await db.commit()
        
        # SonarQube Fix: Removed f-string from logger
        logger.info("[PAYMENT] Proof uploaded for payment %s: %s", payment_id, filename)
        
        return ResponseFormatter.create_success(
            message="Payment proof uploaded successfully",
            data={"url": proof_url, "filename": safe_filename}
        )
    except Exception as e:
        await db.rollback()
        logger.error("Error uploading proof for payment %s: %s", payment_id, str(e))
        raise HTTPException(status_code=500, detail="Upload failed due to internal error.")