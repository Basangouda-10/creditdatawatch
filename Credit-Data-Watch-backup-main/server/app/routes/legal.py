"""
Legal workflow routes
"""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import Annotated
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone
from app.database import get_db
from app.models import User, UserRole, BusinessRequest, CreditReport
from app.dependencies import get_current_user, require_role
from app.utils.response import ResponseFormatter
from app.utils.audit import log_audit
from app.schemas import BusinessRequestCreate, BusinessReportSubmit, CreditReportRequest, CreditReportCompleteRequest
import uuid

router = APIRouter(prefix="/legal", tags=["Legal Workflows"])

# ============ BUSINESS REQUEST SYSTEM ============

@router.post("/business-request")
async def submit_business_request(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    payload: BusinessRequestCreate
):
    """USER submits a business risk analysis request"""
    company_name = payload.company_name
    gstin = payload.gstin
    
    request = BusinessRequest(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        company_name=company_name,
        gstin=gstin,
        status="PENDING"
    )
    
    db.add(request)
    
    # Integration with NEW WORKFLOW SYSTEM
    try:
        from app.services.workflow_service import WorkflowService
        await WorkflowService.process_business_request_workflow(
            db=db,
            company_name=current_user.company_name or "Unknown Company",
            company_email=current_user.email,
            target_xyz=company_name
        )
    except Exception as workflow_err:
        print(f"Failed to trigger business workflow: {workflow_err}")

    await db.commit()
    
    # Audit log
    await log_audit(
        db=db, 
        user=current_user, 
        action="BUSINESS_REQUEST_SUBMIT", 
        business_request=request, 
        reason=f"User submitted business request for {company_name}"
    )
    
    return ResponseFormatter.create_success(
        message="Business request submitted to Legal team",
        data={"id": request.id}
    )

@router.get("/business-requests/pending")
async def list_pending_business_requests(
    current_user: Annotated[User, Depends(require_role(["LEGAL", "MASTER_ADMIN", "FINANCIAL", "FINANCE", "OPERATIONS", "OPERATION"]))],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """LEGAL, FINANCIAL, OPERATION roles list pending requests"""
    stmt = select(BusinessRequest).where(BusinessRequest.status == "PENDING")
    result = await db.execute(stmt)
    requests = result.scalars().all()
    
    return ResponseFormatter.create_success(data=[{
        "id": r.id,
        "company_name": r.company_name,
        "gstin": r.gstin,
        "created_at": r.created_at.isoformat()
    } for r in requests])

@router.post("/business-request/{request_id}/analyze")
async def analyze_business_request(
    request_id: str,
    current_user: Annotated[User, Depends(require_role(["LEGAL", "MASTER_ADMIN", "FINANCIAL", "FINANCE", "OPERATIONS", "OPERATION"]))],
    db: Annotated[AsyncSession, Depends(get_db)],
    payload: BusinessReportSubmit
):
    """LEGAL, FINANCIAL, OPERATION roles provide analysis and recommendation"""
    risk_score = payload.risk_score
    recommendation = payload.recommendation
    legal_notes = payload.legal_notes
    
    stmt = select(BusinessRequest).where(BusinessRequest.id == request_id)
    res = await db.execute(stmt)
    request = res.scalars().first()
    
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
        
    request.status = "COMPLETED"
    request.risk_score = risk_score
    request.recommendation = recommendation
    request.legal_notes = legal_notes
    request.analyzed_by = current_user.id
    request.updated_at = datetime.now(timezone.utc)
    
    await db.commit()
    
    # Audit log
    await log_audit(
        db=db, 
        user=current_user, 
        action="BUSINESS_REQUEST_ANALYZE", 
        business_request=request, 
        reason=f"Legal team completed analysis for {request.company_name}"
    )
    
    return ResponseFormatter.create_success(message="Analysis completed and recommendation returned")


# ============ GSTIN CHECK SYSTEM (Manual Review) ============

@router.post("/gstin-check/request-report")
async def request_full_report(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    payload: CreditReportRequest
):
    """USER requests a full credit report for a GSTIN"""
    gstin = payload.entity_gstin
    entity_name = payload.entity_name
    
    report_req = CreditReport(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        entity_name=entity_name,
        entity_gstin=gstin,
        status="Requested"
    )
    
    db.add(report_req)
    
    # Integration with NEW WORKFLOW SYSTEM
    try:
        from app.services.workflow_service import WorkflowService
        await WorkflowService.process_gstin_report_workflow(
            db=db,
            user_email=current_user.email,
            gstin=gstin
        )
    except Exception as workflow_err:
        print(f"Failed to trigger GSTIN workflow: {workflow_err}")

    await db.commit()
    
    # Audit log
    await log_audit(
        db=db, 
        user=current_user, 
        action="GSTIN_REPORT_REQUEST", 
        reason=f"User requested full report for {entity_name} ({gstin})"
    )
    
    return ResponseFormatter.create_success(
        message="Full report requested. Legal team will review manually.",
        data={"id": report_req.id}
    )


@router.get("/reports/pending")
async def list_pending_reports(
    current_user: Annotated[User, Depends(require_role(["LEGAL", "MASTER_ADMIN"]))],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """LEGAL role lists pending report requests"""
    stmt = select(CreditReport).where(CreditReport.status == "Requested")
    result = await db.execute(stmt)
    reports = result.scalars().all()
    
    return ResponseFormatter.create_success(data=[{
        "id": r.id,
        "entity_name": r.entity_name,
        "entity_gstin": r.entity_gstin,
        "requested_at": r.requested_at.isoformat()
    } for r in reports])


@router.post("/report/{report_id}/complete")
async def complete_report(
    report_id: str,
    current_user: Annotated[User, Depends(require_role(["LEGAL", "MASTER_ADMIN"]))],
    db: Annotated[AsyncSession, Depends(get_db)],
    payload: CreditReportCompleteRequest
):
    """LEGAL role completes manual review and provides report URL"""
    report_url = payload.report_url
    credit_score = payload.credit_score
    
    stmt = select(CreditReport).where(CreditReport.id == report_id)
    res = await db.execute(stmt)
    report = res.scalars().first()
    
    if not report:
        raise HTTPException(status_code=404, detail="Report request not found")
        
    report.status = "Ready"
    report.report_url = report_url
    report.credit_score = credit_score
    report.last_updated = datetime.now(timezone.utc)
    report.updated_at = datetime.now(timezone.utc)
    
    await db.commit()
    
    # Audit log
    await log_audit(
        db=db, 
        user=current_user, 
        action="GSTIN_REPORT_COMPLETE", 
        reason=f"Legal team completed report for {report.entity_name} ({report.entity_gstin})"
    )
    
    return ResponseFormatter.create_success(message="Manual review completed and report is ready")
