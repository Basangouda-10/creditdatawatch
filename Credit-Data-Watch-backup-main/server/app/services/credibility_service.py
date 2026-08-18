from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, case
from datetime import datetime, timezone, timedelta
from uuid import uuid4
import requests
from app.models import Company, PurchaseOrder, CompanyCredibilityIndex, CredibilityConfig


class CredibilityService:
    @staticmethod
    async def get_config(db: AsyncSession) -> int:
        stmt = select(CredibilityConfig).limit(1)
        res = await db.execute(stmt)
        cfg = res.scalars().first()
        if not cfg:
            cfg = CredibilityConfig(id=str(uuid4()), calculation_window_days=90, last_updated_at=datetime.now(timezone.utc))
            db.add(cfg)
            await db.flush()
        return int(getattr(cfg, "calculation_window_days", 90))

    @staticmethod
    async def aggregate_metrics(db: AsyncSession, window_days: int) -> dict:
        cutoff = datetime.now(timezone.utc) - timedelta(days=window_days) 
    
        companies = (await db.execute(select(Company))).scalars().all() 
    
        metrics = {} 
        for company in companies: 
            result = await db.execute( 
                select( 
                    func.count(PurchaseOrder.id).label("total"), 
                    func.sum( 
                        case((PurchaseOrder.status == "Closed", 1), else_=0) 
                    ).label("paid"), 
                    func.sum( 
                        case((PurchaseOrder.status == "open", 1), else_=0) 
                    ).label("unpaid"), 
                    func.avg( 
                        case( 
                            (PurchaseOrder.payment_completed_at != None, 
                             func.extract("epoch", PurchaseOrder.payment_completed_at - PurchaseOrder.due_date) / 86400), 
                            else_=0 
                        ) 
                    ).label("avg_delay"), 
                ).where( 
                    PurchaseOrder.vendor == company.company_name, 
                    PurchaseOrder.created_at >= cutoff 
                ) 
            ) 
            row = result.first() 
            total = row.total or 0 
            paid = row.paid or 0 
            unpaid = row.unpaid or 0 
            avg_delay = float(row.avg_delay or 0) 
            paid_late = max(0, total - paid - unpaid) 
    
            metrics[company.id] = { 
                "total_pos": total, 
                "paid_on_time": paid, 
                "paid_late": paid_late, 
                "unpaid": unpaid, 
                "avg_delay_days": round(avg_delay, 1), 
                "max_delay_days": 0, 
                "overdue_count": unpaid, 
            } 
    
        return metrics 

    @staticmethod 
    async def score_with_ai(metrics: dict) -> dict: 
        total = metrics.get("total_pos", 0) 
        paid = metrics.get("paid_on_time", 0) 
        unpaid = metrics.get("unpaid", 0) 
        paid_late = metrics.get("paid_late", 0) 
        avg_delay = metrics.get("avg_delay_days", 0) 
    
        prompt = f"""You are a credit risk analyst. Based on the following vendor payment data, evaluate the vendor's credibility. 
    
    Vendor Payment Data: 
    - Total POs: {total} 
    - Paid on time: {paid} 
    - Paid late: {paid_late} 
    - Unpaid/Open: {unpaid} 
    - Average payment delay: {avg_delay} days 
    
    Based on this data, provide: 
    1. A credibility score from 0 to 100 
    2. A grade: A (85-100), B (70-84), C (50-69), D (0-49) 
    3. Risk level: Low (A/B), Medium (C), High (D) 
    4. Star rating from 1 to 5 
    5. A short 1-sentence summary 
    
    Respond ONLY in this exact JSON format, nothing else: 
    {{"score": 85, "grade": "A", "risk_level": "Low", "stars": 4, "ai_summary": "Vendor has excellent payment history."}}""" 
    
        try: 
            import httpx, json 
            async with httpx.AsyncClient() as client:
                response = await client.post( 
                    "http://localhost:11434/api/generate", 
                    json={ 
                        "model": "llama3", 
                        "prompt": prompt, 
                        "stream": False 
                    }, 
                    timeout=30 
                ) 
                if response.status_code == 200: 
                    raw = response.json().get("response", "").strip() 
                    import re 
                    match = re.search(r'\{.*?\}', raw, re.DOTALL) 
                    if match: 
                        result = json.loads(match.group()) 
                        return { 
                            "score": int(result.get("score", 50)), 
                            "grade": result.get("grade", "C"), 
                            "risk_level": result.get("risk_level", "Medium"), 
                            "stars": int(result.get("stars", 3)), 
                            "ai_summary": result.get("ai_summary", f"Based on {paid}/{total} POs paid on time.") 
                        } 
        except Exception as e: 
            print(f"[OLLAMA ERROR] {e} — using fallback scoring") 
    
        if total == 0: 
            local_score = 50 
        else: 
            fulfillment_rate = paid / total 
            local_score = int(fulfillment_rate * 100) 
            local_score -= int(paid_late * 5) 
            local_score -= int(unpaid * 10) 
            if avg_delay > 0: 
                local_score -= int(avg_delay * 2) 
            local_score = max(0, min(100, local_score)) 
    
        global_score = metrics.get("global_score", local_score)
        final_score = int(0.4 * local_score + 0.6 * global_score)

        if final_score >= 85: 
            grade, risk = "A", "Low" 
        elif final_score >= 70: 
            grade, risk = "B", "Low" 
        elif final_score >= 50: 
            grade, risk = "C", "Medium" 
        else: 
            grade, risk = "D", "High" 
    
        stars = round(final_score / 20) 
        return { 
            "score": final_score, 
            "grade": grade, 
            "risk_level": risk, 
            "stars": stars, 
            "ai_summary": f"Based on {paid}/{total} POs paid on time. (Local: {local_score}, Global: {global_score})" 
        } 

    @staticmethod
    async def upsert_company_index(db: AsyncSession, company_id: str, window_days: int, m: dict, s: dict):
        stmt = select(CompanyCredibilityIndex).where(CompanyCredibilityIndex.company_id == company_id)
        res = await db.execute(stmt)
        row = res.scalars().first()
        now = datetime.now(timezone.utc)
        if row:
            row.score = s["score"]
            row.grade = s["grade"]
            row.risk_level = s["risk_level"]
            row.ai_summary = s["ai_summary"]
            row.calculation_window_days = window_days
            row.total_pos = m["total_pos"]
            row.paid_on_time = m["paid_on_time"]
            row.paid_late = m["paid_late"]
            row.unpaid = m["unpaid"]
            row.avg_delay_days = m["avg_delay_days"]
            row.max_delay_days = m["max_delay_days"]
            row.overdue_count = m["overdue_count"]
            row.last_calculated_at = now
        else:
            row = CompanyCredibilityIndex(
                id=str(uuid4()),
                company_id=company_id,
                score=s["score"],
                grade=s["grade"],
                risk_level=s["risk_level"],
                ai_summary=s["ai_summary"],
                calculation_window_days=window_days,
                total_pos=m["total_pos"],
                paid_on_time=m["paid_on_time"],
                paid_late=m["paid_late"],
                unpaid=m["unpaid"],
                avg_delay_days=m["avg_delay_days"],
                max_delay_days=m["max_delay_days"],
                overdue_count=m["overdue_count"],
                last_calculated_at=now,
            )
            db.add(row)
        await db.flush()

    @staticmethod
    async def recalc_all(db: AsyncSession):
        window_days = await CredibilityService.get_config(db)
        metrics = await CredibilityService.aggregate_metrics(db, window_days)
        for company_id, m in metrics.items():
            s = await CredibilityService.score_with_ai(m)
            await CredibilityService.upsert_company_index(db, company_id, window_days, m, s)

    @staticmethod 
    async def recalc_for_company(db: AsyncSession, company_id: str): 
        window_days = await CredibilityService.get_config(db) 
        metrics = await CredibilityService.aggregate_metrics(db, window_days) 
        if company_id in metrics: 
            m = metrics[company_id] 
            s = await CredibilityService.score_with_ai(m) 
            await CredibilityService.upsert_company_index(db, company_id, window_days, m, s)

    @staticmethod
    async def get_for_company(db: AsyncSession, company_id: str):
        stmt = select(CompanyCredibilityIndex).where(CompanyCredibilityIndex.company_id == company_id)
        res = await db.execute(stmt)
        idx = res.scalars().first()
        if not idx:
            return None
        
        return {
            "score": idx.score,
            "grade": idx.grade,
            "risk_level": idx.risk_level,
            "stars": 5,
            "total_pos": idx.total_pos,
            "paid_on_time": idx.paid_on_time,
            "unpaid": idx.unpaid,
            "avg_delay_days": idx.avg_delay_days,
            "ai_summary": idx.ai_summary,
        }
