"""
Ratings routes
"""
from fastapi import APIRouter, Depends, HTTPException
from typing import Annotated
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from app.database import get_db
from app.dependencies import get_current_user
from app.models import Company, PurchaseOrder, Invoice, User, CompanyRating
from app.services.rating_service import RatingService
from app.services.ai_cbi_service import AICBIService
from app.schemas.rating import RatingCreate, RatingResponse
from app.utils import ResponseFormatter
from datetime import datetime

router = APIRouter(tags=["Ratings"])

@router.get("/ratings/ai-analyze/{company_id}")
async def ai_analyze_company(
    company_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """AI-based analysis of company reliability using manual ratings"""
    analysis = await AICBIService.analyze_company_reliability(db, company_id)
    return ResponseFormatter.create_success(data={"analysis": analysis})

@router.get("/ratings/ai-trends")
async def ai_platform_trends(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """AI-based summary of overall platform credibility trends"""
    summary = await AICBIService.summarize_platform_trends(db)
    return ResponseFormatter.create_success(data={"summary": summary})

@router.post("/ratings", response_model=dict)
async def submit_rating(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    payload: RatingCreate
):
    """Submit or update a rating for another company"""
    try:
        rating = await RatingService.create_rating(db, current_user, payload)
        await db.commit()
        return ResponseFormatter.create_success(
            message="Rating submitted successfully",
            data={"id": rating.id, "rating": rating.rating}
        )
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/ratings/company/{company_id}")
async def get_company_ratings(
    company_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Get all ratings for a specific company"""
    ratings = await RatingService.get_company_ratings(db, company_id)
    return ResponseFormatter.create_success(data=[RatingResponse.model_validate(r).model_dump() for r in ratings])

@router.get("/ratings/global-cbi")
async def get_global_cbi(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Get Global CBI ratings for all companies (Admin or visibility check)"""
    companies = await RatingService.get_all_companies_cbi(db)
    return ResponseFormatter.create_success(
        data=[{
            "id": c.id,
            "company_name": c.company_name,
            "gstin": c.gstin,
            "global_cbi_stars": c.global_cbi_stars,
            "is_verified": c.is_verified
        } for c in companies]
    )

@router.post("/ratings/check")
async def check_rating_allowed(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    payload: dict
):
    """Check if rating is allowed based on verification and real transaction"""
    counterparty_gstin = payload.get("counterparty_gstin", "")
    if not counterparty_gstin:
        raise HTTPException(status_code=400, detail="counterparty_gstin required")
    # Get companies
    ucompany_stmt = select(Company).where(Company.id == current_user.company_id)
    ures = await db.execute(ucompany_stmt)
    user_company = ures.scalars().first()
    ccompany_stmt = select(Company).where(Company.gstin == counterparty_gstin.upper())
    cres = await db.execute(ccompany_stmt)
    counterparty_company = cres.scalars().first()
    if not user_company or not counterparty_company:
        raise HTTPException(status_code=400, detail="Company not found")
    if not user_company.is_verified or not counterparty_company.is_verified:
        raise HTTPException(status_code=400, detail="Both companies must be verified")
    # Check transactions: either PO with vendor_gstin or invoice with counterparty_gstin
    po_stmt = select(PurchaseOrder).where(
        PurchaseOrder.user_id == current_user.id,
        PurchaseOrder.vendor_gstin == counterparty_gstin.upper(),
    )
    po_res = await db.execute(po_stmt)
    po = po_res.scalars().first()
    inv_stmt = select(Invoice).where(
        Invoice.user_id == current_user.id,
        Invoice.counterparty_gstin == counterparty_gstin.upper(),
    )
    inv_res = await db.execute(inv_stmt)
    inv = inv_res.scalars().first()
    if not po and not inv:
        raise HTTPException(status_code=400, detail="No real transaction found between companies")
    return ResponseFormatter.create_success(message="Rating allowed", data={"allowed": True})

@router.get("/credibility/index")
async def get_credibility_index(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Fetch Local CIB (pairwise transactions for current company)
    and Global CIB (strictly network-verified ratings).
    """
    # 1. Fetch Local CIB: PO transaction history for current user's company
    local_query = await db.execute(
        text("""
            SELECT 
                po.id,
                po.vendor AS company_name,
                po.gstin,
                po.amount,
                po.status,
                po.payment_window_days,
                po.is_verified,
                po.created_at
            FROM purchase_orders po
            WHERE po.company_id = :company_id
            ORDER BY po.created_at DESC
        """),
        {"company_id": current_user.company_id},
    )
    local_cib = local_query.mappings().all()

    # 2. Fetch Global CIB: Strictly ONLY records where is_verified = True
    global_query = await db.execute(
        text("""
            SELECT 
                id,
                company_name,
                company_registration_no AS gstin,
                rating_score,
                verdict,
                is_verified,
                updated_at
            FROM global_credibility_index
            WHERE is_verified = TRUE
            ORDER BY rating_score DESC, updated_at DESC
        """)
    )
    global_cib = global_query.mappings().all()

    return ResponseFormatter.create_success(
        data={
            "local_cib": local_cib,
            "global_cib": global_cib,
        }
    )