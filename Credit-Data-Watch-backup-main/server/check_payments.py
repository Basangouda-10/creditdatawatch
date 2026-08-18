import asyncio
from app.database import AsyncSessionLocal
from sqlalchemy import text

async def check():
    async with AsyncSessionLocal() as db:
        result = await db.execute(text(
            "SELECT column_name FROM information_schema.columns WHERE table_name='payments' ORDER BY column_name"
        ))
        for row in result:
            print(row[0])

asyncio.run(check())