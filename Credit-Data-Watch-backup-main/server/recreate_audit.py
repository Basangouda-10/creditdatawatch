
import asyncio
from sqlalchemy import text
from app.database import engine

async def recreate_audit_logs():
    async with engine.connect() as conn:
        dburl = str(engine.url)
        is_sqlite = dburl.startswith("sqlite")
        now_func = "CURRENT_TIMESTAMP" if is_sqlite else "NOW()"
        
        print("Dropping audit_logs table...")
        await conn.execute(text("DROP TABLE IF EXISTS audit_logs"))
        
        print("Creating audit_logs table with new schema...")
        await conn.execute(text(f"""
            CREATE TABLE audit_logs (
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
                created_at TIMESTAMP DEFAULT {now_func}
            )
        """))
        
        # Add indexes
        if is_sqlite:
            await conn.execute(text("CREATE INDEX idx_audit_log_action ON audit_logs (action, created_at)"))
            await conn.execute(text("CREATE INDEX idx_audit_log_user_action ON audit_logs (user_id, action)"))
        
        await conn.commit()
        print("Audit logs table recreated successfully.")

if __name__ == "__main__":
    asyncio.run(recreate_audit_logs())
