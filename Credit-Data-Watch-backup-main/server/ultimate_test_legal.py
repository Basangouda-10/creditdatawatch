import requests
import asyncio
import asyncpg

async def main():
    # Step 1: Find PO from payalshinde906@gmail.com
    conn = await asyncpg.connect('postgresql://postgres:2004@localhost:5432/creditdatawatch')
    print("=== Step 1: Find payalshinde906@gmail.com's PO ===")
    
    user = await conn.fetchrow("SELECT id, email FROM users WHERE email = 'payalshinde906@gmail.com'")
    print(f"User: {user['email']} (id: {user['id']})")
    
    po = await conn.fetchrow("SELECT id, po_number FROM purchase_orders WHERE user_id = $1 LIMIT 1", user['id'])
    if not po:
        print("❌ No PO found!")
        return
    print(f"Found PO: {po['po_number']} (id: {po['id']})")
    
    await conn.close()
    
    # Step 2: Login as payalshinde906@gmail.com
    print("\n=== Step 2: Login as payalshinde906@gmail.com ===")
    user_login_r = requests.post("http://localhost:8000/api/v1/auth/login", json={
        "email": "payalshinde906@gmail.com",
        "password": "Test@1234",
        "gstin": "22AAAAD0000A1Z5"
    })
    print(f"Login status: {user_login_r.status_code}")
    print(f"Login full response: {user_login_r.text}")
    
    user_login_data = user_login_r.json()
    user_token = user_login_data['data']['tokens']['access_token']
    print(f"Got user token: {user_token[:40]}...")
    
    # Step 3: Send to legal using user's token
    print("\n=== Step 3: Send to Legal (payalshinde906@gmail.com) ===")
    send_legal_r = requests.post(
        f"http://localhost:8000/api/v1/purchase-orders/{po['id']}/send-to-legal",
        headers={"Authorization": f"Bearer {user_token}"}
    )
    print(f"send-to-legal status: {send_legal_r.status_code}")
    print(f"send-to-legal response: {send_legal_r.text}")
    
    # Step 4: Login as legal@test.com
    print("\n=== Step 4: Login as legal@test.com ===")
    legal_login_r = requests.post("http://localhost:8000/api/v1/auth/login", json={
        "email": "legal@test.com",
        "password": "Test@1234",
        "gstin": "22AAAAD0000A1Z5"
    })
    print(f"Legal login status: {legal_login_r.status_code}")
    
    if legal_login_r.status_code == 200:
        legal_login_data = legal_login_r.json()
        legal_token = legal_login_data['data']['tokens']['access_token']
        
        # Step 5: Call my-tasks
        print("\n=== Step 5: Get legal's my-tasks ===")
        my_tasks_r = requests.get("http://localhost:8000/api/v1/workflow/my-tasks",
            headers={"Authorization": f"Bearer {legal_token}"})
        print(f"my-tasks status: {my_tasks_r.status_code}")
        
        if my_tasks_r.status_code == 200:
            my_tasks_data = my_tasks_r.json()
            print(f"\n✅ my-tasks keys: {list(my_tasks_data['data'].keys())}")
            
            legal_reqs = my_tasks_data['data'].get('legal_requests', [])
            print(f"\n✅ LEGAL REQUESTS COUNT: {len(legal_reqs)}")
            
            for i, req in enumerate(legal_reqs):
                print(f"\nRequest {i+1}:")
                for k, v in req.items():
                    print(f"  {k:30} = {v}")
    
    print("\n=== DONE! ===")

asyncio.run(main())