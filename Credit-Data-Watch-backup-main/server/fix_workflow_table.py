import asyncio
from sqlalchemy import text
from app.database import engine

async def update_workflow_table():
    statements = [
        "ALTER TABLE workflow_items ADD COLUMN IF NOT EXISTS title VARCHAR(255);",
        "ALTER TABLE workflow_items ADD COLUMN IF NOT EXISTS description TEXT;",
        "ALTER TABLE workflow_items ADD COLUMN IF NOT EXISTS type VARCHAR(50);",
        "ALTER TABLE workflow_items ADD COLUMN IF NOT EXISTS entity_id VARCHAR(50);",
        "ALTER TABLE workflow_items ADD COLUMN IF NOT EXISTS entity_type VARCHAR(50);",
        "ALTER TABLE workflow_items ADD COLUMN IF NOT EXISTS submitted_by_email VARCHAR(255);",
        "ALTER TABLE workflow_items ADD COLUMN IF NOT EXISTS assigned_to_role VARCHAR(50);",
        "ALTER TABLE workflow_items ADD COLUMN IF NOT EXISTS current_handler_role VARCHAR(50);",
        "ALTER TABLE workflow_items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW();"
    ]
    
    async with engine.begin() as conn:
        for stmt in statements:
            await conn.execute(text(stmt))
            
    print("✅ Successfully added missing columns to 'workflow_items' table!")

if __name__ == "__main__":
    asyncio.run(update_workflow_table())