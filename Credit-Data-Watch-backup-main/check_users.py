
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

async def main():
    try:
        engine = create_async_engine(DATABASE_URL)
        print(f"Engine created!")
        async with AsyncSession(engine) as session:
            print("Session created!")
            # Get all users
            result = await session.execute(text("SELECT id, email, role, company_name, gstin FROM users"))
            rows = result.mappings().all()
            print(f"\nFound {len(rows)} users:")
            for row in rows:
                print(f"  - ID: {row['id']}, Email: {row['email']}, Role: {row['role']}, Company: {row['company_name']}, GSTIN: {row['gstin']}")

    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

asyncio.run(main())

