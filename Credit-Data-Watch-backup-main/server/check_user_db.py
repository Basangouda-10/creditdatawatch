
import asyncio
from sqlalchemy import select
from app.database import engine, AsyncSession
from app.models import User

async def check_user():
    async with AsyncSession(engine) as session:
        stmt = select(User).where(User.email == "payalshinde906@gmail.com")
        result = await session.execute(stmt)
        user = result.scalars().first()
        if user:
            print(f"User found: ID={user.id}, Email={user.email}, Role={user.role}")
        else:
            print("User not found")

if __name__ == "__main__":
    asyncio.run(check_user())
