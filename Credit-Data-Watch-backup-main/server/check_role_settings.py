import asyncio
from app.database import AsyncSessionLocal, engine
from sqlalchemy import text

async def create_role_settings():
    async with AsyncSessionLocal() as session:
        print("Creating role_settings table...")
        await session.execute(text("""
            CREATE TABLE IF NOT EXISTS role_settings (
                id SERIAL PRIMARY KEY,
                role_name VARCHAR(50) UNIQUE NOT NULL,
                is_enabled BOOLEAN DEFAULT true,
                updated_by VARCHAR(255),
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))
        await session.execute(text("""
            INSERT INTO role_settings (role_name, is_enabled)
            VALUES ('FINANCIAL', true), ('LEGAL', true)
            ON CONFLICT (role_name) DO NOTHING
        """))
        await session.commit()
        
        # Verify
        result = await session.execute(text("SELECT * FROM role_settings"))
        rows = result.fetchall()
        print("Role settings found:", [dict(row._mapping) for row in rows])
        print("✅ Done!")

if __name__ == "__main__":
    asyncio.run(create_role_settings())
