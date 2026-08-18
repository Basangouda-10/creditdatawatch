import asyncio
import sys
import os

# Add the server directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.database import AsyncSessionLocal
from sqlalchemy import text

async def list_tables():
    db = AsyncSessionLocal()
    result = await db.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"))
    tables = result.fetchall()
    print(f"\nPublic tables: {[t.table_name for t in tables]}\n")
    await db.close()

asyncio.run(list_tables())
