"""
New API endpoints for Global Credibility Index Auto-Addition Feature
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from datetime import datetime, timezone
import uuid

from app.database import get_db
from app.dependencies import get_current_user, require_role, require_master_admin
from app.models import (
    User,
    UserRole,
    BusinessRequest,
    CredibilityReview,
    CredibilityReviewStage,
    GlobalCredibilityIndex,
    CredibilityReviewStatus,
    CredibilityReviewStage as ReviewStageEnum,
    ReviewDecision,
    Notification,
    Company
)
from app.schemas import credibility_index as cred_schemas
from app.services.notification_service import NotificationService
from app.utils.role_settings import is_legal_enabled, is_financial_enabled

router = APIRouter(prefix="/api/v1/credibility-index", tags=["Credibility Index"])


@router.post("/initiate")
async def initiate_credibility_review(
    payload: cred_schemas.CredibilityReviewInitiate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Initiate credibility review when user submits safety request"""
    # Check if business request exists
    result = await db.execute(select(BusinessRequest).where(BusinessRequest.id == payload.business_request_id))
    business_request = result.scalar_one_or_none()
    if not business_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business request not found"
        )

    # Check if review already exists
    existing_result = await db.execute(
        select(CredibilityReview).where(CredibilityReview.business_request_id == payload.business_request_id)
    )
    if existing_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Credibility review already exists for this request"
        )

    # Check role settings
    financial_enabled = await is_financial_enabled(db)
    legal_enabled = await is_legal_enabled(db)

    # Determine initial status
    if not financial_enabled:
        # Skip Financial, go to Legal if enabled, else skip to Operations
        if not legal_enabled:
            initial_status = CredibilityReviewStatus.PENDING_OPERATIONS
            await NotificationService.send_to_role(
                db=db,
                role="OPERATIONS",
                title="New Credibility Review",
                message=f"Company {business_request.company_name} is pending your review in the credibility index process (Financial & Legal roles disabled).",
                action_url="/dashboard/admin"
            )
        else:
            initial_status = CredibilityReviewStatus.PENDING_LEGAL
            await NotificationService.send_to_role(
                db=db,
                role="LEGAL",
                title="New Credibility Review",
                message=f"Company {business_request.company_name} is pending your review in the credibility index process (Financial role disabled).",
                action_url="/dashboard/legal"
            )
    else:
        initial_status = CredibilityReviewStatus.PENDING_FINANCIAL
        await NotificationService.send_to_role(
            db=db,
            role="FINANCIAL",
            title="New Credibility Review",
            message=f"Company {business_request.company_name} is pending your review in the credibility index process.",
            action_url="/dashboard/financial"
        )

    # Create review
    review = CredibilityReview(
        id=str(uuid.uuid4()),
        business_request_id=payload.business_request_id,
        company_name=business_request.company_name,
        company_registration_no=payload.company_registration_no or None,
        submitted_by_user_id=current_user.id,
        status=initial_status
    )
    db.add(review)
    await db.commit()
    await db.refresh(review)

    return {"message": "Credibility review initiated successfully", "review_id": review.id}


@router.get("/pending/financial", response_model=list[cred_schemas.CredibilityReviewOut])
async def get_pending_financial_reviews(
    current_user: User = Depends(require_role([UserRole.FINANCIAL])),
    db: AsyncSession = Depends(get_db)
):
    """Get all reviews pending financial team review"""
    result = await db.execute(
        select(CredibilityReview)
        .where(CredibilityReview.status == CredibilityReviewStatus.PENDING_FINANCIAL)
        .order_by(CredibilityReview.created_at.desc())
    )
    reviews = result.scalars().all()
    return reviews


