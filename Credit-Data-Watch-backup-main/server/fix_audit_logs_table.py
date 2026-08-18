import asyncio
from sqlalchemy import text
from app.database import engine

async def fix_audit_logs():
    statements = [
        """
        CREATE TABLE IF NOT EXISTS audit_logs (
            id VARCHAR(50) PRIMARY KEY,
            user_id VARCHAR(50),
            user_email VARCHAR(255),
            user_name VARCHAR(255),
            action VARCHAR(100),
            entity_type VARCHAR(100),
            entity_id VARCHAR(50),
            po_number VARCHAR(100),
            vendor_name VARCHAR(255),
            reason TEXT,
            old_data TEXT,
            new_data TEXT,
            metadata_json JSON,
            created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
        );
        """,
        "ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS metadata_json JSON;",
        "ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_name VARCHAR(255);",
        "ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS po_number VARCHAR(100);",
        "ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS vendor_name VARCHAR(255);",
        "ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS old_data TEXT;",
        "ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS new_data TEXT;"
    ]
    
    async with engine.begin() as conn:
        for stmt in statements:
            await conn.execute(text(stmt))
            
    print("✅ Successfully verified and updated 'audit_logs' table!")

if __name__ == "__main__":
    asyncio.run(fix_audit_logs())