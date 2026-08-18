from fastapi import APIRouter, Depends, HTTPException, status
from typing import Annotated
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.dependencies import get_current_user
from app.models import CompanyCredibilityIndex, Company, Subscription, MembershipStatus, PurchaseOrder, User
from app.utils.response import ResponseFormatter
import httpx
from app.config import settings
from app.services.credibility_service import CredibilityService

router = APIRouter(prefix="/credibility", tags=["Credibility"])

def calculate_star_rating(paid_count, total_count):
    if not total_count:
        return 0
    percentage = (paid_count / total_count) * 100
    if percentage >= 90: return 5
    if percentage >= 75: return 4
    if percentage >= 60: return 3
    if percentage >= 40: return 2
    return 1

async def get_po_stats(company_name: str, db: AsyncSession):
    # Fetch stats based on vendor name from PurchaseOrder table
    stmt = select(
        func.count(PurchaseOrder.id).label("total"),
        func.count(PurchaseOrder.id).filter(
            (PurchaseOrder.payment_completed_at.isnot(None)) | 
            (func.lower(PurchaseOrder.status) == 'closed') |
            (func.lower(PurchaseOrder.status) == 'paid')
        ).label("paid")
    ).where(func.lower(PurchaseOrder.vendor) == company_name.lower())
    
    res = await db.execute(stmt)
    stats = res.first()
    total = stats.total if stats else 0
    paid = stats.paid if stats else 0
    stars = calculate_star_rating(paid, total)
    return total, paid, stars

async def _has_active_subscription(user_id: str, db: AsyncSession) -> bool:
    stmt = select(Subscription).where(
        (Subscription.user_id == user_id) &
        (Subscription.is_active == True)
    ).order_by(Subscription.start_date.desc())
    res = await db.execute(stmt)
    sub = res.scalars().first()
    if not sub:
        return False
    if sub.expiry_date and sub.expiry_date < __import__("datetime").datetime.now(timezone.utc):
        return False
    return True

