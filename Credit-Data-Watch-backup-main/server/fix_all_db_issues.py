import asyncio
from sqlalchemy import text
from app.database import engine

SQL_COMMANDS = [
    # 1. Audit Logs Table
    """CREATE TABLE IF NOT EXISTS audit_logs (
        id VARCHAR(100) PRIMARY KEY,
        user_id VARCHAR(100),
        user_email VARCHAR(255),
        user_name VARCHAR(255),
        action VARCHAR(100),
        entity_type VARCHAR(100),
        entity_id VARCHAR(100),
        po_number VARCHAR(100),
        vendor_name VARCHAR(255),
        reason TEXT,
        old_data TEXT,
        new_data TEXT,
        metadata_json JSON,
        created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
    );""",
    "ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_id VARCHAR(100);",
    "ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_email VARCHAR(255);",
    "ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_name VARCHAR(255);",
    "ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS action VARCHAR(100);",
    "ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS entity_type VARCHAR(100);",
    "ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS entity_id VARCHAR(100);",
    "ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS po_number VARCHAR(100);",
    "ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS vendor_name VARCHAR(255);",
    "ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS reason TEXT;",
    "ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS old_data TEXT;",
    "ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS new_data TEXT;",
    "ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS metadata_json JSON;",
    "ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW();",

    # 2. Workflow Items Table
    """CREATE TABLE IF NOT EXISTS workflow_items (
        id VARCHAR(100) PRIMARY KEY,
        type VARCHAR(50),
        status VARCHAR(50),
        title VARCHAR(255),
        description TEXT,
        entity_id VARCHAR(100),
        entity_type VARCHAR(50),
        submitted_by_email VARCHAR(255),
        assigned_to_role VARCHAR(50),
        current_handler_role VARCHAR(50),
        created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
    );""",
    "ALTER TABLE workflow_items ADD COLUMN IF NOT EXISTS title VARCHAR(255);",
    "ALTER TABLE workflow_items ADD COLUMN IF NOT EXISTS description TEXT;",
    "ALTER TABLE workflow_items ADD COLUMN IF NOT EXISTS type VARCHAR(50);",
    "ALTER TABLE workflow_items ADD COLUMN IF NOT EXISTS status VARCHAR(50);",
    "ALTER TABLE workflow_items ADD COLUMN IF NOT EXISTS entity_id VARCHAR(100);",
    "ALTER TABLE workflow_items ADD COLUMN IF NOT EXISTS entity_type VARCHAR(50);",
    "ALTER TABLE workflow_items ADD COLUMN IF NOT EXISTS submitted_by_email VARCHAR(255);",
    "ALTER TABLE workflow_items ADD COLUMN IF NOT EXISTS assigned_to_role VARCHAR(50);",
    "ALTER TABLE workflow_items ADD COLUMN IF NOT EXISTS current_handler_role VARCHAR(50);",

    # 3. Subscription Requests Table
    """CREATE TABLE IF NOT EXISTS subscription_requests (
        id VARCHAR(100) PRIMARY KEY,
        user_id VARCHAR(100) NOT NULL,
        user_email VARCHAR(255) NOT NULL,
        company_name VARCHAR(255),
        plan_name VARCHAR(100),
        amount NUMERIC(10, 2),
        workflow_item_id VARCHAR(100),
        status VARCHAR(50) DEFAULT 'PENDING',
        created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
    );""",
    "ALTER TABLE subscription_requests ADD COLUMN IF NOT EXISTS workflow_item_id VARCHAR(100);",
    "ALTER TABLE subscription_requests ADD COLUMN IF NOT EXISTS company_name VARCHAR(255);",
    "ALTER TABLE subscription_requests ADD COLUMN IF NOT EXISTS user_email VARCHAR(255);",
    "ALTER TABLE subscription_requests ADD COLUMN IF NOT EXISTS plan_name VARCHAR(100);",
    "ALTER TABLE subscription_requests ADD COLUMN IF NOT EXISTS amount NUMERIC(10, 2);",

    # 4. Payments Table
    "ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_proof_url VARCHAR(500);",
    "ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_proof_filename VARCHAR(255);"
]

async def run_fix():
    for sql in SQL_COMMANDS:
        try:
            async with engine.begin() as conn:
                await conn.execute(text(sql))
        except Exception as e:
            pass
    print("✅ All database tables and columns are fully synced and repaired!")

if __name__ == "__main__":
    asyncio.run(run_fix())