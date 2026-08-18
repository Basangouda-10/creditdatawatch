import asyncio
import sys
import os

# Add the server directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.database import AsyncSessionLocal
from sqlalchemy import text

async def list_fks():
    db = AsyncSessionLocal()
    # Query to find foreign keys that reference users.id
    result = await db.execute(text("""
        SELECT 
            tc.table_name, 
            kcu.column_name
        FROM 
            information_schema.table_constraints tc
        JOIN 
            information_schema.key_column_usage kcu
        ON 
            tc.constraint_name = kcu.constraint_name
        JOIN 
            information_schema.constraint_column_usage ccu
        ON 
            ccu.constraint_name = tc.constraint_name
        WHERE 
            tc.constraint_type = 'FOREIGN KEY' AND 
            ccu.table_name = 'users' AND 
            ccu.column_name = 'id';
    """))
    fks = result.fetchall()
    print(f"\nForeign keys referencing users.id:")
    for fk in fks:
        print(f"  Table: {fk.table_name}, Column: {fk.column_name}")
    await db.close()

asyncio.run(list_fks())
