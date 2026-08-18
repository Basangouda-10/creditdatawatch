import asyncio
import asyncpg
import requests

async def main():
    conn = await asyncpg.connect('postgresql://postgres:2004@localhost:5432/creditdatawatch')
    print("=== DB CONNECTED ===")
    
    # Get a PO
    pos = await conn.fetch("SELECT id, po_number, vendor, amount FROM purchase_orders LIMIT 1")
    if not pos:
        print("❌ No POs found!")
        return
    
    po = pos[0]
    print(f"\n✅ Found PO: {po['po_number']} ({po['vendor']})")
    
    # Update this PO to have legal_support_requested_at
    await conn.execute("""
        UPDATE purchase_orders 
        SET legal_support_requested_at = NOW()
        WHERE id = $1
    """, po['id'])
    print(f"\n✅ Set legal_support_requested_at for PO {po['id']}")
    
    # Now login as LEGAL and call my-tasks
    print("\n=== Testing LEGAL login & my-tasks ===")
    
    # Login as legal@test.com
    login_r = requests.post("http://localhost:8000/api/v1/auth/login", json={
        "email": "legal@test.com",
        "password": "Test@1234",
        "gstin": "22AAAAD0000A1Z5"
    })
    print(f"Login status: {login_r.status_code}")
    
    if login_r.status_code == 200:
        login_data = login_r.json()
        token = login_data.get('data', {}).get('access_token')
        print(f"Got token: {token[:40]}...")
        
        # Call my-tasks
        my_tasks_r = requests.get("http://localhost:8000/api/v1/workflow/my-tasks", 
            headers={"Authorization": f"Bearer {token}"})
        print(f"\nmy-tasks status: {my_tasks_r.status_code}")
        
        if my_tasks_r.status_code == 200:
            my_tasks_data = my_tasks_r.json()
            print(f"\n✅ my-tasks response:")
            print(f"  Role: {my_tasks_data['data']['role']}")
            legal_reqs = my_tasks_data['data'].get('legal_requests', [])
            print(f"  Legal requests count: {len(legal_reqs)}")
            if len(legal_reqs) > 0:
                print(f"  First request: {legal_reqs[0]}")
    
    await conn.close()
    print("\n✅ DONE!")

asyncio.run(main())