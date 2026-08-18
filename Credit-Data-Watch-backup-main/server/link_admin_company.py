import asyncio
import uuid
from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models import Company, User

GSTIN = "22AAAAD0000A1Z5"
DOMAIN = "acme.co"
NAME = "Test Company"
ADMIN_EMAIL = "payalshinde906@gmail.com"

async def main() -> None:
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(Company).where(Company.gstin == GSTIN))
        company = res.scalars().first()
        if not company:
            company = Company(
                id=str(uuid.uuid4()),
                company_name=NAME,
                gstin=GSTIN,
                domain_name=DOMAIN,
                is_verified=True,
            )
            db.add(company)
            await db.commit()
        res2 = await db.execute(select(User).where(User.email == ADMIN_EMAIL))
        user = res2.scalars().first()
        if user and user.company_id != company.id:
            user.company_id = company.id
            await db.commit()
        print("Linked admin to company:", company.id)

if __name__ == "__main__":
    asyncio.run(main())
