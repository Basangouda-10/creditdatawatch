
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
            # Exact same query as workflow.py (fixed)
            result = await session.execute(text("""
                SELECT CAST(id AS TEXT) as id, company_name, gstin, verdict,
                    report_text, report_url, ops_reviewed_by, user_email as requested_by_email,
                    CAST(created_at AS TEXT) as created_at,
                    (CASE WHEN NOT EXISTS (
                        SELECT 1 FROM global_credibility_index
                        WHERE company_registration_no = gstin OR company_name = company_name
                    ) THEN true ELSE false END) as is_new_company
                FROM business_check_requests
                WHERE UPPER(status) IN ('PENDING_MASTER_ADMIN', 'PENDING_MASTER')
                ORDER BY created_at DESC
            """))
            rows = result.mappings().all()
            
            print(f"\nQuery returned {len(rows)} rows:")
            for row in rows:
                print(f"  - {row['company_name']} (ID: {row['id']}, Status: {row['status'] if 'status' in row else 'N/A'})")
                
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

asyncio.run(main())
