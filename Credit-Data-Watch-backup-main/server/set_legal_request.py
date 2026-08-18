import asyncio
import asyncpg

async def main():
    conn = await asyncpg.connect('postgresql://postgres:2004@localhost:5432/creditdatawatch')
    print("=== CONNECTED TO DB ===")
    
    # Get first PO
    po = await conn.fetchrow("SELECT id, po_number, vendor FROM purchase_orders LIMIT 1")
    if not po:
        print("❌ No POs found!")
        return
    
    print(f"✅ Found PO: {po['po_number']} ({po['vendor']})")
    print(f"   Current legal_support_requested_at: {po.get('legal_support_requested_at')}")
    
    # Update PO
    await conn.execute("""
        UPDATE purchase_orders 
        SET legal_support_requested_at = NOW()
        WHERE id = $1
    """, po['id'])
    print(f"\n✅ Updated PO {po['id']} to have legal_support_requested_at = NOW()")
    
    # Verify
    updated_po = await conn.fetchrow("SELECT id, po_number, legal_support_requested_at FROM purchase_orders WHERE id = $1", po['id'])
    print(f"\n✅ Verified: legal_support_requested_at = {updated_po['legal_support_requested_at']}")
    
    await conn.close()
    print("\n=== DONE! ===")

asyncio.run(main())