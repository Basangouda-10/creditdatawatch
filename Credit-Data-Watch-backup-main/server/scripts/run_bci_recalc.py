import asyncio
import os, sys
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
SERVER_ROOT = os.path.dirname(CURRENT_DIR)
if SERVER_ROOT not in sys.path:
    sys.path.insert(0, SERVER_ROOT)
from app.database import AsyncSessionLocal
from app.services.credibility_service import CredibilityService

async def main():
    async with AsyncSessionLocal() as db:
        await CredibilityService.recalc_all(db)
        await db.commit()
        print("BCI recalculation complete")

if __name__ == "__main__":
    asyncio.run(main())
