
import asyncio
import os
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy import text

# Load server .env
server_env = os.path.join(os.path.dirname(__file__), 'server', '.env')
load_dotenv(dotenv_path=server_env, override=True)

DATABASE_URL = os.getenv('DATABASE_URL')

async def main():
    try:
        engine = create_async_engine(DATABASE_URL)
        
        async with AsyncSession(engine) as session:
            # Update rows
            result = await session.execute(text("""
                UPDATE business_check_requests 
                SET status = 'PENDING_MASTER_ADMIN' 
                WHERE status = 'PENDING_MASTER'
                RETURNING id, company_name, status
            """))
            updated_rows = result.mappings().all()
            print(f"Updated {len(updated_rows)} rows:")
            for row in updated_rows:
                print(f"  - {row['company_name']} (ID: {row['id']})")
                
            await session.commit()
            
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

asyncio.run(main())
