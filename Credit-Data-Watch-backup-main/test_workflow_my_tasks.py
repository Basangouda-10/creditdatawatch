
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
            # Master Admin business check requests query (fixed)
            result = await session.execute(text("""
                SELECT CAST(id AS TEXT) as id, company_name, gstin, verdict,
                    report_text, report_url, ops_reviewed_by, user_email as requested_by_email,
                    CAST(created_at AS TEXT) as created_at, status,
                    (CASE WHEN NOT EXISTS (
                        SELECT 1 FROM global_credibility_index
                        WHERE company_registration_no = gstin OR company_name = company_name
                    ) THEN true ELSE false END) as is_new_company
                FROM business_check_requests
                WHERE UPPER(status) IN ('PENDING_MASTER_ADMIN', 'PENDING_MASTER')
                ORDER BY created_at DESC
            """))
            rows = result.mappings().all()
            print(f"\nMaster Admin pending business requests: {len(rows)}")
            for row in rows:
                print(f"  - {row['company_name']} [{row['status']}] (ID: {row['id']})")

            # Check all statuses in business_check_requests
            print(f"\nAll business check request statuses (first 10):")
            result2 = await session.execute(text("""
                SELECT id, company_name, status FROM business_check_requests ORDER BY created_at DESC LIMIT 10
            """))
            rows2 = result2.mappings().all()
            for row in rows2:
                print(f"  - {row['company_name']}: {row['status']}")

    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

asyncio.run(main())
