
import asyncio
import os
import sys
import uuid
import requests
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy import text

BASE_URL = "http://127.0.0.1:8000/api/v1"

# Add server directory to path so we can import app
server_dir = os.path.join(os.path.dirname(__file__), 'server')
sys.path.insert(0, server_dir)

# Load server env
server_env = os.path.join(os.path.dirname(__file__), 'server', '.env')
load_dotenv(dotenv_path=server_env, override=True)
DATABASE_URL = os.getenv('DATABASE_URL')


async def create_test_po_and_request():
    engine = create_async_engine(DATABASE_URL)
    async with AsyncSession(engine) as session:
        # Get a test user (let's use master.test@creditwatch.com)
        user_res = await session.execute(
            text("SELECT id, email, company_id, company_name FROM users WHERE email = :email"),
            {"email": "master.test@creditwatch.com"}
        )
        user = user_res.fetchone()
        if not user:
            print("Test user not found!")
            return None, None

        user_id, user_email, company_id, company_name = user
        print(f"Test user: {user_email}")

        # Fetch an existing PO instead of creating a new one
        po_res = await session.execute(
            text("SELECT id, po_number FROM purchase_orders LIMIT 1")
        )
        po = po_res.fetchone()
        if not po:
            print("No existing PO found!")
            return None, None
        po_id, po_number = po
        print(f"Using existing PO: {po_number} (id: {po_id})")

        # Now start the PO approval workflow
        from app.services.workflow_service import WorkflowService
        req_id = await WorkflowService.start_po_approval(
            session,
            po_id=po_id,
            po_number=po_number,
            requester_email=user_email,
            edit_data={"vendor": "Updated Test Vendor Inc", "amount": 7500.00},
            evidence_url="https://example.com/evidence.pdf",
            evidence_filename="evidence.pdf",
            reason="Vendor updated and price adjusted"
        )
        await session.commit()

        print(f"Created PO approval request: {req_id}")

        # Get the workflow item ID
        wf_res = await session.execute(
            text("SELECT id FROM workflow_items WHERE entity_id = :req_id AND type = 'PO_APPROVAL'"),
            {"req_id": req_id}
        )
        wf_row = wf_res.fetchone()
        wf_id = wf_row[0] if wf_row else None
        print(f"Workflow item ID: {wf_id}")

        return po_id, wf_id


async def check_db():
    engine = create_async_engine(DATABASE_URL)
    async with AsyncSession(engine) as session:
        # Check PO approval requests
        req_res = await session.execute(text("SELECT * FROM po_approval_requests ORDER BY created_at DESC LIMIT 5"))
        reqs = req_res.mappings().all()
        print("\nPO Approval Requests:")
        for req in reqs:
            print(f"  {req['po_number']} - {req['final_status']} - {req['reason']}")
        
        # Check workflow items for PO_APPROVAL
        wf_res = await session.execute(text("SELECT * FROM workflow_items WHERE type = 'PO_APPROVAL' ORDER BY created_at DESC LIMIT 5"))
        wfs = wf_res.mappings().all()
        print("\nPO Workflow Items:")
        for wf in wfs:
            print(f"  {wf['title']} - {wf['status']} - {wf['current_handler_role']}")


def main():
    print("=" * 80)
    print("TESTING PO EDIT WORKFLOW END-TO-END")
    print("=" * 80)

    # Step 1: Check initial DB state
    print("\n[STEP 1] Initial DB State")
    asyncio.run(check_db())

    # Step 2: Create test PO and PO approval request
    print("\n[STEP 2] Creating Test PO and Approval Request")
    po_id, wf_id = asyncio.run(create_test_po_and_request())
    if not wf_id:
        print("Failed to create test PO or request!")
        return

    # Step 3: Check DB after request creation
    print("\n[STEP 3] DB After Request Creation")
    asyncio.run(check_db())

    # Step 4: Log in as test user to get token
    print("\n[STEP 4] Logging in as test user")
    login_payload = {
        "email": "master.test@creditwatch.com",
        "password": "Test@1234",
        "gstin": "22AAAAD0000A1Z5"
    }
    login_res = requests.post(f"{BASE_URL}/auth/login", json=login_payload)
    if login_res.status_code != 200:
        print(f"Login failed! Status: {login_res.status_code}, Response: {login_res.text}")
        return

    login_data = login_res.json()
    token = login_data["data"]["user"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print(f"Login successful! Token: {token[:50]}...")

    # Step 5: Operations approves (calls /po/{wf_id}/operations-approve)
    print(f"\n[STEP 5] Operations Approving Workflow Item: {wf_id}")
    approve_ops_payload = {"notes": "Verified by Operations"}
    approve_ops_res = requests.post(
        f"{BASE_URL}/workflow/po/{wf_id}/operations-approve",
        json=approve_ops_payload,
        headers=headers
    )
    print(f"Operations Approve Status: {approve_ops_res.status_code}")
    print(f"Response: {approve_ops_res.text}")

    # Step 6: Check DB after operations approval
    print("\n[STEP 6] DB After Operations Approval")
    asyncio.run(check_db())

    # Step 7: Get Master Admin's tasks
    print("\n[STEP 7] Fetching Master Admin's Tasks")
    my_tasks_res = requests.get(f"{BASE_URL}/workflow/my-tasks", headers=headers)
    print(f"Tasks Status: {my_tasks_res.status_code}")
    tasks_data = my_tasks_res.json()
    pending_po_approvals = tasks_data.get("data", {}).get("pending_po_approvals", [])
    print(f"Pending PO Approvals for Master Admin: {len(pending_po_approvals)}")
    for po_approval in pending_po_approvals:
        print(f"  - {po_approval['title']} (status: {po_approval['status']})")

    # Step 8: Master Admin approves
    print(f"\n[STEP 8] Master Admin Approving Workflow Item: {wf_id}")
    approve_master_payload = {"notes": "Final approval by Master Admin"}
    approve_master_res = requests.post(
        f"{BASE_URL}/workflow/po/{wf_id}/master-approve",
        json=approve_master_payload,
        headers=headers
    )
    print(f"Master Approve Status: {approve_master_res.status_code}")
    print(f"Response: {approve_master_res.text}")

    # Step 9: Check final DB state
    print("\n[STEP 9] Final DB State")
    asyncio.run(check_db())

    # Step 10: Check the PO's new vendor and amount
    print("\n[STEP 10] Checking Updated PO")
    engine = create_async_engine(DATABASE_URL)

    async def check_po():
        async with AsyncSession(engine) as session:
            po_res = await session.execute(text("SELECT vendor, amount FROM purchase_orders WHERE id = :id"), {"id": po_id})
            po_row = po_res.fetchone()
            if po_row:
                vendor, amount = po_row
                print(f"PO {po_id} updated to: Vendor = {vendor}, Amount = {amount}")

    asyncio.run(check_po())


if __name__ == "__main__":
    main()

