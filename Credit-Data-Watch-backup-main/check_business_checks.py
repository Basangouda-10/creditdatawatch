
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy import text
from dotenv import load_dotenv
import os

load_dotenv(dotenv_path='server/.env')

DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql+asyncpg://postgres:postgres@localhost:5432/creditwatch')

async def main():
    engine = create_async_engine(DATABASE_URL)
    async with AsyncSession(engine) as session:
        result = await session.execute(text("""
            SELECT id, company_name, status, created_at FROM business_check_requests ORDER BY created_at DESC LIMIT 20
        """))
        rows = result.mappings().all()
        print(f"Found {len(rows)} business check requests:")
        for row in rows:
            print(f"  ID: {row['id']}, Company: {row['company_name']}, Status: {row['status']}, Created: {row['created_at']}")
        
        if len(rows) > 0:
            # Check what statuses exist
            statuses = set()
            result = await session.execute(text("SELECT DISTINCT status FROM business_check_requests"))
            for row in result:
                statuses.add(row[0])
            print(f"\nDistinct statuses: {statuses}")
    await engine.dispose()

asyncio.run(main())
