import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models import Company, CompanyRating
from typing import List, Optional

class AICBIService:
    @staticmethod
    async def analyze_company_reliability(db: AsyncSession, company_id: str):
        # Get company info
        stmt = select(Company).where(Company.id == company_id)
        res = await db.execute(stmt)
        company = res.scalars().first()
        
        if not company:
            return "Company not found."
            
        # Get ratings
        rating_stmt = select(CompanyRating).where(CompanyRating.to_company_id == company_id)
        rating_res = await db.execute(rating_stmt)
        ratings = rating_res.scalars().all()
        
        rating_summary = ""
        for r in ratings:
            rating_summary += f"- {r.rating}/5 stars: {r.review or 'No review'}\n"
            
        prompt = f"""You are a business credibility analyst for CreditDataWatch.
Analyze the following company reliability data and provide a summary.

Company: {company.company_name}
GSTIN: {company.gstin}
Global CBI Star Rating: {company.global_cbi_stars}/5

Recent Ratings & Reviews:
{rating_summary if rating_summary else "No ratings yet."}

Based on this data, provide:
1. A summary of company reliability.
2. Interpretation of credibility trends.
3. Recommendations for businesses considering doing business with them.

Respond in a professional and concise manner."""

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "http://localhost:11434/api/generate",
                    json={
                        "model": "llama3:latest",
                        "prompt": prompt,
                        "stream": False
                    },
                    timeout=120.0
                    )
                if response.status_code == 200:
                    return response.json().get("response", "")
        except Exception as e:
            return f"Error connecting to Ollama: {str(e)}"
            
        return "AI analysis currently unavailable."

    @staticmethod
    async def summarize_platform_trends(db: AsyncSession):
        # Get top/bottom companies by rating
        stmt = select(Company).order_by(Company.global_cbi_stars.desc()).limit(5)
        res = await db.execute(stmt)
        top_companies = res.scalars().all()
        
        summary_text = "Top rated companies:\n"
        for c in top_companies:
            summary_text += f"- {c.company_name}: {c.global_cbi_stars}/5 stars\n"
            
        prompt = f"""You are a business credibility analyst for CreditDataWatch.
Summarize the current credibility trends across the entire platform.

Current Top Companies:
{summary_text}

Provide a high-level summary of platform trust and transparency trends."""

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "http://localhost:11434/api/generate",
                    json={
                        "model": "llama3:latest",
                        "prompt": prompt,
                        "stream": False
                    },
                    timeout=120.0
                )
                if response.status_code == 200:
                    return response.json().get("response", "")
        except Exception as e:
            return f"Error connecting to Ollama: {str(e)}"
            
        return "AI analysis currently unavailable."
