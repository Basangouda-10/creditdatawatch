
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
            # Check columns
            result_cols = await session.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'subscriptions'"))
            cols = [row[0] for row in result_cols.fetchall()]
            print("Subscriptions table columns:", cols)
            
            # Get all rows
            result = await session.execute(text(f"SELECT {', '.join(cols)} FROM subscriptions ORDER BY created_at DESC LIMIT 20"))
            rows = result.mappings().all()
            print(f"\nFound {len(rows)} subscriptions:")
            for row in rows:
                print(f"  - {dict(row)}")

    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

asyncio.run(main())
