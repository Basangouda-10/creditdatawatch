
import asyncio
import os
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy import text

# Load server .env
server_env = os.path.join(os.path.dirname(__file__), 'server', '.env')
print(f"Loading env from: {server_env}")
load_dotenv(dotenv_path=server_env, override=True)

DATABASE_URL = os.getenv('DATABASE_URL')
print(f"Database URL: {DATABASE_URL}")

async def main():
    try:
        engine = create_async_engine(DATABASE_URL)
        print("Engine created")
        
        async with AsyncSession(engine) as session:
            print("Session created")
            
            # Get all business check requests
            result = await session.execute(text("SELECT id, company_name, status, created_at FROM business_check_requests ORDER BY created_at DESC"))
            rows = result.mappings().all()
            
            print(f"\nFound {len(rows)} business check requests:")
            for row in rows:
                print(f"  - {row['company_name']} (ID: {row['id']}, Status: {row['status']})")
                
            # Get distinct status values
            result2 = await session.execute(text("SELECT DISTINCT status FROM business_check_requests"))
            statuses = [row[0] for row in result2]
            print(f"\nDistinct status values: {statuses}")
            
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

asyncio.run(main())
