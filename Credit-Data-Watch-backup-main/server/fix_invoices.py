import asyncio
from sqlalchemy import text
from app.database import engine

async def fix_invoices_table():
    async with engine.begin() as conn:
        print("Applying database migration to 'invoices' table...")
        
        # Add customer_email
        try:
            await conn.execute(text("ALTER TABLE invoices ADD COLUMN customer_email VARCHAR(255);"))
            print("✅ Successfully added 'customer_email' column")
        except Exception as e:
            print("⚠️ 'customer_email' skipped or already exists:", str(e).split('\n')[0])
        
        # Add customer_mobile
        try:
            await conn.execute(text("ALTER TABLE invoices ADD COLUMN customer_mobile VARCHAR(50);"))
            print("✅ Successfully added 'customer_mobile' column")
        except Exception as e:
            print("⚠️ 'customer_mobile' skipped or already exists:", str(e).split('\n')[0])

if __name__ == "__main__":
    print("Starting migration...")
    asyncio.run(fix_invoices_table())
    print("Migration complete!")