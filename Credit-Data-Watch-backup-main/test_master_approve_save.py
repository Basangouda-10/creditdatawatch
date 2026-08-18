
import requests
import json
import uuid
import asyncio
import os
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy import text

BASE_URL = "http://127.0.0.1:8000/api/v1"

# Load server .env for DATABASE_URL
server_env = os.path.join(os.path.dirname(__file__), 'server', '.env')
load_dotenv(dotenv_path=server_env, override=True)
DATABASE_URL = os.getenv('DATABASE_URL')

async def check_cbi(gstin, name):
    engine = create_async_engine(DATABASE_URL)
    async with AsyncSession(engine) as session:
        result = await session.execute(
            text("SELECT 1 FROM global_credibility_index WHERE company_registration_no = :gstin OR company_name = :name"),
            {"gstin": gstin, "name": name}
        )
        exists = result.fetchone() is not None
        print(f"Test company in CBI: {exists}")
        return exists

async def get_cbi_entry(gstin, name):
    engine = create_async_engine(DATABASE_URL)
    async with AsyncSession(engine) as session:
        result = await session.execute(
            text("SELECT * FROM global_credibility_index WHERE company_registration_no = :gstin OR company_name = :name"),
            {"gstin": gstin, "name": name}
        )
        entry = result.mappings().first()
        print("\nNew CBI entry details:")
        entry_dict = dict(entry)
        entry_dict['id'] = str(entry_dict['id'])
        entry_dict['approved_by_master_admin_id'] = str(entry_dict['approved_by_master_admin_id']) if entry_dict['approved_by_master_admin_id'] else None
        print(json.dumps(entry_dict, indent=2, default=str))

async def get_test_request():
    engine = create_async_engine(DATABASE_URL)
    async with AsyncSession(engine) as session:
        result = await session.execute(text("""
            SELECT id, company_name, gstin, verdict
            FROM business_check_requests
            WHERE status = 'PENDING_MASTER_ADMIN'
            ORDER BY created_at DESC
            LIMIT 1
        """))
        row = result.mappings().first()
        if row:
            return {
                "id": str(row['id']),
                "company_name": row['company_name'],
                "gstin": row['gstin'],
                "verdict": row['verdict']
            }
        return None

def main():
    # Step 1: Log in as Master Admin
    login_payload = {
        "email": "master.test@creditwatch.com",
        "password": "Test@1234",
        "gstin": "22AAAAD0000A1Z5"
    }
    login_response = requests.post(f"{BASE_URL}/auth/login", json=login_payload)
    print("Login response status:", login_response.status_code)
    login_data = login_response.json()
    token = login_data["data"]["user"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Step 2: Get our test request
    test_request = asyncio.run(get_test_request())
    print(f"Test request: {test_request}")
    
    if not test_request:
        print("\nNo pending business requests found!")
        return
    
    # Check if it's in CBI before
    before = asyncio.run(check_cbi(test_request['gstin'], test_request['company_name']))
    if before:
        print("\nSkipping: Company already in CBI")
        return
    
    print("\nProceeding with approval...")
    # Step 3: Approve the request with save_to_network=True
    approve_payload = {
        "save_to_network": True,
        "notes": "Test approval - adding to CBI"
    }
    approve_response = requests.post(
        f"{BASE_URL}/business-check/{test_request['id']}/master-approve",
        json=approve_payload,
        headers=headers
    )
    print(f"Approve response status: {approve_response.status_code}")
    if approve_response.status_code == 200:
        print(f"Approve response: {json.dumps(approve_response.json(), indent=2)}")
    else:
        print(f"Approve response text: {approve_response.text}")
    
    if approve_response.status_code != 200:
        print("\nFAILED: Approval request failed!")
        return
    
    # Step 4: Verify it's now in global_credibility_index
    after = asyncio.run(check_cbi(test_request['gstin'], test_request['company_name']))
    if after:
        print("\nSUCCESS: Company added to Network Trust Intelligence!")
        asyncio.run(get_cbi_entry(test_request['gstin'], test_request['company_name']))
    else:
        print("\nFAILED: Company NOT added to Network Trust Intelligence!")

if __name__ == "__main__":
    main()
