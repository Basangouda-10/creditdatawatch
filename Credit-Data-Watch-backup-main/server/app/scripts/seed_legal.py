
import asyncio
import uuid
from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models import User, UserRole
from app.utils import hash_password

async def seed_legal_user():
    async with AsyncSessionLocal() as session:
        email = "legal@example.com"
        stmt = select(User).where(User.email == email)
        res = await session.execute(stmt)
        if res.scalars().first():
            print("Legal user already exists")
            return

        legal_user = User(
            id=str(uuid.uuid4()),
            email=email,
            password_hash=hash_password("LegalPassword123"),
            role=UserRole.LEGAL,
            gstin="27AAAAA0000A1Z5",
            company_name="Legal Firm",
            is_active=True
        )
        session.add(legal_user)
        await session.commit()
        print("Legal user seeded")

if __name__ == "__main__":
    asyncio.run(seed_legal_user())
