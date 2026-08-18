import asyncio
from sqlalchemy import text
from app.database import engine

async def fix_columns():
    statements = [
        "ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS vendor_name VARCHAR(255);",
        "ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS vendor_gstin VARCHAR(50);",
        "ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS vendor VARCHAR(255);",
        # Sync values if vendor_name is NULL but vendor exists
        "UPDATE purchase_orders SET vendor_name = vendor WHERE vendor_name IS NULL AND vendor IS NOT NULL;",
        "UPDATE purchase_orders SET vendor = vendor_name WHERE vendor IS NULL AND vendor_name IS NOT NULL;"
    ]

    async with engine.begin() as conn:
        for stmt in statements:
            try:
                await conn.execute(text(stmt))
            except Exception as e:
                print(f"Notice: {e}")

    print("✅ Successfully synchronized 'purchase_orders' columns!")

if __name__ == "__main__":
    asyncio.run(fix_columns())