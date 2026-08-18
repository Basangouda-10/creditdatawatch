
import asyncio
import os
import sys
import uuid
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy import text

# Add server directory to path
server_dir = os.path.join(os.path.dirname(__file__), 'server')
sys.path.insert(0, server_dir)

# Import app settings directly
from app.config import settings
DATABASE_URL = settings.DATABASE_URL

async def test_legal_notice_workflow():
    print("=== TESTING LEGAL NOTICE WORKFLOW END-TO-END ===")
    
    engine = create_async_engine(DATABASE_URL)
    async with AsyncSession(engine) as session:
        # 1. Get test user and PO
        print("\n1. Getting test user and PO...")
        user_result = await session.execute(text("SELECT id, email, company_id FROM users WHERE email = 'master.test@creditwatch.com'"))
        user = user_result.fetchone()
        if not user:
            print("ERROR: Test user not found!")
            return
        
        user_id, user_email, company_id = user
        print(f"   Test user: {user_email} (id: {user_id})")
        
        po_result = await session.execute(text("SELECT id, po_number, vendor, amount FROM purchase_orders LIMIT 1"))
        po = po_result.fetchone()
        if not po:
            print("ERROR: No PO found!")
            return
        
        po_id, po_number, vendor, amount = po
        print(f"   Using PO: {po_number} (id: {po_id})")
        
        # 2. Get workflow service functions
        from app.services.workflow_service import WorkflowService
        
        # 3. Start the legal notice workflow
        print("\n2. Starting legal notice workflow...")
        await WorkflowService.process_legal_notice_workflow(
            db=session,
            admin_email=user_email,
            po_id=po_id,
            po_number=po_number,
            vendor=vendor,
            reason="Testing the legal notice workflow",
            evidence_url="https://example.com/evidence.pdf",
            evidence_filename="evidence.pdf"
        )
        await session.commit()
        
        # Get the workflow item id
        wf_result = await session.execute(text("SELECT id FROM workflow_items WHERE entity_id = :po_id AND type = 'LEGAL_NOTICE' ORDER BY created_at DESC LIMIT 1"), {"po_id": po_id})
        wf = wf_result.fetchone()
        if not wf:
            print("ERROR: No workflow item created!")
            return
        
        wf_id = wf[0]
        print(f"   Workflow item created: {wf_id}")
        
        # 4. Check if Operations or Legal can see it (via DB)
        print("\n3. Checking workflow item status and role...")
        wf_detail_result = await session.execute(text("SELECT status, assigned_to_role FROM workflow_items WHERE id = :id"), {"id": wf_id})
        wf_detail = wf_detail_result.fetchone()
        print(f"   Initial status: {wf_detail[0]}, assigned to: {wf_detail[1]}")
        
        # 5. Process as Operations or Legal
        print("\n4. Processing as assigned role...")
        # Import is_legal_enabled from workflow.py
        sys.path.insert(0, server_dir)
        from app.routes.workflow import is_legal_enabled
        legal_enabled = await is_legal_enabled(session)
        if legal_enabled:
            print("   Legal is enabled — using legal_review_complete...")
            await WorkflowService.legal_review_complete(session, wf_id, user_email, "Approved by Legal team")
        else:
            print("   Legal is disabled — using ops_process_legal_notice...")
            await WorkflowService.ops_process_legal_notice(session, wf_id, user_email, "Approved by Operations team")
        await session.commit()
        
        # Check updated status
        wf_detail2_result = await session.execute(text("SELECT status, current_handler_role FROM workflow_items WHERE id = :id"), {"id": wf_id})
        wf_detail2 = wf_detail2_result.fetchone()
        print(f"   Status after processing: {wf_detail2[0]}, current handler: {wf_detail2[1]}")
        
        # 6. Master Admin approves
        print("\n5. Master Admin approving...")
        await WorkflowService.master_approve_legal_notice(session, wf_id, user_email, "Final approval granted")
        await session.commit()
        
        # Check final status
        wf_detail3_result = await session.execute(text("SELECT status FROM workflow_items WHERE id = :id"), {"id": wf_id})
        wf_detail3 = wf_detail3_result.fetchone()
        print(f"   Final status: {wf_detail3[0]}")
        
        print("\n=== WORKFLOW TEST COMPLETED SUCCESSFULLY ===")
        
if __name__ == "__main__":
    asyncio.run(test_legal_notice_workflow())

