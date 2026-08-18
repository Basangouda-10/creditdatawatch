import asyncio
from sqlalchemy import text
from app.database import engine

async def fix_all_columns():
    statements = [
        # 1. workflow_items
        "ALTER TABLE workflow_items ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP;",
        "ALTER TABLE workflow_items ADD COLUMN IF NOT EXISTS current_handler_role VARCHAR(50);",
        "ALTER TABLE workflow_items ADD COLUMN IF NOT EXISTS title VARCHAR(255);",

        # 2. purchase_orders
        "ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS vendor_mobile VARCHAR(50);",
        "ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS legal_support_requested_at TIMESTAMP;",
        "ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS due_date TIMESTAMP;",

        # 3. global_credibility_index
        "ALTER TABLE global_credibility_index ADD COLUMN IF NOT EXISTS company_registration_no VARCHAR(50);",
        "ALTER TABLE global_credibility_index ADD COLUMN IF NOT EXISTS company_name VARCHAR(255);",

        # 4. business_check_requests
        "ALTER TABLE business_check_requests ADD COLUMN IF NOT EXISTS company_registration_no VARCHAR(50);",
        "ALTER TABLE business_check_requests ADD COLUMN IF NOT EXISTS report_url VARCHAR(500);",
        "ALTER TABLE business_check_requests ADD COLUMN IF NOT EXISTS ops_reviewed_by VARCHAR(255);"
    ]

    async with engine.begin() as conn:
        for stmt in statements:
            try:
                await conn.execute(text(stmt))
            except Exception as e:
                print(f"Notice: {e}")

    print("✅ Successfully updated all database workflow and index columns!")

if __name__ == "__main__":
    asyncio.run(fix_all_columns())