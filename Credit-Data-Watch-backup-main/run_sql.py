
import asyncio
import asyncpg

async def main():
    conn = await asyncpg.connect(
        user="postgres",
        password="2004",
        database="creditdatawatch",
        host="localhost",
        port=5432
    )

    # Create legal_notice_requests table
    print("Creating legal_notice_requests...")
    await conn.execute("""
        CREATE TABLE IF NOT EXISTS legal_notice_requests (
            id SERIAL PRIMARY KEY,
            po_id VARCHAR(255),
            po_number VARCHAR(100),
            vendor VARCHAR(255),
            vendor_email VARCHAR(255),
            amount NUMERIC(15,2),
            requested_by_email VARCHAR(255),
            requested_by_name VARCHAR(255),
            handler_role VARCHAR(50),
            ops_notes TEXT,
            ops_processed_by VARCHAR(255),
            ops_processed_at TIMESTAMP,
            master_notes TEXT,
            master_approved_by VARCHAR(255),
            master_approved_at TIMESTAMP,
            status VARCHAR(50) DEFAULT 'PENDING',
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );
    """)

    # Add missing columns to purchase_orders
    print("Adding purchase_orders columns...")
    await conn.execute("ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS legal_support_requested_at TIMESTAMP;")
    await conn.execute("ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS legal_notice_sent_at TIMESTAMP;")
    await conn.execute("ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS legal_support_requested_by VARCHAR(255);")

    # Add missing columns to business_check_requests (ACTIVE_BIZ_TABLE)
    print("Adding business_check_requests columns...")
    await conn.execute("ALTER TABLE business_check_requests ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'PENDING';")
    await conn.execute("ALTER TABLE business_check_requests ADD COLUMN IF NOT EXISTS verdict VARCHAR(20);")
    await conn.execute("ALTER TABLE business_check_requests ADD COLUMN IF NOT EXISTS report_text TEXT;")
    await conn.execute("ALTER TABLE business_check_requests ADD COLUMN IF NOT EXISTS report_url VARCHAR(500);")
    await conn.execute("ALTER TABLE business_check_requests ADD COLUMN IF NOT EXISTS ops_reviewed_by VARCHAR(255);")
    await conn.execute("ALTER TABLE business_check_requests ADD COLUMN IF NOT EXISTS master_approved_by VARCHAR(255);")
    await conn.execute("ALTER TABLE business_check_requests ADD COLUMN IF NOT EXISTS master_approved_at TIMESTAMP;")
    await conn.execute("ALTER TABLE business_check_requests ADD COLUMN IF NOT EXISTS save_to_network BOOLEAN DEFAULT FALSE;")

    # Create network_trust_intelligence table
    print("Creating network_trust_intelligence...")
    await conn.execute("""
        CREATE TABLE IF NOT EXISTS network_trust_intelligence (
            id SERIAL PRIMARY KEY,
            company_name VARCHAR(255),
            gstin VARCHAR(50) UNIQUE,
            verdict VARCHAR(20),
            report_text TEXT,
            report_url VARCHAR(500),
            added_by VARCHAR(255),
            added_at TIMESTAMP DEFAULT NOW(),
            source VARCHAR(100) DEFAULT 'BUSINESS_CHECK'
        );
    """)

    print("✅ All SQL commands executed!")
    await conn.close()

asyncio.run(main())
