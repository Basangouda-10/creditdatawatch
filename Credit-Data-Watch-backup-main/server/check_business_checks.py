import asyncio
from app.database import AsyncSessionLocal
from sqlalchemy import text
from app.config import settings
import sys

sys.path.insert(0, r'c:\Users\payal\OneDrive\Desktop\CREDIT_WATCH_updated\server')

async def main():
    print("Connecting to database with URL:", settings.DATABASE_URL)
    
    async with AsyncSessionLocal() as db:
        print("\n=== business_check_requests ===")
        result = await db.execute(text("SELECT id, company_name, status, created_at FROM business_check_requests ORDER BY created_at DESC LIMIT 20;"))
        for row in result:
            print(row)

if __name__ == "__main__":
    asyncio.run(main())