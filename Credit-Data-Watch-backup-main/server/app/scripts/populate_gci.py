
import asyncio
import uuid
from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models import Company
from app.models.credibility_index import (
    GlobalCredibilityIndex,
    CredibilityStatus,
    AICreditRiskVerdict
)

async def populate_gci():
    print("Starting GCI population...")
    async with AsyncSessionLocal() as db:
        # Get all companies that don't have a GCI entry yet
        all_companies_result = await db.execute(select(Company))
        all_companies = all_companies_result.scalars().all()

        # Get all existing GCI entries' company_ids
        existing_gci_result = await db.execute(
            select(GlobalCredibilityIndex.company_id)
            .where(GlobalCredibilityIndex.company_id.isnot(None))
        )
        existing_company_ids = {row[0] for row in existing_gci_result.fetchall()}

        companies_to_add = [c for c in all_companies if c.id not in existing_company_ids]

        if not companies_to_add:
            print("No new companies to add to GCI!")
            return

        print(f"Found {len(companies_to_add)} companies to add to GCI")
        
        for company in companies_to_add:
            print(f"Adding company: {company.company_name} ({company.gstin})")
            gci_entry = GlobalCredibilityIndex(
                id=str(uuid.uuid4()),
                company_id=company.id,
                company_name=company.company_name,
                company_registration_no=None,
                partner_trust_score=0.0,
                ai_credit_risk_verdict=AICreditRiskVerdict.NOT_RATED,
                credibility_status=CredibilityStatus.STANDARD,
                approved_by_master_admin_id=None,
                approved_at=None,
                credibility_review_id=None
            )
            db.add(gci_entry)
        
        await db.commit()
        print(f"Successfully added {len(companies_to_add)} companies to GCI!")

if __name__ == "__main__":
    asyncio.run(populate_gci())
