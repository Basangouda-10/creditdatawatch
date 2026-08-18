
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
            # Check global_credibility_index columns
            result_columns = await session.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'global_credibility_index'"))
            print("global_credibility_index columns:", [row[0] for row in result_columns.fetchall()])

            # Check a sample entry
            result_sample = await session.execute(text("SELECT * FROM global_credibility_index LIMIT 3"))
            rows = result_sample.mappings().all()
            print("\nSample global_credibility_index entries:")
            for row in rows:
                print(dict(row))
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

asyncio.run(main())
