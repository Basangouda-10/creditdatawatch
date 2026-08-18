import asyncio 
from sqlalchemy.ext.asyncio import create_async_engine 
from sqlalchemy import text 
import os
from pathlib import Path
from dotenv import load_dotenv

# Load database URL from .env
env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=str(env_path))
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./test.db")

async def migrate(): 
    engine = create_async_engine(DATABASE_URL) 
    async with engine.begin() as conn: 
        # Check if it's SQLite or PostgreSQL for slightly different syntax if needed
        # But ADD COLUMN IF NOT EXISTS is generally supported in newer PG.
        # SQLite doesn't support ADD COLUMN IF NOT EXISTS or multiple columns in one ALTER.
        
        is_sqlite = DATABASE_URL.startswith("sqlite")
        
        if is_sqlite:
            columns = [
                ("approval_status", "VARCHAR(50) DEFAULT NULL"),
                ("evidence_url", "TEXT DEFAULT NULL"),
                ("approval_notes", "TEXT DEFAULT NULL"),
                ("approved_by", "VARCHAR(255) DEFAULT NULL"),
                ("approved_at", "DATETIME DEFAULT NULL"),
                ("pending_changes", "JSON DEFAULT NULL")
            ]
            for col_name, col_type in columns:
                try:
                    await conn.execute(text(f"ALTER TABLE purchase_orders ADD COLUMN {col_name} {col_type}"))
                    print(f"Added column {col_name}")
                except Exception as e:
                    if "duplicate column name" in str(e).lower():
                        print(f"Column {col_name} already exists.")
                    else:
                        print(f"Error adding {col_name}: {e}")
        else:
            await conn.execute(text(""" 
                ALTER TABLE purchase_orders 
                ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50) DEFAULT NULL, 
                ADD COLUMN IF NOT EXISTS evidence_url TEXT DEFAULT NULL, 
                ADD COLUMN IF NOT EXISTS approval_notes TEXT DEFAULT NULL, 
                ADD COLUMN IF NOT EXISTS approved_by VARCHAR(255) DEFAULT NULL, 
                ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ DEFAULT NULL, 
                ADD COLUMN IF NOT EXISTS pending_changes JSONB DEFAULT NULL; 
            """)) 
            print("PO approval columns added successfully.") 
    await engine.dispose() 
 
if __name__ == "__main__":
    asyncio.run(migrate())
