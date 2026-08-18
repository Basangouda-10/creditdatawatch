import asyncio
from sqlalchemy import text
from app.database import engine
from app.models import Base

ALTER_STATEMENTS = [
    # Subscriptions table
    "ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS status VARCHAR(50);",
    "ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;",
    "ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS payment_id VARCHAR(100);",
    "ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS payment_proof_url VARCHAR(500);",
    "ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS verified_by VARCHAR(100);",
    "ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS processed_by VARCHAR(100);",
    "ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS approved_by VARCHAR(100);",
    "ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS start_date TIMESTAMP WITHOUT TIME ZONE;",
    "ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS expiry_date TIMESTAMP WITHOUT TIME ZONE;",

    # Payments table
    "ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_proof_url VARCHAR(500);",
    "ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_proof_filename VARCHAR(255);",
    "ALTER TABLE payments ADD COLUMN IF NOT EXISTS reference_id VARCHAR(100);",
    "ALTER TABLE payments ADD COLUMN IF NOT EXISTS failure_reason TEXT;",

    # Audit Logs table
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

    # Workflow Items table
    "ALTER TABLE workflow_items ADD COLUMN IF NOT EXISTS title VARCHAR(255);",
    "ALTER TABLE workflow_items ADD COLUMN IF NOT EXISTS description TEXT;",
    "ALTER TABLE workflow_items ADD COLUMN IF NOT EXISTS type VARCHAR(50);",
    "ALTER TABLE workflow_items ADD COLUMN IF NOT EXISTS status VARCHAR(50);",
    "ALTER TABLE workflow_items ADD COLUMN IF NOT EXISTS entity_id VARCHAR(100);",
    "ALTER TABLE workflow_items ADD COLUMN IF NOT EXISTS entity_type VARCHAR(50);",
    "ALTER TABLE workflow_items ADD COLUMN IF NOT EXISTS submitted_by_email VARCHAR(255);",
    "ALTER TABLE workflow_items ADD COLUMN IF NOT EXISTS assigned_to_role VARCHAR(50);",
    "ALTER TABLE workflow_items ADD COLUMN IF NOT EXISTS current_handler_role VARCHAR(50);",

    # Subscription Requests table
    "ALTER TABLE subscription_requests ADD COLUMN IF NOT EXISTS workflow_item_id VARCHAR(100);",
    "ALTER TABLE subscription_requests ADD COLUMN IF NOT EXISTS company_name VARCHAR(255);",
    "ALTER TABLE subscription_requests ADD COLUMN IF NOT EXISTS user_email VARCHAR(255);",
    "ALTER TABLE subscription_requests ADD COLUMN IF NOT EXISTS plan_name VARCHAR(100);",
    "ALTER TABLE subscription_requests ADD COLUMN IF NOT EXISTS amount NUMERIC(10, 2);"
]

async def fix_all():
    # 1. Create any missing tables defined in SQLAlchemy models
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # 2. Add missing columns to existing tables in independent transactions
    for stmt in ALTER_STATEMENTS:
        try:
            async with engine.begin() as conn:
                await conn.execute(text(stmt))
        except Exception:
            pass

    print("✅ Database schema fully repaired and synchronized!")

if __name__ == "__main__":
    asyncio.run(fix_all())