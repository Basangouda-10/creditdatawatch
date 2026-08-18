import asyncio
import os
import sys
from sqlalchemy import text

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
SERVER_ROOT = os.path.dirname(CURRENT_DIR)
if SERVER_ROOT not in sys.path:
    sys.path.insert(0, SERVER_ROOT)

from app.database import engine  # type: ignore

async def run():
    async with engine.begin() as conn:
        await conn.execute(text("DROP INDEX IF EXISTS users_gstin_company_unique"))
        await conn.execute(text("CREATE INDEX IF NOT EXISTS idx_users_gstin_company ON users (gstin, company_id)"))
        print("Adjusted users GSTIN index to non-unique")

if __name__ == "__main__":
    asyncio.run(run())
