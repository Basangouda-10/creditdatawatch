
import asyncio
import os
import uuid
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
            # Get a real user
            user_result = await session.execute(text("SELECT id, email FROM users WHERE email = 'master.test@creditwatch.com'"))
            user_row = user_result.fetchone()
            if not user_row:
                raise Exception("Test user not found")
            user_id = user_row[0]
            user_email = user_row[1]
            print(f"Using user ID: {user_id}, email: {user_email}")
            
            # Create a test business check request with new company
            req_id = str(uuid.uuid4())
            new_gstin = f"TEST{uuid.uuid4().hex[:6]}XX"
            new_company = f"Test New Company {uuid.uuid4().hex[:4]}"
            
            await session.execute(text("""
                INSERT INTO business_check_requests (
                    id, user_id, company_name, gstin, verdict, report_text, report_url,
                    user_email, status, created_at
                ) VALUES (
                    :id, :user_id, :company_name, :gstin, 'SAFE', 'Test report', NULL,
                    :user_email, 'PENDING_MASTER_ADMIN', NOW()
                )
            """), {
                "id": req_id,
                "user_id": user_id,
                "company_name": new_company,
                "gstin": new_gstin,
                "user_email": user_email
            })
            await session.commit()
            print(f"Created test business request:")
            print(f"  ID: {req_id}")
            print(f"  Company Name: {new_company}")
            print(f"  GSTIN: {new_gstin}")
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

asyncio.run(main())
