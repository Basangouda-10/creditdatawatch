import asyncio
from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models import User, Company
from passlib.context import CryptContext
import uuid

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def create_ops():
    email = "ops@test.com"
    password = "Password@123"
    gstin = "22AAAAD0000A1Z5"

    async with AsyncSessionLocal() as db:
        # Get existing company ID
        stmt_comp = select(Company).where(Company.gstin == gstin)
        res_comp = await db.execute(stmt_comp)
        company = res_comp.scalars().first()
        company_id = company.id if company else None

        new_user = User(
            id=str(uuid.uuid4()),
            company_id=company_id,
            name="Operations User",
            email=email,
            password_hash=pwd_context.hash(password),
            role="OPERATION",
            status="ACTIVE",
            gstin=gstin,
            is_active=True,
            subscription_status="ACTIVE"
        )
        db.add(new_user)
        await db.commit()
        print(f"✅ Operations user '{email}' successfully created!")

if __name__ == "__main__":
    asyncio.run(create_ops())