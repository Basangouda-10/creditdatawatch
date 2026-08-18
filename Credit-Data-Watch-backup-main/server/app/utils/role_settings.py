from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text


async def get_role_setting(db: AsyncSession, role_name: str) -> bool:
    """Check if a role is enabled in role_settings table"""
    try:
        result = await db.execute(
            text("SELECT is_enabled FROM role_settings WHERE role_name = :role_name"),
            {"role_name": role_name}
        )
        row = result.fetchone()
        if row:
            return row[0]
        # Fallback to system_settings if not found
        key = f"{role_name.lower()}_role_enabled"
        result_fallback = await db.execute(
            text("SELECT value FROM system_settings WHERE key = :key"),
            {"key": key}
        )
        row_fallback = result_fallback.fetchone()
        return row_fallback[0] == 'true' if row_fallback else True  # Default to True
    except Exception as e:
        print(f"[SETTINGS] Error checking {role_name}: {e}")
        return True  # Default to True if error


async def is_financial_enabled(db: AsyncSession) -> bool:
    return await get_role_setting(db, 'FINANCIAL')


async def is_legal_enabled(db: AsyncSession) -> bool:
    return await get_role_setting(db, 'LEGAL')
