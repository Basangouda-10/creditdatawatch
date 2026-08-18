import asyncio
import asyncpg
import requests

async def main():
    conn = await asyncpg.connect('postgresql://postgres:2004@localhost:5432/creditdatawatch')
    print("=== Step 1: Get a PO ===")
    
    po = await conn.fetchrow("SELECT id, po_number, vendor, amount FROM purchase_orders LIMIT 1")
    if not po:
        print("❌ No POs found!")
        return
    print(f"PO: {po['po_number']} ({po['vendor']}) - ₹{po['amount']}")
    
    print("\n=== Step 2: Mark PO as legal_support_requested ===")
    await conn.execute("""
        UPDATE purchase_orders 
        SET legal_support_requested_at = NOW()
        WHERE id = $1
    """, po['id'])
    print("✅ PO marked!")
    
    await conn.close()
    
    print("\n=== Step 3: Login as legal@test.com ===")
    login_r = requests.post("http://localhost:8000/api/v1/auth/login", json={
        "email": "legal@test.com",
        "password": "Test@1234",
        "gstin": "22AAAAD0000A1Z5"
    })
    print(f"Login status: {login_r.status_code}")
    
    if login_r.status_code == 200:
        login_data = login_r.json()
        token = login_data['data']['tokens']['access_token']
        
        print("\n=== Step 4: Get my-tasks for LEGAL ===")
        my_tasks_r = requests.get(
            "http://localhost:8000/api/v1/workflow/my-tasks",
            headers={"Authorization": f"Bearer {token}"}
        )
        print(f"my-tasks status: {my_tasks_r.status_code}")
        
        if my_tasks_r.status_code == 200:
            my_tasks_data = my_tasks_r.json()
            print(f"\n✅ my-tasks data keys: {list(my_tasks_data['data'].keys())}")
            
            legal_reqs = my_tasks_data['data'].get('legal_requests', [])
            print(f"\n✅ LEGAL REQUESTS COUNT: {len(legal_reqs)}")
            
            for i, req in enumerate(legal_reqs):
                print(f"\nRequest {i+1}:")
                for k, v in req.items():
                    print(f"  {k:30} = {v}")
    
    print("\n=== ALL DONE! ===")

asyncio.run(main())