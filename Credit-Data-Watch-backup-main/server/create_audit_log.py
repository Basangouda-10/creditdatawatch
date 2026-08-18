import asyncio 
from sqlalchemy.ext.asyncio import create_async_engine 
from sqlalchemy import text 

DATABASE_URL = "postgresql+asyncpg://postgres:2004@localhost:5432/creditdatawatch" 

async def create_table(): 
    engine = create_async_engine(DATABASE_URL) 
    async with engine.begin() as conn: 
        await conn.execute(text(""" 
            CREATE TABLE IF NOT EXISTS po_audit_logs ( 
                id SERIAL PRIMARY KEY, 
                po_id VARCHAR(100), 
                po_number VARCHAR(100), 
                action VARCHAR(20) NOT NULL, 
                performed_by_email VARCHAR(255), 
                performed_by_role VARCHAR(50), 
                reason TEXT, 
                changes_made TEXT, 
                timestamp TIMESTAMPTZ DEFAULT NOW() 
            ); 
        """)) 
        print("po_audit_logs table created successfully.") 
    await engine.dispose() 

asyncio.run(create_table()) 