@router.post("/review/financial/{review_id}")
async def submit_financial_review(
    review_id: str,
    payload: cred_schemas.FinancialReviewSubmit,
    current_user: User = Depends(require_role([UserRole.FINANCIAL])),
    db: AsyncSession = Depends(get_db)
):
    """Financial team submits review"""
    # Get review
    result = await db.execute(select(CredibilityReview).where(CredibilityReview.id == review_id))
    review = result.scalar_one_or_none()
    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")

    # Create stage entry
    stage = CredibilityReviewStage(
        id=str(uuid.uuid4()),
        credibility_review_id=review_id,
        stage=ReviewStageEnum.FINANCIAL,
        reviewed_by_user_id=current_user.id,
        decision=ReviewDecision.APPROVED if payload.approve else ReviewDecision.REJECTED,
        financial_health_score=payload.financial_health_score,
        payment_history=payload.payment_history,
        financial_risk_level=payload.financial_risk_level,
        notes=payload.notes,
        reviewed_at=datetime.utcnow()
    )
    db.add(stage)

    # Update status
    if payload.approve:
        # Check if Legal is enabled
        legal_enabled = await is_legal_enabled(db)
        if legal_enabled:
            review.status = CredibilityReviewStatus.PENDING_LEGAL
            await NotificationService.send_to_role(
                db=db,
                role="LEGAL",
                title="New Credibility Review",
                message=f"Company {review.company_name} is pending your review in the credibility index process.",
                action_url="/dashboard/legal"
            )
        else:
            review.status = CredibilityReviewStatus.PENDING_OPERATIONS
            await NotificationService.send_to_role(
                db=db,
                role="OPERATIONS",
                title="New Credibility Review",
                message=f"Company {review.company_name} is pending your review in the credibility index process (Legal role disabled).",
                action_url="/dashboard/admin"
            )
    else:
        review.status = CredibilityReviewStatus.REJECTED_FINANCIAL
        # Notify master admin
        await NotificationService.send_to_role(
            db=db,
            role="MASTER_ADMIN",
            title="Credibility Review Rejected",
            message=f"Credibility review for {review.company_name} was rejected by Financial team.",
            action_url="/dashboard/master-admin"
        )

    await db.commit()
    await db.refresh(review)
    return {"message": "Review submitted successfully", "review": cred_schemas.CredibilityReviewOut.model_validate(review)}


@router.get("/pending/legal", response_model=list[cred_schemas.CredibilityReviewWithStagesOut])
async def get_pending_legal_reviews(
    current_user: User = Depends(require_role([UserRole.LEGAL])),
    db: AsyncSession = Depends(get_db)
):
    """Get all reviews pending legal team review with previous stage data"""
    result = await db.execute(
        select(CredibilityReview)
        .options(selectinload(CredibilityReview.stages))
        .where(CredibilityReview.status == CredibilityReviewStatus.PENDING_LEGAL)
        .order_by(CredibilityReview.created_at.desc())
    )
    reviews = result.scalars().all()
    return reviews


@router.post("/review/legal/{review_id}")
async def submit_legal_review(
    review_id: str,
    payload: cred_schemas.LegalReviewSubmit,
    current_user: User = Depends(require_role([UserRole.LEGAL])),
    db: AsyncSession = Depends(get_db)
):
    """Legal team submits review"""
    result = await db.execute(select(CredibilityReview).where(CredibilityReview.id == review_id))
    review = result.scalar_one_or_none()
    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")

    stage = CredibilityReviewStage(
        id=str(uuid.uuid4()),
        credibility_review_id=review_id,
        stage=ReviewStageEnum.LEGAL,
        reviewed_by_user_id=current_user.id,
        decision=ReviewDecision.APPROVED if payload.approve else ReviewDecision.REJECTED,
        legal_status=payload.legal_status,
        compliance_score=payload.compliance_score,
        court_cases=payload.court_cases,
        notes=payload.notes,
        reviewed_at=datetime.utcnow()
    )
    db.add(stage)

    if payload.approve:
        review.status = CredibilityReviewStatus.PENDING_OPERATIONS
        await NotificationService.send_to_role(
            db=db,
            role="OPERATIONS",
            title="New Credibility Review",
            message=f"Company {review.company_name} is pending your review in the credibility index process.",
            action_url="/dashboard/operations"
        )
    else:
        review.status = CredibilityReviewStatus.REJECTED_LEGAL
        await NotificationService.send_to_role(
            db=db,
            role="MASTER_ADMIN",
            title="Credibility Review Rejected",
            message=f"Credibility review for {review.company_name} was rejected by Legal team.",
            action_url="/dashboard/master-admin"
        )

    await db.commit()
    await db.refresh(review)
    return {"message": "Review submitted successfully"}


@router.get("/pending/operations", response_model=list[cred_schemas.CredibilityReviewWithStagesOut])
async def get_pending_ops_reviews(
    current_user: User = Depends(require_role([UserRole.OPERATION, "OPERATIONS"])),
    db: AsyncSession = Depends(get_db)
):
    """Get all reviews pending operations team review with all stages data"""
    result = await db.execute(
        select(CredibilityReview)
        .options(selectinload(CredibilityReview.stages))
        .where(CredibilityReview.status == CredibilityReviewStatus.PENDING_OPERATIONS)
        .order_by(CredibilityReview.created_at.desc())
    )
    reviews = result.scalars().all()
    return reviews


