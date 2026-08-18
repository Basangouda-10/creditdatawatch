
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
            # Check constraints
            result = await session.execute(text("""
                SELECT
                    tc.constraint_name,
                    tc.constraint_type,
                    kcu.column_name
                FROM
                    information_schema.table_constraints AS tc
                JOIN information_schema.key_column_usage AS kcu
                ON tc.constraint_name = kcu.constraint_name
                WHERE tc.table_name = 'global_credibility_index'
            """))
            rows = result.mappings().all()
            print("global_credibility_index constraints:")
            for row in rows:
                print(dict(row))
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

asyncio.run(main())
