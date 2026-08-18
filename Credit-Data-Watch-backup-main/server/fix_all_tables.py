import asyncio
from sqlalchemy import text
from app.database import engine

async def fix_database():
    statements = [
        # 1. Audit Logs Table
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
        "ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS new_data TEXT;",

        # 2. Workflow Items Table
        """
        CREATE TABLE IF NOT EXISTS workflow_items (
            id VARCHAR(50) PRIMARY KEY,
            type VARCHAR(50),
            status VARCHAR(50),
            title VARCHAR(255),
            description TEXT,
            entity_id VARCHAR(50),
            entity_type VARCHAR(50),
            submitted_by_email VARCHAR(255),
            assigned_to_role VARCHAR(50),
            current_handler_role VARCHAR(50),
            created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
        );
        """,
        "ALTER TABLE workflow_items ADD COLUMN IF NOT EXISTS title VARCHAR(255);",
        "ALTER TABLE workflow_items ADD COLUMN IF NOT EXISTS description TEXT;",
        "ALTER TABLE workflow_items ADD COLUMN IF NOT EXISTS type VARCHAR(50);",
        "ALTER TABLE workflow_items ADD COLUMN IF NOT EXISTS entity_id VARCHAR(50);",
        "ALTER TABLE workflow_items ADD COLUMN IF NOT EXISTS entity_type VARCHAR(50);",
        "ALTER TABLE workflow_items ADD COLUMN IF NOT EXISTS submitted_by_email VARCHAR(255);",
        "ALTER TABLE workflow_items ADD COLUMN IF NOT EXISTS assigned_to_role VARCHAR(50);",
        "ALTER TABLE workflow_items ADD COLUMN IF NOT EXISTS current_handler_role VARCHAR(50);",

        # 3. Subscription Requests Table
        """
        CREATE TABLE IF NOT EXISTS subscription_requests (
            id VARCHAR(50) PRIMARY KEY,
            user_id VARCHAR(50) NOT NULL,
            user_email VARCHAR(255) NOT NULL,
            company_name VARCHAR(255),
            plan_name VARCHAR(100),
            amount NUMERIC(10, 2),
            workflow_item_id VARCHAR(50),
            status VARCHAR(50) DEFAULT 'PENDING',
            created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
        );
        """,

        # 4. Workflow Histories Table
        """
        CREATE TABLE IF NOT EXISTS workflow_histories (
            id VARCHAR(50) PRIMARY KEY,
            workflow_item_id VARCHAR(50),
            action VARCHAR(100),
            actor_email VARCHAR(255),
            actor_role VARCHAR(50),
            comments TEXT,
            created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
        );
        """,

        # 5. Notifications Table
        """
        CREATE TABLE IF NOT EXISTS notifications (
            id VARCHAR(50) PRIMARY KEY,
            user_id VARCHAR(50),
            title VARCHAR(255),
            message TEXT,
            is_read BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
        );
        """
    ]

    async with engine.begin() as conn:
        for stmt in statements:
            await conn.execute(text(stmt))

    print("✅ All workflow and audit tables successfully updated!")

if __name__ == "__main__":
    asyncio.run(fix_database())