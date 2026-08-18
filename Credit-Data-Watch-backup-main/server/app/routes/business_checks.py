from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.dependencies import require_admin_or_ops
from app.models import User

router = APIRouter(prefix="/business-checks", tags=["Business Checks"])


class GenerateReportSchema(BaseModel):
    verdict: str  # 'Safe', 'Neutral', 'Risky'
    star_rating: int = Field(3, ge=1, le=5)
    report_text: str


@router.post("/{request_id}/generate-report")
async def generate_business_report(
    request_id: str,
    payload: GenerateReportSchema,
    current_user: User = Depends(require_admin_or_ops),
    db: AsyncSession = Depends(get_db),
):
    """Generate business report and publish rating directly to the Global Credibility Index."""
    # 1. Fetch Request
    check_q = await db.execute(
        text("SELECT id, gstin, company_name FROM business_check_requests WHERE id = :id"),
        {"id": request_id},
    )
    req = check_q.mappings().first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    # 2. Update Business Check Request with Verdict and Star Rating
    await db.execute(
        text("""
            UPDATE business_check_requests 
            SET verdict = :verdict, 
                star_rating = :star_rating, 
                report_text = :report_text, 
                status = 'COMPLETED',
                ops_reviewed_by = :ops_email
            WHERE id = :id
        """),
        {
            "verdict": payload.verdict,
            "star_rating": payload.star_rating,
            "report_text": payload.report_text,
            "ops_email": current_user.email,
            "id": request_id,
        },
    )

    # 3. Publish rating directly to Global Credibility Index
    await db.execute(
        text("""
            INSERT INTO global_credibility_index (
                id, company_name, company_registration_no, rating_score, verdict, is_verified, updated_at
            ) VALUES (
                gen_random_uuid(), :company_name, :gstin, :star_rating, :verdict, true, NOW()
            )
            ON CONFLICT (company_registration_no) 
            DO UPDATE SET 
                rating_score = EXCLUDED.rating_score,
                verdict = EXCLUDED.verdict,
                is_verified = true,
                updated_at = NOW()
        """),
        {
            "company_name": req["company_name"],
            "gstin": req["gstin"],
            "star_rating": payload.star_rating,
            "verdict": payload.verdict,
        },
    )

    await db.commit()
    return {"ok": True, "message": "Report generated and published to Global Credibility Index!"}