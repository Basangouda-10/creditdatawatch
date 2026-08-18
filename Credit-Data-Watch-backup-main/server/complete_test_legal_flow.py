import requests
import asyncio
import asyncpg

async def main():
    # Step 1: Create a test PO (or use existing) and mark legal_support_requested_at
    conn = await asyncpg.connect('postgresql://postgres:2004@localhost:5432/creditdatawatch')
    print("=== Step 1: Connect to DB ===")
    
    # Find a test PO
    po = await conn.fetchrow("SELECT id, po_number, vendor FROM purchase_orders LIMIT 1")
    if not po:
        print("❌ No POs found!")
        return
    
    print(f"✅ Found PO: {po['po_number']}")
    
    # Mark it as legal_support_requested_at set
    await conn.execute("""
        UPDATE purchase_orders 
        SET legal_support_requested_at = NOW()
        WHERE id = $1
    """, po['id'])
    print(f"✅ Marked PO {po['id']} with legal_support_requested_at")
    
    await conn.close()
    
    # Step 2: Login as USER to simulate clicking Send to Legal
    print("\n=== Step 2: Login as USER ===")
    user_login_r = requests.post("http://localhost:8000/api/v1/auth/login", json={
        "email": "user@test.com",
        "password": "Test@1234",
        "gstin": "22AAAAD0000A1Z5"
    })
    print(f"User login status: {user_login_r.status_code}")
    
    # Step 3: Login as LEGAL and check my-tasks
    print("\n=== Step 3: Login as LEGAL and check my-tasks ===")
    legal_login_r = requests.post("http://localhost:8000/api/v1/auth/login", json={
        "email": "legal@test.com",
        "password": "Test@1234",
        "gstin": "22AAAAD0000A1Z5"
    })
    print(f"Legal login status: {legal_login_r.status_code}")
    
    if legal_login_r.status_code == 200:
        legal_login_data = legal_login_r.json()
        token = legal_login_data['data']['tokens']['access_token']
        
        # Call my-tasks
        my_tasks_r = requests.get("http://localhost:8000/api/v1/workflow/my-tasks",
            headers={"Authorization": f"Bearer {token}"})
        print(f"\nmy-tasks status: {my_tasks_r.status_code}")
        
        if my_tasks_r.status_code == 200:
            my_tasks_data = my_tasks_r.json()
            print(f"\n✅ my-tasks response keys: {list(my_tasks_data['data'].keys())}")
            
            legal_reqs = my_tasks_data['data'].get('legal_requests', [])
            print(f"\n✅ LEGAL REQUESTS COUNT: {len(legal_reqs)}")
            
            for i, req in enumerate(legal_reqs):
                print(f"\nRequest {i+1}:")
                for k, v in req.items():
                    print(f"  {k:30} = {v}")
    
    print("\n=== DONE! ===")

asyncio.run(main())