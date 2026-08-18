import asyncio
import asyncpg

async def fix_db():
    print('=== FIXING POSTGRESQL DATABASE ===')
    try:
        conn = await asyncpg.connect('postgresql://postgres:2004@localhost:5432/creditdatawatch')
        
        # 1. Users table
        print("Migrating users table...")
        cols_to_add = [
            ("name", "VARCHAR(255)"),
            ("phone", "VARCHAR(20) DEFAULT 'N/A'"),
            ("subscription_status", "VARCHAR(20) DEFAULT 'INACTIVE'"),
            ("subscription_bypass", "BOOLEAN DEFAULT FALSE"),
            ("full_access", "BOOLEAN DEFAULT FALSE")
        ]
        for col, dtype in cols_to_add:
            try:
                await conn.execute(f"ALTER TABLE users ADD COLUMN {col} {dtype}")
                print(f" - Added {col}")
            except Exception as e:
                print(f" - Skip {col}: {e}")

        # 2. Purchase Orders table
        print("Migrating purchase_orders table...")
        po_cols = [
            ("payment_completed_at", "TIMESTAMP WITHOUT TIME ZONE"),
            ("updated_at", "TIMESTAMP WITHOUT TIME ZONE"),
            ("company_id", "VARCHAR(36)"),
            ("vendor_email", "VARCHAR(255)"),
            ("vendor_phone", "VARCHAR(20)"),
            ("legal_notice_sent_at", "TIMESTAMP WITHOUT TIME ZONE"),
            ("legal_notice_status", "VARCHAR(50)"),
            ("payment_window_days", "INTEGER DEFAULT 50"),
            ("legal_support_requested_at", "TIMESTAMP WITHOUT TIME ZONE"),
            ("evidence_url", "VARCHAR(500)"),
            ("evidence_filename", "VARCHAR(255)"),
            ("approval_status", "VARCHAR(50) DEFAULT 'APPROVED'"),
            ("approved_by", "VARCHAR(36)"),
            ("approved_at", "TIMESTAMP WITHOUT TIME ZONE"),
            ("rejection_reason", "TEXT"),
            ("approval_notes", "TEXT"),
            ("pending_changes", "TEXT")
        ]
        for col, dtype in po_cols:
            try:
                await conn.execute(f"ALTER TABLE purchase_orders ADD COLUMN {col} {dtype}")
                print(f" - Added {col}")
            except Exception as e:
                print(f" - Skip {col}: {e}")

        # 3. Create tables
        print("Creating workflow tables...")
        tables = [
            """CREATE TABLE IF NOT EXISTS audit_logs ( 
                id VARCHAR(36) PRIMARY KEY, 
                user_id VARCHAR(36), 
                user_email VARCHAR(255), 
                user_name VARCHAR(255), 
                action VARCHAR(50) NOT NULL, 
                entity_type VARCHAR(50) DEFAULT 'PO', 
                entity_id VARCHAR(36), 
                po_number VARCHAR(100), 
                vendor_name VARCHAR(255), 
                reason TEXT, 
                old_data TEXT, 
                new_data TEXT, 
                metadata_json TEXT, 
                created_at TIMESTAMP DEFAULT NOW() 
            )""",
            """CREATE TABLE IF NOT EXISTS notifications ( 
                id VARCHAR(36) PRIMARY KEY, 
                user_id VARCHAR(36), 
                user_email VARCHAR(255), 
                title VARCHAR(255) NOT NULL, 
                message TEXT NOT NULL, 
                type VARCHAR(50) DEFAULT 'INFO', 
                is_read BOOLEAN DEFAULT FALSE, 
                action_url VARCHAR(500), 
                workflow_item_id VARCHAR(36), 
                created_at TIMESTAMP DEFAULT NOW() 
            )""",
            """CREATE TABLE IF NOT EXISTS workflow_items ( 
                id VARCHAR(36) PRIMARY KEY, 
                type VARCHAR(50) NOT NULL, 
                status VARCHAR(50) DEFAULT 'PENDING', 
                title VARCHAR(255), 
                description TEXT, 
                entity_id VARCHAR(36), 
                entity_type VARCHAR(50), 
                submitted_by_email VARCHAR(255), 
                submitted_by_name VARCHAR(255), 
                assigned_to_role VARCHAR(50), 
                current_handler_role VARCHAR(50), 
                reviewed_by_email VARCHAR(255), 
                review_notes TEXT, 
                reviewed_at TIMESTAMP, 
                approved_by_email VARCHAR(255), 
                approval_notes TEXT, 
                approved_at TIMESTAMP, 
                rejected_by_email VARCHAR(255), 
                rejection_notes TEXT, 
                rejected_at TIMESTAMP, 
                metadata TEXT, 
                created_at TIMESTAMP DEFAULT NOW(), 
                updated_at TIMESTAMP DEFAULT NOW() 
            )""",
            """CREATE TABLE IF NOT EXISTS subscription_requests ( 
                id VARCHAR(36) PRIMARY KEY, 
                user_id VARCHAR(36), 
                user_email VARCHAR(255), 
                company_name VARCHAR(255), 
                plan_name VARCHAR(100), 
                amount DECIMAL(10,2) DEFAULT 0, 
                payment_status VARCHAR(50) DEFAULT 'PENDING', 
                workflow_status VARCHAR(50) DEFAULT 'PENDING', 
                workflow_item_id VARCHAR(36), 
                approved_at TIMESTAMP, 
                rejected_at TIMESTAMP, 
                rejection_reason TEXT, 
                created_at TIMESTAMP DEFAULT NOW() 
            )""",
            """CREATE TABLE IF NOT EXISTS po_approval_requests ( 
                id VARCHAR(36) PRIMARY KEY, 
                po_id VARCHAR(36) NOT NULL, 
                po_number VARCHAR(100), 
                requested_by_email VARCHAR(255), 
                edit_data TEXT, 
                evidence_url VARCHAR(500), 
                evidence_filename VARCHAR(255), 
                reason TEXT, 
                workflow_status VARCHAR(50) DEFAULT 'PENDING_FINANCIAL', 
                final_status VARCHAR(50) DEFAULT 'PENDING', 
                created_at TIMESTAMP DEFAULT NOW() 
            )"""
        ]
        for t_sql in tables:
            await conn.execute(t_sql)
            print(f" - Executed table creation")

        await conn.close()
        print('=== DB FIX COMPLETED ===')
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(fix_db())
