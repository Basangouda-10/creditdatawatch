import asyncio
from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models import Subscription, User


async def run(email: str):
    async with AsyncSessionLocal() as session:
        res = await session.execute(select(User).where(User.email == email.lower()))
        user = res.scalars().first()
        if not user:
            print("user_not_found")
            return
        print("user_id=", user.id)
        res2 = await session.execute(select(Subscription).where(Subscription.user_id == user.id))
        subs = res2.scalars().all()
        for s in subs:
            print("sub_id=", s.id, "active=", s.is_active, "status=", s.status, "start=", s.start_date, "expiry=", s.expiry_date, "plan_id=", s.plan_id)


if __name__ == "__main__":
    asyncio.run(run("admin@companya.com"))
