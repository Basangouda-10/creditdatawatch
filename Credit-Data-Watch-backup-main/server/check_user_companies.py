import asyncio
import asyncpg

async def main():
    conn = await asyncpg.connect('postgresql://postgres:2004@localhost:5432/creditdatawatch')
    print("=== CHECK USERS' COMPANIES ===")
    
    users = await conn.fetch("SELECT id, email, role, company_id, company_name FROM users")
    for u in users:
        print(f"{u['email']:30} | role: {u['role']:20} | company: {u['company_name']} (id: {u['company_id']})")
    
    print("\n=== CHECK POs ===")
    pos = await conn.fetch("SELECT id, po_number, user_id FROM purchase_orders")
    for po in pos:
        print(f"PO {po['po_number']} | user_id: {po['user_id']}")
    
    await conn.close()

asyncio.run(main())