@router.post("/review/operations/{review_id}")
async def submit_ops_review(
    review_id: str,
    payload: cred_schemas.OperationsReviewSubmit,
    current_user: User = Depends(require_role([UserRole.OPERATION, "OPERATIONS"])),
    db: AsyncSession = Depends(get_db)
):
    """Operations team submits review"""
    result = await db.execute(select(CredibilityReview).where(CredibilityReview.id == review_id))
    review = result.scalar_one_or_none()
    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")

    stage = CredibilityReviewStage(
        id=str(uuid.uuid4()),
        credibility_review_id=review_id,
        stage=ReviewStageEnum.OPERATIONS,
        reviewed_by_user_id=current_user.id,
        decision=ReviewDecision.APPROVED if payload.approve else ReviewDecision.REJECTED,
        operational_reliability=payload.operational_reliability,
        dispute_history=payload.dispute_history,
        partner_trust_score=payload.partner_trust_score,
        ai_credit_risk_verdict=payload.ai_credit_risk_verdict,
        notes=payload.notes,
        reviewed_at=datetime.utcnow()
    )
    db.add(stage)

    if payload.approve:
        review.status = CredibilityReviewStatus.PENDING_MASTER_ADMIN
        await NotificationService.send_to_role(
            db=db,
            role="MASTER_ADMIN",
            title="Credibility Review for Final Approval",
            message=f"Company {review.company_name} is pending your final approval in the credibility index process.",
            action_url="/dashboard/master-admin"
        )
    else:
        review.status = CredibilityReviewStatus.REJECTED_OPERATIONS
        await NotificationService.send_to_role(
            db=db,
            role="MASTER_ADMIN",
            title="Credibility Review Rejected",
            message=f"Credibility review for {review.company_name} was rejected by Operations team.",
            action_url="/dashboard/master-admin"
        )

    await db.commit()
    await db.refresh(review)
    return {"message": "Review submitted successfully"}


