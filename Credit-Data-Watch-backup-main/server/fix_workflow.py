import asyncio
from app.database import AsyncSessionLocal
from sqlalchemy import text

async def fix():
    async with AsyncSessionLocal() as db:
        async with db.begin():
            cols = [
                "ALTER TABLE workflow_items ADD COLUMN IF NOT EXISTS approved_by_email VARCHAR(255)",
                "ALTER TABLE workflow_items ADD COLUMN IF NOT EXISTS approval_notes TEXT",
                "ALTER TABLE workflow_items ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP",
                "ALTER TABLE workflow_items ADD COLUMN IF NOT EXISTS rejected_by_email VARCHAR(255)",
                "ALTER TABLE workflow_items ADD COLUMN IF NOT EXISTS rejection_notes TEXT",
                "ALTER TABLE workflow_items ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP",
                "ALTER TABLE workflow_items ADD COLUMN IF NOT EXISTS reviewed_by_email VARCHAR(255)",
                "ALTER TABLE workflow_items ADD COLUMN IF NOT EXISTS review_notes TEXT",
                "ALTER TABLE workflow_items ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP",
                "ALTER TABLE workflow_items ADD COLUMN IF NOT EXISTS submitted_by_name VARCHAR(255)",
                "ALTER TABLE workflow_items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP",
                "ALTER TABLE subscription_requests ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'PENDING'",
                "ALTER TABLE subscription_requests ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(50) DEFAULT 'PENDING'",
                "ALTER TABLE subscription_requests ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP",
                "ALTER TABLE subscription_requests ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP",
                "ALTER TABLE subscription_requests ADD COLUMN IF NOT EXISTS rejection_reason TEXT",
            ]
            for col in cols:
                try:
                    await db.execute(text(col))
                    print(f"✅ {col[:60]}...")
                except Exception as e:
                    print(f"⚠️  Skipped: {e}")
        print("\n✅ All done! Restart your backend server.")

asyncio.run(fix())