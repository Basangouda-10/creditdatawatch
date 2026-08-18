import asyncio 
from sqlalchemy.ext.asyncio import create_async_engine 
from sqlalchemy import text 
import os
from pathlib import Path
from dotenv import load_dotenv

# Load database URL from .env
env_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(dotenv_path=env_path)
DATABASE_URL = os.getenv("DATABASE_URL")
print(f"Connecting to: {DATABASE_URL}")

async def migrate(): 
    engine = create_async_engine(DATABASE_URL) 
    async with engine.begin() as conn: 
        is_sqlite = DATABASE_URL.startswith("sqlite")
        
        if is_sqlite:
            await conn.execute(text(""" 
                CREATE TABLE IF NOT EXISTS user_activity_logs ( 
                    id INTEGER PRIMARY KEY AUTOINCREMENT, 
                    user_id VARCHAR(255), 
                    user_email VARCHAR(255), 
                    user_role VARCHAR(50), 
                    action VARCHAR(100) NOT NULL, 
                    page VARCHAR(255), 
                    entity_type VARCHAR(100), 
                    entity_id VARCHAR(255), 
                    details TEXT, 
                    ip_address VARCHAR(100), 
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP 
                ); 
            """))
        else:
            await conn.execute(text(""" 
                CREATE TABLE IF NOT EXISTS user_activity_logs ( 
                    id SERIAL PRIMARY KEY, 
                    user_id VARCHAR(255), 
                    user_email VARCHAR(255), 
                    user_role VARCHAR(50), 
                    action VARCHAR(100) NOT NULL, 
                    page VARCHAR(255), 
                    entity_type VARCHAR(100), 
                    entity_id VARCHAR(255), 
                    details TEXT, 
                    ip_address VARCHAR(100), 
                    timestamp TIMESTAMPTZ DEFAULT NOW() 
                ); 
            """)) 
        print("user_activity_logs table created successfully.") 
    await engine.dispose() 
 
if __name__ == "__main__":
    asyncio.run(migrate())
