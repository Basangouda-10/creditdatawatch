"""Ensure system_settings has default entries for financial_role_enabled and legal_role_enabled"""
import asyncio
from app.database import get_db
from sqlalchemy import text


async def ensure_default_settings():
    db_gen = get_db()
    db = await anext(db_gen)
    
    # Check for financial_role_enabled
    result = await db.execute(text("SELECT 1 FROM system_settings WHERE key = 'financial_role_enabled'"))
    if not result.fetchone():
        await db.execute(text("""
            INSERT INTO system_settings (key, value, description)
            VALUES ('financial_role_enabled', 'false', 'Enable or disable Financial Team role')
        """))
        print("✅ Inserted financial_role_enabled default value")
    
    # Check for legal_role_enabled
    result = await db.execute(text("SELECT 1 FROM system_settings WHERE key = 'legal_role_enabled'"))
    if not result.fetchone():
        await db.execute(text("""
            INSERT INTO system_settings (key, value, description)
            VALUES ('legal_role_enabled', 'false', 'Enable or disable Legal Team role')
        """))
        print("✅ Inserted legal_role_enabled default value")
    
    await db.commit()
    print("✅ System settings are up-to-date!")


if __name__ == "__main__":
    asyncio.run(ensure_default_settings())
