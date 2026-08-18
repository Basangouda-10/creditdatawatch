import asyncio
from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models import User


async def run(email: str):
    async with AsyncSessionLocal() as session:
        res = await session.execute(select(User).where(User.email == email.lower()))
        user = res.scalars().first()
        if not user:
            print("user_not_found")
            return
        print("email=", getattr(user, "email", None))
        print("role=", getattr(user, "role", None))
        print("subscription_status=", getattr(user, "subscription_status", None))
        print("company_id=", getattr(user, "company_id", None))
        print("gstin=", getattr(user, "gstin", None))


if __name__ == "__main__":
    asyncio.run(run("payalshinde906@gmail.com"))
