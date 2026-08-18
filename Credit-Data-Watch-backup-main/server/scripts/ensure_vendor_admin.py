import asyncio
from uuid import uuid4
from sqlalchemy import select
import os, sys
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
SERVER_ROOT = os.path.dirname(CURRENT_DIR)
if SERVER_ROOT not in sys.path:
    sys.path.insert(0, SERVER_ROOT)
from app.database import AsyncSessionLocal
from app.models import Company, User
from app.utils.password import hash_password

VENDOR_GSTIN = "22AAAAA0000A1Z5"
VENDOR_COMPANY_NAME = "Vendor Test Co"
VENDOR_EMAIL = "vendoradmin@example.com"
VENDOR_DOMAIN = "example.com"
VENDOR_PASSWORD = "VendorPass123!"

async def main():
    async with AsyncSessionLocal() as db:
        res_company = await db.execute(select(Company).where(Company.gstin == VENDOR_GSTIN))
        company = res_company.scalars().first()
        if not company:
            company = Company(
                id=str(uuid4()),
                company_name=VENDOR_COMPANY_NAME,
                gstin=VENDOR_GSTIN,
                domain_name=VENDOR_DOMAIN,
                is_verified=True,
            )
            db.add(company)
            await db.flush()
        res_user = await db.execute(select(User).where(User.email == VENDOR_EMAIL))
        user = res_user.scalars().first()
        if not user:
            user = User(
                id=str(uuid4()),
                company_id=company.id,
                name="Vendor Admin",
                email=VENDOR_EMAIL,
                password_hash=hash_password(VENDOR_PASSWORD),
                role="COMPANY_ADMIN",
                status="ACTIVE",
                phone="+919999999999",
                is_active=True,
                gstin=VENDOR_GSTIN,
                company_name=VENDOR_COMPANY_NAME,
            )
            db.add(user)
        await db.commit()
        print("Vendor admin ensured:", VENDOR_EMAIL, "company_id:", company.id)

if __name__ == "__main__":
    asyncio.run(main())
