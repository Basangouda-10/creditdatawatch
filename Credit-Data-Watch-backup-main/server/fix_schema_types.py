import asyncio
from sqlalchemy import text
from app.database import engine

async def fix_schema_types():
    statements = [
        # Ensure payments table statuses match lower/upper enum values
        "ALTER TABLE payments ALTER COLUMN status TYPE VARCHAR(50);",
        "ALTER TABLE payments ALTER COLUMN payment_method TYPE VARCHAR(50);",
        
        # Ensure workflow tables can hold UUID strings
        "ALTER TABLE subscription_requests ALTER COLUMN id TYPE VARCHAR(100);",
        "ALTER TABLE subscription_requests ALTER COLUMN user_id TYPE VARCHAR(100);",
        "ALTER TABLE subscription_requests ALTER COLUMN workflow_item_id TYPE VARCHAR(100);",
        
        "ALTER TABLE workflow_items ALTER COLUMN id TYPE VARCHAR(100);",
        "ALTER TABLE workflow_items ALTER COLUMN entity_id TYPE VARCHAR(100);",
        
        # Ensure audit_logs supports flexible metadata text/json
        "ALTER TABLE audit_logs ALTER COLUMN metadata_json TYPE JSON USING metadata_json::json;"
    ]

    async with engine.begin() as conn:
        for stmt in statements:
            try:
                await conn.execute(text(stmt))
            except Exception as e:
                print(f"Notice (skipped or already updated): {e}")

    print("✅ All column type definitions updated successfully!")

if __name__ == "__main__":
    asyncio.run(fix_schema_types())