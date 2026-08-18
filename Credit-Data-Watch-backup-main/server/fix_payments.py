import asyncio
from app.database import AsyncSessionLocal
from sqlalchemy import text

async def fix():
    async with AsyncSessionLocal() as db:
        async with db.begin():
            await db.execute(text("ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_proof_url VARCHAR(500)"))
        print("Done!")

asyncio.run(fix())