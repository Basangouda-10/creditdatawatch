
import asyncio
from app.database import AsyncSessionLocal
from sqlalchemy import text

async def enable_roles():
    async with AsyncSessionLocal() as session:
        print("Enabling FINANCIAL and LEGAL roles...")
        await session.execute(text("""
            UPDATE role_settings
            SET is_enabled = true
            WHERE role_name IN ('FINANCIAL', 'LEGAL')
        """))
        await session.commit()
        
        # Verify
        result = await session.execute(text("SELECT * FROM role_settings"))
        rows = result.fetchall()
        print("Role settings now:", [dict(row._mapping) for row in rows])
        print("Roles enabled!")

if __name__ == "__main__":
    asyncio.run(enable_roles())

