import asyncio
from sqlalchemy import text
from app.database import AsyncSessionLocal


async def check():
    async with AsyncSessionLocal() as session:
        # Get count safely
        result = await session.execute(text("SELECT COUNT(*) FROM plans"))
        count: int = result.scalar_one()

        print(f"Plans count: {count}")

        if count > 0:
            rows = await session.execute(text("SELECT name, price FROM plans"))
            for row in rows:
                print(f"- {row.name}: {row.price}")


if __name__ == "__main__":
    asyncio.run(check())
