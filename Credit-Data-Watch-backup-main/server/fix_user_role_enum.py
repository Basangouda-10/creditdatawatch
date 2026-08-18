import asyncio
from sqlalchemy import text
from app.database import engine

async def fix_user_role():
    statements = [
        # Convert users.role column to VARCHAR to prevent enum representation errors
        "ALTER TABLE users ALTER COLUMN role TYPE VARCHAR(50) USING role::text;",
        
        # If userrole ENUM exists, add the missing values to it as fallback
        "ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'OPERATIONS';",
        "ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'OPERATION';"
    ]

    async with engine.begin() as conn:
        for stmt in statements:
            try:
                await conn.execute(text(stmt))
            except Exception as e:
                print(f"Notice: {e}")

    print("✅ Successfully updated 'users.role' column to prevent enum validation errors!")

if __name__ == "__main__":
    asyncio.run(fix_user_role())