import asyncio
from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models import User
from app.services.access_control_service import AccessControlService


async def run(email: str):
    async with AsyncSessionLocal() as session:
        res = await session.execute(select(User).where(User.email == email.lower()))
        user = res.scalars().first()
        if not user:
            print("user_not_found")
            return
        ok = await AccessControlService.can_access_feature(user.id, "PO_MANAGEMENT", session)
        print("access_po=", ok)


if __name__ == "__main__":
    asyncio.run(run("admin@companya.com"))
