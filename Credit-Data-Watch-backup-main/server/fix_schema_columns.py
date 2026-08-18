import asyncio
from sqlalchemy import text
from app.database import engine

async def fix_database():
    statements = [
        "ALTER TABLE workflow_items ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP;",
        "ALTER TABLE workflow_items ADD COLUMN IF NOT EXISTS current_handler_role VARCHAR(50);",
        "ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS vendor_mobile VARCHAR(50);",
        "ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS legal_support_requested_at TIMESTAMP;"
    ]

    async with engine.begin() as conn:
        for stmt in statements:
            try:
                await conn.execute(text(stmt))
            except Exception as e:
                print(f"Notice: {e}")

    print("✅ Successfully updated missing columns in 'workflow_items' and 'purchase_orders'!")

if __name__ == "__main__":
    asyncio.run(fix_database())