
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy import text
from dotenv import load_dotenv
import os
import uuid
from datetime import datetime
import sys

# Load the server's .env file
print("Python path:", sys.path)
print("CWD:", os.getcwd())
_server_env = os.path.join(os.path.dirname(__file__), 'server', '.env')
print("Loading env from:", _server_env)
load_dotenv(dotenv_path=_server_env, override=True)

DATABASE_URL = os.getenv('DATABASE_URL')
print("Final DATABASE_URL:", DATABASE_URL)
print("URL starts with postgresql?", DATABASE_URL.startswith('postgresql'))

async def main():
    engine = create_async_engine(DATABASE_URL)
    print("Engine:", engine)
    print("Engine URL:", engine.url)
    
    async with AsyncSession(engine) as session:
        # Get an actual user ID from the database
        user_result = await session.execute(text("SELECT id, email FROM users LIMIT 1"))
        user_row = user_result.mappings().first()
        if not user_row:
            print("No users found!")
            return
        
        user_id = user_row['id']
        user_email = user_row['email']
        print(f"Using user {user_email} with ID {user_id}")
        
        # Insert a test business check request
        req_id = str(uuid.uuid4())
        await session.execute(text("""
            INSERT INTO business_check_requests (
                id, user_id, user_email, company_name, gstin, reason, additional_info,
                status, verdict, report_text, ops_reviewed_by, created_at, reviewed_at
            ) VALUES (
                :id, :user_id, :user_email, 'Test Company', '27AAAAA0000A1Z5', 
                'Test reason', '', 'PENDING_MASTER_ADMIN', 'SAFE', 'This is a test report', 
                :user_email, NOW(), NOW()
            )
        """), {
            "id": req_id,
            "user_id": user_id,
            "user_email": user_email
        })
        await session.commit()
        print(f"Inserted test business check request with ID: {req_id}")
        
        # Now query to verify it's there
        result = await session.execute(text("""
            SELECT id, company_name, status FROM business_check_requests WHERE UPPER(status) = 'PENDING_MASTER_ADMIN'
        """))
        rows = result.mappings().all()
        print(f"\nFound {len(rows)} pending master admin requests:")
        for row in rows:
            print(f"  - {row['company_name']} ({row['id']}) - {row['status']}")
        
    await engine.dispose()

asyncio.run(main())
