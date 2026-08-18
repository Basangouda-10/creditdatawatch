
import requests
import asyncio
import os
import uuid
import sys
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy import text

# Add server directory to path so we can import app
server_dir = os.path.join(os.path.dirname(__file__), 'server')
sys.path.insert(0, server_dir)

BASE_URL = "http://127.0.0.1:8000/api/v1"

# Load server env for DB access
server_env = os.path.join(os.path.dirname(__file__), 'server', '.env')
load_dotenv(dotenv_path=server_env, override=True)
DATABASE_URL = os.getenv('DATABASE_URL')

async def create_test_subscription_request():
    engine = create_async_engine(DATABASE_URL)
    async with AsyncSession(engine) as session:
        # Get a test user
        user_result = await session.execute(text("SELECT id, email, company_name FROM users WHERE email = 'master.test@creditwatch.com'"))
        user = user_result.fetchone()
        if not user:
            print("Test user not found")
            return None
        
        user_id, user_email, company_name = user
        plan_name = "Premium Plan"
        amount = 999
        
        from app.services.workflow_service import WorkflowService
        sub_id = await WorkflowService.start_subscription(
            session,
            user_id=str(user_id),
            user_email=user_email,
            company_name=company_name or "Test Company",
            plan_name=plan_name,
            amount=amount
        )
        await session.commit()
        print(f"Created subscription request: {sub_id}")
        
        # Get the workflow item id
        wf_result = await session.execute(text("SELECT id FROM workflow_items WHERE entity_id = :eid AND type = 'SUBSCRIPTION'"), {"eid": sub_id})
        wf_row = wf_result.fetchone()
        if wf_row:
            return wf_row[0]
        return None

async def check_db():
    engine = create_async_engine(DATABASE_URL)
    async with AsyncSession(engine) as session:
        # Check subscription requests
        req_result = await session.execute(text("SELECT * FROM subscription_requests ORDER BY created_at DESC LIMIT 10"))
        reqs = req_result.mappings().all()
        print(f"Subscription requests: {len(reqs)}")
        for req in reqs:
            print(f"  {req.get('company_name')} - {req.get('plan_name')} - {req.get('workflow_status')}")
        
        # Check workflow items
        wf_result = await session.execute(text("SELECT * FROM workflow_items WHERE type = 'SUBSCRIPTION' ORDER BY created_at DESC LIMIT 10"))
        wfs = wf_result.mappings().all()
        print(f"\nSubscription workflow items: {len(wfs)}")
        for wf in wfs:
            print(f"  {wf.get('title')} - {wf.get('status')} - {wf.get('current_handler_role')}")

def main():
    print("=== Step 1: Initial DB state ===")
    asyncio.run(check_db())
    
    print("\n=== Step 2: Create test subscription request ===")
    wf_id = asyncio.run(create_test_subscription_request())
    if not wf_id:
        print("Failed to create subscription request")
        return
    
    print(f"Created workflow ID: {wf_id}")
    
    print("\n=== Step 3: DB after creating request ===")
    asyncio.run(check_db())
    
    print("\n=== Step 4: Log in as Operations (since financial is probably disabled) ===")
    login_payload = {"email": "master.test@creditwatch.com", "password": "Test@1234", "gstin": "22AAAAD0000A1Z5"}
    login_res = requests.post(f"{BASE_URL}/auth/login", json=login_payload)
    login_data = login_res.json()
    token = login_data["data"]["user"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    print("\n=== Step 5: Operations approves (calls /subscription/{wf_id}/operations-approve) ===")
    approve_res = requests.post(
        f"{BASE_URL}/workflow/subscription/{wf_id}/operations-approve",
        json={"notes": "Test approval"},
        headers=headers
    )
    print(f"Operations approve status: {approve_res.status_code}")
    print(f"Response: {approve_res.text}")
    
    print("\n=== Step 6: DB after Operations approval ===")
    asyncio.run(check_db())
    
    print("\n=== Step 7: Log in as Master Admin ===")
    master_login_res = requests.post(f"{BASE_URL}/auth/login", json=login_payload)
    master_data = master_login_res.json()
    master_token = master_data["data"]["user"]["access_token"]
    master_headers = {"Authorization": f"Bearer {master_token}"}
    
    print("\n=== Step 8: Master Admin's my-tasks ===")
    my_tasks_res = requests.get(f"{BASE_URL}/workflow/my-tasks", headers=master_headers)
    tasks_data = my_tasks_res.json()["data"]
    print(f"Pending subscriptions for master: {len(tasks_data.get('pending_subscriptions', []))}")
    
    print("\n=== Step 9: Master Admin approves ===")
    master_approve_res = requests.post(
        f"{BASE_URL}/workflow/subscription/{wf_id}/master-approve",
        json={"notes": "Final approval"},
        headers=master_headers
    )
    print(f"Master approve status: {master_approve_res.status_code}")
    print(f"Response: {master_approve_res.text}")
    
    print("\n=== Step 10: Final DB state ===")
    asyncio.run(check_db())
    
    print("\n=== Test complete ===")

if __name__ == "__main__":
    main()