@router.get("/pending/master-admin", response_model=list[cred_schemas.CredibilityReviewFullOut])
async def get_pending_master_admin_reviews(
    current_user: User = Depends(require_master_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get all reviews pending master admin final approval with all stages data"""
    # Get reviews that are either pending master admin OR any rejected stage
    result = await db.execute(
        select(CredibilityReview)
        .options(selectinload(CredibilityReview.stages))
        .where(
            (CredibilityReview.status == CredibilityReviewStatus.PENDING_MASTER_ADMIN) |
            (CredibilityReview.status == CredibilityReviewStatus.REJECTED_FINANCIAL) |
            (CredibilityReview.status == CredibilityReviewStatus.REJECTED_LEGAL) |
            (CredibilityReview.status == CredibilityReviewStatus.REJECTED_OPERATIONS)
        )
        .order_by(CredibilityReview.created_at.desc())
    )
    reviews = result.scalars().all()
    return reviews


@router.post("/approve/master-admin/{review_id}")
async def submit_master_admin_decision(
    review_id: str,
    payload: cred_schemas.MasterAdminDecisionSubmit,
    current_user: User = Depends(require_master_admin),
    db: AsyncSession = Depends(get_db)
):
    """Master Admin submits final decision"""
    result = await db.execute(select(CredibilityReview).where(CredibilityReview.id == review_id))
    review = result.scalar_one_or_none()
    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")

    if payload.approve:
        # Create master admin stage entry
        master_stage = CredibilityReviewStage(
            id=str(uuid.uuid4()),
            credibility_review_id=review_id,
            stage=ReviewStageEnum.MASTER_ADMIN,
            reviewed_by_user_id=current_user.id,
            decision=ReviewDecision.APPROVED,
            partner_trust_score=payload.partner_trust_score,
            ai_credit_risk_verdict=payload.ai_credit_risk_verdict,
            notes=payload.notes,
            reviewed_at=datetime.utcnow()
        )
        db.add(master_stage)

        # Try to find existing company from business request's gstin
        company = None
        if review.business_request_id:
            business_req_result = await db.execute(
                select(BusinessRequest).where(BusinessRequest.id == review.business_request_id)
            )
            business_req = business_req_result.scalar_one_or_none()
            if business_req:
                company_result = await db.execute(
                    select(Company).where(Company.gstin == business_req.gstin)
                )
                company = company_result.scalar_one_or_none()

        # Try to find existing GCI entry (by company_id if we have it, or company name)
        gci_entry = None
        if company:
            gci_result = await db.execute(
                select(GlobalCredibilityIndex).where(GlobalCredibilityIndex.company_id == company.id)
            )
            gci_entry = gci_result.scalar_one_or_none()

        if not gci_entry:
            # Fallback: try to find by company name
            gci_result = await db.execute(
                select(GlobalCredibilityIndex).where(GlobalCredibilityIndex.company_name == review.company_name)
            )
            gci_entry = gci_result.scalar_one_or_none()

        if gci_entry:
            # Update existing GCI entry
            gci_entry.company_registration_no = review.company_registration_no
            gci_entry.partner_trust_score = payload.partner_trust_score or 0
            gci_entry.ai_credit_risk_verdict = payload.ai_credit_risk_verdict
            gci_entry.credibility_status = payload.credibility_status
            gci_entry.approved_by_master_admin_id = current_user.id
            gci_entry.approved_at = datetime.utcnow()
            gci_entry.credibility_review_id = review.id
        else:
            # Create new GCI entry
            gci_entry = GlobalCredibilityIndex(
                id=str(uuid.uuid4()),
                company_id=company.id if company else None,
                company_name=review.company_name,
                company_registration_no=review.company_registration_no,
                partner_trust_score=payload.partner_trust_score or 0,
                ai_credit_risk_verdict=payload.ai_credit_risk_verdict,
                credibility_status=payload.credibility_status,
                approved_by_master_admin_id=current_user.id,
                approved_at=datetime.utcnow(),
                credibility_review_id=review.id
            )
            db.add(gci_entry)

        # Get previous stages to copy scores
        stages_result = await db.execute(
            select(CredibilityReviewStage)
            .where(CredibilityReviewStage.credibility_review_id == review.id)
        )
        stages = stages_result.scalars().all()
        for stage in stages:
            if stage.stage == ReviewStageEnum.FINANCIAL:
                gci_entry.financial_health_score = stage.financial_health_score
            if stage.stage == ReviewStageEnum.LEGAL:
                gci_entry.legal_status = stage.legal_status
            if stage.stage == ReviewStageEnum.OPERATIONS:
                gci_entry.operational_reliability = stage.operational_reliability

        review.status = CredibilityReviewStatus.APPROVED

        # Notify original user
        # Get the user who submitted the review
        user_result = await db.execute(select(User).where(User.id == review.submitted_by_user_id))
        submitter = user_result.scalar_one_or_none()
        if submitter and submitter.email:
            status_text = payload.credibility_status.value if hasattr(payload.credibility_status, 'value') else str(payload.credibility_status)
            await NotificationService.send(
                db=db,
                to_email=submitter.email,
                title="Company Added to Credibility Index",
                message=f"Your requested company {review.company_name} has been added to the Global Credibility Index with status {status_text}.",
                action_url="/credibility-index"
            )
    else:
        master_stage = CredibilityReviewStage(
            id=str(uuid.uuid4()),
            credibility_review_id=review_id,
            stage=ReviewStageEnum.MASTER_ADMIN,
            reviewed_by_user_id=current_user.id,
            decision=ReviewDecision.REJECTED,
            notes=payload.notes,
            reviewed_at=datetime.utcnow()
        )
        db.add(master_stage)
        review.status = CredibilityReviewStatus.REJECTED_FINAL

    await db.commit()
    await db.refresh(review)
    return {"message": "Decision submitted successfully"}


@router.get("/index", response_model=list[cred_schemas.GlobalCredibilityIndexOut])
async def get_global_credibility_index(
    db: AsyncSession = Depends(get_db)
):
    """Public endpoint to get all approved companies in Global Credibility Index"""
    result = await db.execute(
        select(GlobalCredibilityIndex)
        .order_by(GlobalCredibilityIndex.created_at.desc())
    )
    index_entries = result.scalars().all()
    return index_entries


@router.get("/status/{business_request_id}")
async def get_review_status(
    business_request_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Check status of credibility review for a business request"""
    result = await db.execute(
        select(CredibilityReview).where(CredibilityReview.business_request_id == business_request_id)
    )
    review = result.scalar_one_or_none()
    if not review:
        return {"status": "not_initiated", "message": "No credibility review initiated yet"}
    return {
        "status": review.status.value if hasattr(review.status, "value") else str(review.status),
        "review_id": review.id
    }
