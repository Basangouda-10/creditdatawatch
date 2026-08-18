import asyncio
from sqlalchemy import text
from app.database import engine

async def create_missing_table():
    async with engine.begin() as conn:
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS subscription_requests (
                id VARCHAR(50) PRIMARY KEY,
                user_id VARCHAR(50) NOT NULL,
                user_email VARCHAR(255) NOT NULL,
                company_name VARCHAR(255),
                plan_name VARCHAR(100),
                amount NUMERIC(10, 2),
                workflow_item_id VARCHAR(50),
                status VARCHAR(50) DEFAULT 'PENDING',
                created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
            );
        """))
    print("✅ Successfully created 'subscription_requests' table in creditdatawatch database!")

if __name__ == "__main__":
    asyncio.run(create_missing_table())