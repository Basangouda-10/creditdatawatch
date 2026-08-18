
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
            result = await session.execute(text("SELECT id, user_id, plan, status, created_at FROM subscriptions ORDER BY created_at DESC LIMIT 20"))
            rows = result.mappings().all()
            print(f"Found {len(rows)} subscriptions:")
            for row in rows:
                print(f"  - {row['plan']} ({row['status']}) - ID: {row['id']}")

    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

asyncio.run(main())
