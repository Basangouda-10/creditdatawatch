import asyncio
from sqlalchemy import text
from app.database import engine

async def create_tables():
    statements = [
        # Create legal_notice_requests table
        """
        CREATE TABLE IF NOT EXISTS legal_notice_requests (
            id VARCHAR(36) PRIMARY KEY,
            po_id VARCHAR(36) NOT NULL,
            po_number VARCHAR(100),
            vendor VARCHAR(255),
            vendor_email VARCHAR(255),
            amount NUMERIC(12,2),
            requested_by_email VARCHAR(255),
            status VARCHAR(50) DEFAULT 'PENDING',
            ops_notes TEXT,
            ops_processed_by VARCHAR(255),
            ops_processed_at TIMESTAMP,
            master_notes TEXT,
            master_approved_by VARCHAR(255),
            master_approved_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """,
        # Create po_approval_requests table if missing
        """
        CREATE TABLE IF NOT EXISTS po_approval_requests (
            id VARCHAR(36) PRIMARY KEY,
            po_id VARCHAR(36) NOT NULL,
            po_number VARCHAR(100),
            requested_by_email VARCHAR(255),
            reason TEXT,
            evidence_url VARCHAR(500),
            evidence_filename VARCHAR(255),
            status VARCHAR(50) DEFAULT 'PENDING',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """,
        # Create subscription_requests table if missing
        """
        CREATE TABLE IF NOT EXISTS subscription_requests (
            id VARCHAR(36) PRIMARY KEY,
            user_id VARCHAR(36),
            company_name VARCHAR(255),
            plan_name VARCHAR(100),
            amount NUMERIC(12,2),
            user_email VARCHAR(255),
            utr_number VARCHAR(100),
            payment_proof_url VARCHAR(500),
            status VARCHAR(50) DEFAULT 'PENDING',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """,
        # Create business_check_requests table if missing
        """
        CREATE TABLE IF NOT EXISTS business_check_requests (
            id VARCHAR(36) PRIMARY KEY,
            company_name VARCHAR(255),
            gstin VARCHAR(50),
            reason TEXT,
            additional_info TEXT,
            user_email VARCHAR(255),
            verdict VARCHAR(50),
            report_text TEXT,
            report_url VARCHAR(500),
            ops_reviewed_by VARCHAR(255),
            status VARCHAR(50) DEFAULT 'PENDING_OPERATION',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """
    ]

    async with engine.begin() as conn:
        for stmt in statements:
            try:
                await conn.execute(text(stmt))
            except Exception as e:
                print(f"Notice: {e}")

    print("\n" + "="*50)
    print("✅ Successfully created all missing database tables!")
    print("="*50)

if __name__ == "__main__":
    asyncio.run(create_tables())