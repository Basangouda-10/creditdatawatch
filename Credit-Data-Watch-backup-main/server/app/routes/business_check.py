
"""
Business Check Request Routes
"""
from fastapi import APIRouter, Depends, HTTPException
from typing import Annotated
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from datetime import datetime, timezone
import uuid
from app.database import get_db
from app.models import User
from app.dependencies import get_current_user, require_master_admin, require_role
from app.utils.response import ResponseFormatter
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/business-check", tags=["Business Check Requests"])


@router.post("/request")
async def submit_business_check(
    payload: dict,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """User submits a business check request"""
    company_name = payload.get("company_name", "").strip()
    gstin = (payload.get("gstin") or "").strip().upper()
    reason = payload.get("reason", "")
    additional_info = payload.get("additional_info", "")

    if not company_name:
        raise HTTPException(status_code=400, detail="company_name is required")
    
    req_id = str(uuid.uuid4())
    wf_id = str(uuid.uuid4())
    
    # Create business check request
    await db.execute(text("""
        INSERT INTO business_check_requests (
            id, user_id, user_email, company_name, gstin, reason, additional_info,
            status, created_at
        ) VALUES (
            :id, :user_id, :user_email, :company_name, :gstin, :reason, :additional_info,
            'PENDING_OPERATION', NOW()
        )
    """), {
        "id": req_id,
        "user_id": current_user.id,
        "user_email": current_user.email,
        "company_name": company_name,
        "gstin": gstin,
        "reason": reason,
        "additional_info": additional_info
    })
    
    # Create workflow item
    await db.execute(text("""
        INSERT INTO workflow_items (
            id, type, status, title, description, entity_id, entity_type,
            submitted_by_email, submitted_by_name, assigned_to_role,
            current_handler_role, created_at
        ) VALUES (
            :id, 'BUSINESS_CHECK', 'PENDING', :title, :desc,
            :entity_id, 'BUSINESS_CHECK', :email, :name,
            'OPERATIONS', 'OPERATIONS', NOW()
        )
    """), {
        "id": wf_id,
        "title": f"🏢 Company Safety Check — {company_name}",
        "desc": f"{current_user.email} wants to check {company_name} (GSTIN: {gstin}). Reason: {reason}",
        "entity_id": req_id,
        "email": current_user.email,
        "name": current_user.company_name or current_user.email
    })
    
    # INSTANT notification to Operations
    await NotificationService.send_to_role(
        db, "OPERATIONS",
        title=f"🏢 New Company Safety Check Request",
        message=f"{getattr(current_user, 'company_name', current_user.email)} wants to check company safety:\n\nCompany: {company_name}\nGSTIN: {gstin}\nReason: {reason or 'Not specified'}\n\nPlease review and generate a report.",
        ntype="BUSINESS_REQUEST",
        action_url="http://localhost:3001/dashboard/operation",
        workflow_id=wf_id
    )
    
    # INSTANT confirmation to user
    await NotificationService.send(
        db, current_user.email,
        title="✅ Company Safety Check Request Submitted",
        message=f"Your request to check {company_name} has been submitted to Operations team.\n\nYou will be notified once the report is ready.",
        ntype="SUCCESS"
    )
    
    await db.commit()
    
    return ResponseFormatter.create_success(message="Request submitted! Operations team has been notified and will review shortly.", data={"id": req_id})


@router.get("/pending")
async def get_pending_business_checks(
    current_user: Annotated[User, Depends(require_role(["OPERATIONS", "OPERATION"]))],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Get pending business checks for operations"""
    result = await db.execute(text("""
        SELECT * FROM business_check_requests WHERE status = 'PENDING_OPERATION'
        ORDER BY created_at DESC
    """))
    rows = result.mappings().all()
    return ResponseFormatter.create_success(data=[dict(row) for row in rows])


@router.get("/my")
async def get_my_business_checks(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Get current user's business check requests"""
    result = await db.execute(text("""
        SELECT * FROM business_check_requests WHERE user_id = :user_id
        ORDER BY created_at DESC
    """), {"user_id": current_user.id})
    rows = result.mappings().all()
    return ResponseFormatter.create_success(data=[dict(row) for row in rows])


@router.post("/{id}/complete")
@router.post("/{id}/operations-review")
async def operations_review(
    id: str,
    payload: dict,
    current_user: Annotated[User, Depends(require_role(["OPERATIONS", "OPERATION"]))],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Operations reviews and sends to Master Admin"""
    verdict = payload.get('verdict', 'NEUTRAL')
    report_text = payload.get('report', payload.get('report_notes', ''))
    send_to_master = payload.get('send_to_master', True)
    
    if not report_text:
        raise HTTPException(status_code=400, detail="Report text is required")
    
    # Check if request exists
    result = await db.execute(text("SELECT * FROM business_check_requests WHERE id = :id"), {"id": id})
    row = result.mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="Request not found")
    req_data = dict(row)
    
    # Generate PDF
    report_url = None
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import inch
        from reportlab.lib import colors
        from datetime import datetime
        import os
        
        os.makedirs("uploads/reports", exist_ok=True)
        pdf_path = f"uploads/reports/safety_report_{id}.pdf"
        
        doc = SimpleDocTemplate(pdf_path, pagesize=A4,
            rightMargin=inch, leftMargin=inch,
            topMargin=inch, bottomMargin=inch)
        
        styles = getSampleStyleSheet()
        
        verdict_config = {
            'SAFE': {'color': colors.green, 'icon': '✅', 'label': 'SAFE TO DO BUSINESS'},
            'NEUTRAL': {'color': colors.orange, 'icon': '⚠️', 'label': 'PROCEED WITH CAUTION'},
            'RISKY': {'color': colors.red, 'icon': '❌', 'label': 'HIGH RISK — DO NOT PROCEED'},
        }
        vc = verdict_config.get(verdict, verdict_config['NEUTRAL'])
        
        story = [
            Paragraph("CreditDataWatch", ParagraphStyle('T', fontSize=22, alignment=1, spaceAfter=6)),
            Paragraph("Company Safety Check Report", ParagraphStyle('S', fontSize=14, alignment=1, textColor=colors.grey, spaceAfter=20)),
            HRFlowable(width="100%", thickness=2, color=vc['color']),
            Spacer(1, 0.2*inch),
            Paragraph(f"{vc['icon']} VERDICT: {vc['label']}",
                ParagraphStyle('V', fontSize=16, textColor=vc['color'], spaceAfter=20, alignment=1)),
            HRFlowable(width="100%", thickness=1, color=colors.lightgrey),
            Spacer(1, 0.2*inch),
            Paragraph("Company Details", styles['Heading2']),
            Paragraph(f"Company Name: {req_data.get('company_name')}", styles['Normal']),
            Paragraph(f"GSTIN: {req_data.get('gstin')}", styles['Normal']),
            Paragraph(f"Requested by: {req_data.get('user_email')}", styles['Normal']),
            Paragraph(f"Reason: {req_data.get('reason') or 'Not specified'}", styles['Normal']),
            Spacer(1, 0.2*inch),
            Paragraph("Detailed Analysis", styles['Heading2']),
            Paragraph(report_text, styles['Normal']),
            Spacer(1, 0.3*inch),
            HRFlowable(width="100%", thickness=1, color=colors.lightgrey),
            Paragraph(f"Report generated by: {current_user.email}", styles['Italic']),
            Paragraph(f"Date: {datetime.now().strftime('%d %B %Y, %I:%M %p')}", styles['Italic']),
            Paragraph(f"Report ID: {id}", styles['Italic']),
        ]
        
        doc.build(story)
        report_url = f"http://localhost:8000/uploads/reports/safety_report_{id}.pdf"
        print(f"[BUSINESS] ✅ PDF generated: {pdf_path}")
        
    except Exception as e:
        print(f"[BUSINESS] PDF failed: {e}")
        import traceback
        traceback.print_exc()
    
    # Update to pending master admin
    await db.execute(text("""
        UPDATE business_check_requests
        SET status = 'PENDING_MASTER_ADMIN', report_notes = :notes, report_text=:notes,
            reviewed_by = :email, reviewed_at = NOW(), ops_reviewed_by=:email,
            verdict = :verdict, report_url = :url
        WHERE id = :id
    """), {"id": id, "notes": report_text, "email": current_user.email, "verdict": verdict, "url": report_url})
    
    # Update workflow
    await db.execute(text("""
        UPDATE workflow_items SET
            status = 'OPERATIONS_APPROVED',
            reviewed_by_email = :email,
            review_notes = :notes,
            reviewed_at = NOW(),
            current_handler_role = 'MASTER_ADMIN',
            updated_at = NOW()
        WHERE entity_id = :req_id
    """), {"email": current_user.email, "notes": f"Verdict: {verdict}", "req_id": id})
    
    # Notify master admin
    await NotificationService.send_to_role(
        db=db,
        role="MASTER_ADMIN",
        title=f"🏢 Company Report Ready for Approval",
        message=f"Operations team has completed the safety check for {req_data.get('company_name')}.\n\nVerdict: {verdict}\n\nPlease review and approve to send report to user.",
        action_url="http://localhost:3001/dashboard/admin"
    )
    
    await db.commit()
    return ResponseFormatter.create_success(message="Sent to Master Admin for final approval.", data={"report_url": report_url, "verdict": verdict})


@router.get("/pending-master")
async def get_pending_master_business_checks(
    current_user: Annotated[User, Depends(require_master_admin)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Get pending business checks for master admin"""
    result = await db.execute(text("""
        SELECT * FROM business_check_requests WHERE UPPER(status) IN ('PENDING_MASTER_ADMIN', 'PENDING_MASTER')
        ORDER BY created_at DESC
    """))
    rows = result.mappings().all()
    
    # For each row, check if company is already in global_credibility_index
    data = []
    for row in rows:
        row_dict = dict(row)
        # Check if gstin exists in global_credibility_index
        check_result = await db.execute(text("""
            SELECT 1 FROM global_credibility_index
            WHERE company_registration_no = :gstin OR company_name = :company_name
            LIMIT 1
        """), {"gstin": row['gstin'], "company_name": row['company_name']})
        row_dict['is_new_company'] = check_result.fetchone() is None
        data.append(row_dict)
    
    return ResponseFormatter.create_success(data=data)


@router.post("/{id}/master-approve")
async def master_approve(
    id: str,
    payload: dict,
    current_user: Annotated[User, Depends(require_master_admin)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Master admin approves (and optionally saves to global CBI)"""
    try:
        save_to_network = payload.get("save_to_network", False)
        notes = payload.get("notes", "")
        
        # Get request
        result = await db.execute(text("SELECT * FROM business_check_requests WHERE id = :id"), {"id": id})
        row = result.mappings().first()
        if not row:
            raise HTTPException(status_code=404, detail="Request not found")
        req_data = dict(row)
        print(f"[MASTER APPROVE] req_data keys: {list(req_data.keys())}")
        print(f"[MASTER APPROVE] req_data.get('user_email'): {req_data.get('user_email')}")
        
        # Update request status
        await db.execute(text("""
            UPDATE business_check_requests
            SET status = 'COMPLETED', master_approved_by = :email, master_approved_at = NOW(), master_notes = :notes
            WHERE id = :id
        """), {"id": id, "email": current_user.email, "notes": notes})
        
        # Update workflow
        await db.execute(text("""
            UPDATE workflow_items
            SET status = 'MASTER_APPROVED', approved_by_email = :email, approval_notes = :notes, approved_at = NOW(), updated_at = NOW()
            WHERE entity_id = :req_id
        """), {"email": current_user.email, "notes": notes, "req_id": id})
        
        # If save to network, add to global_credibility_index
        if save_to_network:
            try:
                verdict = req_data.get('verdict', 'NEUTRAL')
                # Calculate scores based on verdict
                partner_trust_score_map = {'SAFE': 4.5, 'NEUTRAL': 3.0, 'RISKY': 1.5}
                partner_trust_score = partner_trust_score_map.get(verdict, 3.0)
                
                financial_health_score_map = {'SAFE': 9, 'NEUTRAL': 6, 'RISKY': 3}
                financial_health_score = financial_health_score_map.get(verdict, 6)
                
                legal_status_map = {'SAFE': 'CLEAN', 'NEUTRAL': 'MINOR_DISPUTES', 'RISKY': 'ACTIVE_LITIGATION'}
                legal_status = legal_status_map.get(verdict, 'MINOR_DISPUTES')
                
                operational_reliability_map = {'SAFE': 'EXCELLENT', 'NEUTRAL': 'AVERAGE', 'RISKY': 'POOR'}
                operational_reliability = operational_reliability_map.get(verdict, 'AVERAGE')
                
                # Map our verdict to the ai_credit_risk_verdict enum values
                ai_verdict_map = {
                    'SAFE': 'LOW_RISK',
                    'NEUTRAL': 'MEDIUM_RISK',
                    'RISKY': 'HIGH_RISK'
                }
                ai_verdict = ai_verdict_map.get(verdict, 'LOW_RISK')
                
                # Check if company is new (not already in global_credibility_index)
                existing = await db.execute(
                    text("SELECT 1 FROM global_credibility_index WHERE company_registration_no = :gstin OR company_name = :name"),
                    {"gstin": req_data.get('gstin'), "name": req_data.get('company_name')}
                )
                if not existing.fetchone():
                    await db.execute(text("""
                        INSERT INTO global_credibility_index (
                            id, company_id, company_name, company_registration_no,
                            partner_trust_score, ai_credit_risk_verdict, credibility_status,
                            financial_health_score, legal_status, operational_reliability,
                            approved_by_master_admin_id, approved_at, created_at, updated_at
                        ) VALUES (
                            :id, NULL, :name, :gstin, :partner_trust_score, :ai_verdict, 'STANDARD',
                            :financial_health_score, :legal_status, :operational_reliability,
                            :approved_by, NOW(), NOW(), NOW()
                        )
                        ON CONFLICT DO NOTHING
                    """), {
                        "id": str(uuid.uuid4()),
                        "name": req_data.get('company_name'),
                        "gstin": req_data.get('gstin'),
                        "partner_trust_score": partner_trust_score,
                        "ai_verdict": ai_verdict,
                        "financial_health_score": financial_health_score,
                        "legal_status": legal_status,
                        "operational_reliability": operational_reliability,
                        "approved_by": current_user.id
                    })
                    print(f"[BUSINESS] Saved {req_data.get('company_name')} (GSTIN: {req_data.get('gstin')}) to Network Trust Intelligence")
                else:
                    print(f"[BUSINESS] Company {req_data.get('company_name')} already in Network Trust Intelligence, skipping")
            except Exception as e:
                print(f"[BUSINESS] Save to network failed: {e}")
                import traceback
                traceback.print_exc()
        
        # Send verdict messages
        verdict_msg = {
            'SAFE': 'Good news! The company is SAFE to do business with.',
            'NEUTRAL': 'The company has a neutral rating. Proceed with caution.',
            'RISKY': 'Warning! This company is HIGH RISK. We recommend caution.'
        }
        
        # Notify user INSTANTLY with report
        user_email = req_data.get('user_email')
        if user_email:
            await NotificationService.send(
                db=db,
                to_email=user_email,
                title=f"Company Safety Report Ready — {req_data.get('company_name')}",
                message=f"Your company safety check report for {req_data.get('company_name')} is ready!\n\n{verdict_msg.get(req_data.get('verdict', 'NEUTRAL'), '')}\n\n{req_data.get('report_notes', '')[:300]}\n\n{'Download Full Report: ' + req_data.get('report_url', '') if req_data.get('report_url', '') else 'Contact support for the full report.'}",
                ntype="SUCCESS" if req_data.get('verdict', '') == 'SAFE' else "WARNING",
                action_url=req_data.get('report_url', '') or "http://localhost:3001/dashboard"
            )
        
        await db.commit()
        
        return ResponseFormatter.create_success(
            message=f"Report approved and sent to user. {'Company saved to Network Trust Intelligence.' if save_to_network else ''}",
            data={"report_url": req_data.get('report_url'), "verdict": req_data.get('verdict'), "saved_to_network": save_to_network}
        )
    except Exception as e:
        print(f"[MASTER APPROVE] Error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/{id}/save-to-network")
async def save_to_network(
    id: str,
    current_user: Annotated[User, Depends(require_master_admin)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Master admin saves company to global CBI (separate endpoint)"""
    result = await db.execute(text("SELECT * FROM business_check_requests WHERE id = :id"), {"id": id})
    row = result.mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="Request not found")
    
    await db.execute(text("""
        INSERT INTO global_credibility_index (
            id, company_id, company_name, company_registration_no,
            partner_trust_score, ai_credit_risk_verdict, credibility_status,
            created_at, updated_at
        ) VALUES (
            :id, NULL, :name, :gstin, 0, 'NOT_RATED', 'STANDARD', NOW(), NOW()
        )
        ON CONFLICT DO NOTHING
    """), {
        "id": str(uuid.uuid4()),
        "name": row['company_name'],
        "gstin": row['gstin']
    })
    
    await db.commit()
    return ResponseFormatter.create_success(message="Company saved to Network Trust Intelligence")


@router.post("/{id}/reject")
async def reject_request(
    id: str,
    current_user: Annotated[User, Depends(require_role(["OPERATIONS", "OPERATION", "MASTER_ADMIN"]))],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Reject request at any stage"""
    result = await db.execute(text("SELECT * FROM business_check_requests WHERE id = :id"), {"id": id})
    row = result.mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="Request not found")
    
    await db.execute(text("""
        UPDATE business_check_requests
        SET status = 'REJECTED', master_approved_by = :email, master_approved_at = NOW()
        WHERE id = :id
    """), {"id": id, "email": current_user.email})
    
    # Notify user
    if row['user_email']:
        await NotificationService.send(
            db=db,
            to_email=row['user_email'],
            title="❌ Business Check Request Rejected",
            message=f"Your business check request for {row['company_name']} has been rejected.",
            ntype="ERROR",
            action_url="http://localhost:3001/dashboard"
        )
    
    await db.commit()
    return ResponseFormatter.create_success(message="Request rejected")

