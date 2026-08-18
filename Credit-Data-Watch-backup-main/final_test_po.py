import asyncio
import asyncpg
import requests
import json
import uuid
import sys
import os

BASE_URL = 'http://localhost:8000/api/v1'
FIN_USER = {'email': 'fin@test.com', 'password': 'TestPass123!', 'gstin': '22AAAAD0000A1Z5'}
MASTER_USER = {'email': 'payalshinde906@gmail.com', 'password': 'AdminPass123!', 'gstin': '22AAAAD0000A1Z5'}

def get_token(creds):
    print(f"Logging in as {creds['email']}...")
    r = requests.post(f"{BASE_URL}/auth/login", json=creds)
    if r.status_code == 200:
        data = r.json()
        return data['data']['tokens']['access_token']
    print(f"❌ Login failed for {creds['email']}: {r.status_code} - {r.text}")
    raise Exception(f"Login failed for {creds['email']}")

async def run_po_test():
    print("\n--- TEST 2: PO EDIT WORKFLOW ---")
    
    conn = await asyncpg.connect('postgresql://postgres:2004@localhost:5432/creditdatawatch')
    
    try:
        # 1. Ensure a PO exists
        admin_row = await conn.fetchrow("SELECT id, company_id FROM users WHERE email = $1", MASTER_USER['email'])
        admin_id = admin_row['id']
        company_id = admin_row['company_id']

        po_id = str(uuid.uuid4())
        po_number = f"TEST-PO-{uuid.uuid4().hex[:6].upper()}"
        await conn.execute("""
            INSERT INTO purchase_orders (id, po_number, vendor, amount, gstin, status, company_id, user_id, due_date, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        """, po_id, po_number, 'Initial Vendor', 5000.0, '22AAAAD0000A1Z5', 'open', company_id, admin_id)
        
        print(f"1. Created fresh PO: {po_number} (ID: {po_id})")
        
        # 2. Mock Admin submitting PO edit for approval
        req_id = str(uuid.uuid4())
        wf_id = str(uuid.uuid4())
        edit_data = {'vendor': 'Updated Vendor Name'}
        
        await conn.execute("""
            INSERT INTO po_approval_requests (id, po_id, po_number, requested_by_email, edit_data, evidence_url, evidence_filename, reason, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
        """, req_id, po_id, po_number, MASTER_USER['email'], json.dumps(edit_data), 'http://example.com/evidence.pdf', 'evidence.pdf', 'Correcting vendor name')
        
        await conn.execute("""
            INSERT INTO workflow_items (id, type, status, title, description, entity_id, entity_type, submitted_by_email, assigned_to_role, current_handler_role, created_at)
            VALUES ($1, 'PO_APPROVAL', 'PENDING_FINANCIAL', $2, $3, $4, 'po_approval_request', $5, 'FINANCIAL', 'FINANCIAL', NOW())
        """, wf_id, f"PO Edit Approval — {po_number}", f"{po_number} edited with evidence", req_id, MASTER_USER['email'])
        
        print(f"✅ PO edit workflow item created: {wf_id}")
        
        # 3. Financial Approves
        print("2. Financial approving for Master...")
        fin_token = get_token(FIN_USER)
        res = requests.post(f"{BASE_URL}/workflow/po/{wf_id}/financial-approve", 
                           headers={'Authorization': f'Bearer {fin_token}'}, 
                           json={'notes': 'Evidence verified'})
        if res.status_code == 200:
            print(f"✅ Financial approved: {res.json().get('message')}")
        else:
            print(f"❌ Financial approval failed: {res.status_code} - {res.text}")
            return

        # 4. Master Admin Final Approves
        print("3. Master Admin final approving...")
        master_token = get_token(MASTER_USER)
        res = requests.post(f"{BASE_URL}/workflow/po/{wf_id}/master-approve", 
                           headers={'Authorization': f'Bearer {master_token}'}, 
                           json={'notes': 'Final approval by Master Admin'})
        if res.status_code == 200:
            print(f"✅ Master Admin approved: {res.json().get('message')}")
        else:
            print(f"❌ Master Admin approval failed: {res.status_code} - {res.text}")
            return
        
        # 5. Verify vendor name updated
        new_vendor = await conn.fetchval("SELECT vendor FROM purchase_orders WHERE id = $1", po_id)
        print(f"4. Updated Vendor Name in DB: {new_vendor}")
        if new_vendor == 'Updated Vendor Name':
            print("✅ TEST 2 PASSED: PO Edit Workflow E2E Successful")
        else:
            print(f"❌ TEST 2 FAILED: Vendor name is {new_vendor}")

    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(run_po_test())