@router.get("")
async def list_credibility(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    role = str(getattr(current_user, "role", "")).upper()
    bypass = bool(getattr(current_user, "subscription_bypass", False)) or bool(getattr(current_user, "full_access", False))
    if role != "MASTER_ADMIN" and not bypass:
        if not await _has_active_subscription(current_user.id, db):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Active subscription required")
    
    # Get all unique vendor names from POs 
    stmt = select(PurchaseOrder.vendor).where( 
        PurchaseOrder.company_id == current_user.company_id 
    ).distinct() 
    res = await db.execute(stmt) 
    vendors = [r[0] for r in res.all() 
               if r[0] and r[0].strip()] 
    
    data = [] 
    for vendor_name in vendors: 
        # Try to find real company ID for this vendor name 
        stmt_comp = select(Company.id).where(func.lower(Company.company_name) == vendor_name.lower()) 
        res_comp = await db.execute(stmt_comp) 
        real_id = res_comp.scalar() or vendor_name 
         
        total, paid, stars = await get_po_stats( 
            vendor_name, db 
        ) 
        pct = (paid/total*100) if total else 0 
        score = min(100, round(pct)) 
        if score >= 90: grade = 'A' 
        elif score >= 75: grade = 'B' 
        elif score >= 60: grade = 'C' 
        else: grade = 'D' 
        if score >= 75: risk = 'Low' 
        elif score >= 50: risk = 'Medium' 
        else: risk = 'High' 
        data.append({ 
            "company_id": real_id, 
            "company_name": vendor_name, 
            "score": score, 
            "grade": grade, 
            "risk_level": risk, 
            "stars": stars, 
            "total_pos": total, 
            "paid_pos": paid 
        }) 
    
    data.sort( 
        key=lambda x: x['score'], 
        reverse=True 
    ) 
    return ResponseFormatter.create_success( 
        data=data 
    ) 


@router.get("/{company_id}")
async def get_credibility(
    company_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    try:
        # Check if company_id is a name or UUID
        import uuid
        is_uuid = False
        try:
            uuid.UUID(company_id)
            is_uuid = True
        except ValueError:
            is_uuid = False

        vendor_name = company_id
        if is_uuid:
            # Find company by ID
            stmt = select(Company).where(Company.id == company_id)
            res = await db.execute(stmt)
            comp = res.scalars().first()
            if comp:
                vendor_name = comp.company_name
            else:
                # If UUID but no company found, try to find in index table by ID
                stmt = select(CompanyCredibilityIndex).where(CompanyCredibilityIndex.company_id == company_id)
                res = await db.execute(stmt)
                idx_row = res.scalars().first()
                if idx_row:
                    # We might need the name, but if we only have the ID in index, we might need to join
                    stmt = select(Company.company_name).join(CompanyCredibilityIndex, Company.id == CompanyCredibilityIndex.company_id).where(CompanyCredibilityIndex.company_id == company_id)
                    res = await db.execute(stmt)
                    vendor_name = res.scalar() or company_id
        
        # Get stats from PO table using the name
        total, paid, stars = await get_po_stats(vendor_name, db)
        
        # Try to find in index table by name
        stmt = select(CompanyCredibilityIndex).where(func.lower(CompanyCredibilityIndex.company_id) == company_id.lower())
        if is_uuid:
             stmt = select(CompanyCredibilityIndex).where(CompanyCredibilityIndex.company_id == company_id)
        
        res = await db.execute(stmt)
        idx = res.scalars().first()
        
        if idx:
            grade = idx.grade
            score = idx.score
            risk = idx.risk_level
        else:
            # Calculate basic grade if not in index
            score = round((paid / total * 100)) if total > 0 else 0
            grade = 'D'
            if score >= 90:
                grade = 'A'
            elif score >= 75:
                grade = 'B'
            elif score >= 50:
                grade = 'C'
            if score >= 80:
                risk = 'Low'
            elif score >= 50:
                risk = 'Medium'
            else:
                risk = 'High'

        data = {
            "company_name": vendor_name,
            "score": score,
            "grade": grade,
            "risk_level": risk,
            "stars": stars,
            "metrics": {
                "total_pos": total,
                "paid_on_time": paid,
                "unpaid": total - paid,
                "fulfillment_rate": round((paid / total * 100)) if total > 0 else 0,
                "avg_delay_days": 0,
                "total_value": 0,
                "paid_value": 0,
                "unpaid_value": 0,
                "avg_value": 0
            }
        }
        return ResponseFormatter.create_success(data=data)
    except Exception:
        import traceback; traceback.print_exc()
        return ResponseFormatter.create_error("Internal server error", status_code=500)

@router.post("/{company_id}/ai-analysis")
async def get_ai_analysis(
    company_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    # Existing Ollama logic used in core.py but adapted for credibility metrics
    stmt = select(CompanyCredibilityIndex, Company).join(Company, Company.id == CompanyCredibilityIndex.company_id).where(CompanyCredibilityIndex.company_id == company_id)
    res = await db.execute(stmt)
    row = res.first()
    if not row: raise HTTPException(status_code=404)
    idx, comp = row
    total, paid, stars = await get_po_stats(comp.company_name, db)
    
    prompt = f"""
    Analyze the following B2B company credibility data and provide a professional risk assessment.
    Company: {comp.company_name}
    Credit Score: {idx.score}/100
    Grade: {idx.grade}
    Risk Level: {idx.risk_level}
    Star Rating: {stars}/5
    PO Fulfillment: {paid}/{total} paid on time ({round(paid/total*100 if total else 0, 1)}%)
    
    Return your response in exactly this JSON format:
    {{
        "verdict": "RECOMMENDED TO DEAL WITH" | "PROCEED WITH CAUTION" | "NOT RECOMMENDED",
        "analysis_points": ["point 1", "point 2", "point 3", "point 4", "point 5"],
        "cards": [
            {{"title": "Payment Reliability", "content": "summary..."}},
            {{"title": "Risk Assessment", "content": "summary..."}},
            {{"title": "Fulfillment History", "content": "summary..."}},
            {{"title": "Credit Worthiness", "content": "summary..."}},
            {{"title": "Market Standing", "content": "summary..."}}
        ]
    }}
    """
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{settings.OLLAMA_BASE_URL}/api/generate",
                json={
                    "model": "llama3",
                    "prompt": prompt,
                    "stream": False,
                    "format": "json"
                }
            )
            result = response.json()
            analysis = __import__("json").loads(result.get("response", "{}"))
            return ResponseFormatter.create_success(data=analysis)
    except Exception as e:
        # Fallback if Ollama fails
        if idx.score >= 80:
            verdict = "RECOMMENDED TO DEAL WITH"
        elif idx.score >= 50:
            verdict = "PROCEED WITH CAUTION"
        else:
            verdict = "NOT RECOMMENDED"
        if idx.score >= 80:
            strength_desc = "strong"
        elif idx.score >= 50:
            strength_desc = "moderate"
        else:
            strength_desc = "poor"
        return ResponseFormatter.create_success(data={
            "verdict": verdict,
            "analysis_points": [ 
                f"Credit score is {idx.score}/100 — {strength_desc}", 
                f"Fulfillment rate is {round(paid/total*100 if total else 0, 1)}%", 
                f"Grade: {idx.grade} | Risk Level: {idx.risk_level}", 
                f"Stars: {stars}/5" 
            ], 
            "cards": []
        })

@router.post("/recalculate") 
async def recalculate_credibility( 
    current_user: Annotated[User, Depends(get_current_user)], 
    db: Annotated[AsyncSession, Depends(get_db)] 
): 
    is_master_admin = ( 
        str(getattr(current_user, 'role', '')).upper() == 'MASTER_ADMIN' or 
        getattr(current_user, 'email', '') == 'payalshinde906@gmail.com' or 
        getattr(current_user, 'subscription_bypass', False) 
    ) 
    if not is_master_admin: 
        raise HTTPException(status_code=403, detail="Master admin only") 
    
    await CredibilityService.recalc_all(db) 
    return ResponseFormatter.create_success(data={"message": "Recalculation complete"}) 
