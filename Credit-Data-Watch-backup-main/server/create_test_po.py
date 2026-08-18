import asyncio
from sqlalchemy import text
from app.database import engine

async def insert_po():
    async with engine.begin() as conn:
        # Get tcs user details
        res = await conn.execute(text("SELECT id, company_id, email FROM users WHERE email = 'basangoudahadimani2000@gmail.com';"))
        user = res.mappings().first()
        
        if not user:
            print("❌ User 'basangoudahadimani2000@gmail.com' not found!")
            return

        user_id = user['id']
        company_id = user['company_id'] or user_id

        # Insert test Purchase Order
        await conn.execute(text("""
            INSERT INTO purchase_orders (
                id, company_id, user_id, po_number, vendor, vendor_name, 
                vendor_gstin, vendor_email, vendor_mobile, amount, 
                due_date, status, created_at, updated_at
            ) VALUES (
                gen_random_uuid(), :cid, :uid, 'PO-2026-01', 'accenture', 'accenture',
                '22AAAAD0000A1Z7', 'vendor@test.com', '9876543210', 50000.00,
                NOW() + INTERVAL '45 days', 'OPEN', NOW(), NOW()
            );
        """), {"cid": company_id, "uid": user_id})

    print("\n" + "="*50)
    print("✅ Successfully created PO-2026-01 in the database!")
    print("="*50)

if __name__ == "__main__":
    asyncio.run(insert_po())