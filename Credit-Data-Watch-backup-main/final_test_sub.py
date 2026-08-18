import asyncio
import asyncpg
import requests
import json
import uuid
import sys
import os

BASE_URL = 'http://localhost:8000/api/v1'
TEST_USER = {'email': 'user@test.com', 'password': 'TestPass123!', 'gstin': '22AAAAD0000A1Z5'}
OPS_USER = {'email': 'ops@test.com', 'password': 'TestPass123!', 'gstin': '22AAAAD0000A1Z5'}
MASTER_USER = {'email': 'payalshinde906@gmail.com', 'password': 'AdminPass123!', 'gstin': '22AAAAD0000A1Z5'}

def get_token(creds):
    print(f"Logging in as {creds['email']}...")
    r = requests.post(f"{BASE_URL}/auth/login", json=creds)
    if r.status_code == 200:
        data = r.json()
        return data['data']['tokens']['access_token']
    print(f"❌ Login failed for {creds['email']}: {r.status_code} - {r.text}")
    raise Exception(f"Login failed for {creds['email']}")

async def run_subscription_test():
    print("\n--- TEST 1: SUBSCRIPTION WORKFLOW ---")
    
    conn = await asyncpg.connect('postgresql://postgres:2004@localhost:5432/creditdatawatch')
    
    try:
        # 1. User requesting subscription
        print("1. Mocking subscription request in DB...")
        user_row = await conn.fetchrow("SELECT id, company_id FROM users WHERE email = $1", TEST_USER['email'])
        user_id = user_row['id']
        company_id = user_row['company_id']
        
        company_name = await conn.fetchval("SELECT company_name FROM companies WHERE id = $1", company_id) or "Test Company"
        
        plan = await conn.fetchrow("SELECT id, display_name, price FROM plans WHERE is_active = true LIMIT 1")
        if not plan:
            plan_id = str(uuid.uuid4())
            await conn.execute("INSERT INTO plans (id, name, display_name, price, duration_type, is_active) VALUES ($1, $2, $3, $4, $5, $6)", 
                              plan_id, 'pro', 'Pro Plan', 1000.0, 'monthly', True)
            plan = {'id': plan_id, 'display_name': 'Pro Plan', 'price': 1000.0}
        
        sub_id = str(uuid.uuid4())
        wf_id = str(uuid.uuid4())
        
        await conn.execute("""
            INSERT INTO subscription_requests (id, user_id, user_email, company_name, plan_name, amount, workflow_item_id, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        """, sub_id, user_id, TEST_USER['email'], company_name, plan['display_name'], plan['price'], wf_id)
        
        await conn.execute("""
            INSERT INTO workflow_items (id, type, status, title, description, entity_id, entity_type, submitted_by_email, assigned_to_role, current_handler_role, created_at)
            VALUES ($1, 'SUBSCRIPTION', 'PENDING', $2, $3, $4, 'subscription_request', $5, 'OPERATIONS', 'OPERATIONS', NOW())
        """, wf_id, f"Subscription Request — {company_name}", f"{company_name} wants {plan['display_name']} plan", sub_id, TEST_USER['email'])
        
        print(f"✅ Subscription workflow item created: {wf_id}")
        
        # 2. Operations Approves
        print("2. Operations approving for Master...")
        ops_token = get_token(OPS_USER)
        res = requests.post(f"{BASE_URL}/workflow/subscription/{wf_id}/operations-approve", 
                           headers={'Authorization': f'Bearer {ops_token}'}, 
                           json={'notes': 'Approved by Ops'})
        if res.status_code == 200:
            print(f"✅ Operations approved: {res.json().get('message')}")
        else:
            print(f"❌ Operations approval failed: {res.status_code} - {res.text}")
            return

        # 3. Master Admin Final Approves
        print("3. Master Admin final approving...")
        master_token = get_token(MASTER_USER)
        res = requests.post(f"{BASE_URL}/workflow/subscription/{wf_id}/master-approve", 
                           headers={'Authorization': f'Bearer {master_token}'}, 
                           json={'notes': 'Final approval by Master Admin'})
        if res.status_code == 200:
            print(f"✅ Master Admin approved: {res.json().get('message')}")
        else:
            print(f"❌ Master Admin approval failed: {res.status_code} - {res.text}")
            return
        
        # 4. Verify user is active
        status = await conn.fetchval("SELECT subscription_status FROM users WHERE email = $1", TEST_USER['email'])
        print(f"4. Final User subscription status: {status}")
        if status == 'ACTIVE':
            print("✅ TEST 1 PASSED: Subscription Workflow E2E Successful")
        else:
            print(f"❌ TEST 1 FAILED: Status is {status}")

    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(run_subscription_test())
