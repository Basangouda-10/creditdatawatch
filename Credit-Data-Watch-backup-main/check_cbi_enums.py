
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
            # Check enums
            result = await session.execute(text("""
                SELECT
                    t.typname AS enum_name,
                    string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) AS enum_values
                FROM pg_type t
                JOIN pg_enum e ON t.oid = e.enumtypid
                JOIN pg_namespace n ON n.oid = t.typnamespace
                WHERE n.nspname = 'public' AND t.typname LIKE '%gci%' OR t.typname LIKE '%credibility%' OR t.typname LIKE '%risk%' OR t.typname LIKE '%legal%' OR t.typname LIKE '%operational%'
                GROUP BY t.typname
            """))
            rows = result.mappings().all()
            print("Relevant enum values:")
            for row in rows:
                print(f"{row['enum_name']}: {row['enum_values']}")
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

asyncio.run(main())
