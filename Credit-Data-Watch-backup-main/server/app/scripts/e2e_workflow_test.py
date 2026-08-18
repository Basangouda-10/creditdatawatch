import asyncio
from datetime import datetime
from datetime import timezone, timedelta, timezone
from uuid import uuid4
from sqlalchemy import select, text
import os, sys

# Setup paths
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
SERVER_ROOT = os.path.dirname(os.path.dirname(CURRENT_DIR))
if SERVER_ROOT not in sys.path:
    sys.path.insert(0, SERVER_ROOT)

from app.database import AsyncSessionLocal, engine, Base
from app.models import Company, User, UserRole, PurchaseOrder, Subscription, Plan
from app.services.workflow_service import WorkflowService
from app.services.notification_service import NotificationService

async def setup_db(session):
    # Instead of relying on create_all, we manually ensure the workflow tables exist for SQLite
    # This matches the logic in main.py
    await session.execute(text("""
        CREATE TABLE IF NOT EXISTS workflow_items (
            id VARCHAR(36) PRIMARY KEY,
            type VARCHAR(50) NOT NULL,
            status VARCHAR(50) DEFAULT 'PENDING',
            title VARCHAR(255),
            description TEXT,
            entity_id VARCHAR(36),
            entity_type VARCHAR(50),
            submitted_by_id VARCHAR(36),
            submitted_by_email VARCHAR(255),
            submitted_by_name VARCHAR(255),
            assigned_to_role VARCHAR(50),
            current_handler_role VARCHAR(50),
            reviewed_by_id VARCHAR(36),
            reviewed_by_email VARCHAR(255),
            review_notes TEXT,
            reviewed_at TIMESTAMP,
            approved_by_id VARCHAR(36),
            approved_by_email VARCHAR(255),
            approval_notes TEXT,
            approved_at TIMESTAMP,
            rejected_by_id VARCHAR(36),
            rejected_by_email VARCHAR(255),
            rejection_notes TEXT,
            rejected_at TIMESTAMP,
            metadata TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """))
    
    await session.execute(text("""
        CREATE TABLE IF NOT EXISTS subscription_requests (
            id VARCHAR(36) PRIMARY KEY,
            user_id VARCHAR(36),
            user_email VARCHAR(255),
            company_name VARCHAR(255),
            plan_name VARCHAR(100),
            plan_id VARCHAR(36),
            amount DECIMAL(10,2),
            payment_status VARCHAR(50) DEFAULT 'PENDING',
            payment_reference VARCHAR(255),
            workflow_status VARCHAR(50) DEFAULT 'PENDING',
            workflow_item_id VARCHAR(36),
            approved_at TIMESTAMP,
            rejected_at TIMESTAMP,
            rejection_reason TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """))
    
    await session.execute(text("""
        CREATE TABLE IF NOT EXISTS po_approval_requests (
            id VARCHAR(36) PRIMARY KEY,
            po_id VARCHAR(36) NOT NULL,
            po_number VARCHAR(100),
            requested_by_id VARCHAR(36),
            requested_by_email VARCHAR(255),
            edit_data TEXT,
            evidence_url VARCHAR(500),
            evidence_filename VARCHAR(255),
            workflow_status VARCHAR(50) DEFAULT 'PENDING_FINANCIAL',
            financial_approved_by VARCHAR(36),
            financial_approved_at TIMESTAMP,
            financial_notes TEXT,
            master_approved_by VARCHAR(36),
            master_approved_at TIMESTAMP,
            master_notes TEXT,
            final_status VARCHAR(50) DEFAULT 'PENDING',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """))
    
    await session.execute(text("""
        CREATE TABLE IF NOT EXISTS notifications_v2 (
            id VARCHAR(36) PRIMARY KEY,
            user_id VARCHAR(36),
            user_email VARCHAR(255),
            title VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            type VARCHAR(50) DEFAULT 'INFO',
            is_read BOOLEAN DEFAULT FALSE,
            action_url VARCHAR(500),
            workflow_item_id VARCHAR(36),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """))
    await session.commit()

async def create_test_user(session, email, role, company_name, gstin):
    # Check if company exists
    res_comp = await session.execute(select(Company).where(Company.gstin == gstin))
    comp = res_comp.scalars().first()
    if not comp:
        comp = Company(id=str(uuid4()), company_name=company_name, vendor_gstin=gstin, domain_name=email.split('@')[1], is_verified=True)
        session.add(comp)
        await session.flush()
    
    # Check if user exists
    res_user = await session.execute(select(User).where(User.email == email))
    user = res_user.scalars().first()
    if not user:
        user = User(
            id=str(uuid4()),
            company_id=comp.id,
            name=company_name,
            email=email,
            password_hash='test_hash',
            role=role,
            status='ACTIVE',
            phone='+919999999999',
            vendor_gstin=gstin,
            company_name=company_name,
            is_active=True,
            subscription_status='INACTIVE'
        )
        session.add(user)
        await session.flush()
    else:
        # Update role if user exists
        user.role = role
        await session.flush()
    return user

async def create_test_plan(session):
    res_plan = await session.execute(select(Plan).where(Plan.name == 'premium'))
    plan = res_plan.scalars().first()
    if not plan:
        plan = Plan(
            id=str(uuid4()),
            name='premium',
            display_name='Premium Plan',
            price=9999.0,
            validity_days=365,
            duration_type='yearly'
        )
        session.add(plan)
        await session.flush()
    return plan

async def test_subscription_workflow():
    print("\n--- Testing Subscription Workflow ---")
    async with AsyncSessionLocal() as session:
        # 1. Setup Users
        user = await create_test_user(session, "client@test.com", UserRole.COMPANY_ADMIN, "Client Corp", "27CLIENT0000A1Z")
        fin = await create_test_user(session, "fin@test.com", UserRole.FINANCIAL, "Internal Finance", "27FINANCE0001Z")
        ops = await create_test_user(session, "ops@test.com", UserRole.OPERATION, "Internal Ops", "27INTERNAL001Z")
        master = await create_test_user(session, "payalshinde906@gmail.com", UserRole.MASTER_ADMIN, "Master Admin", "27MASTER000A1Z")
        plan = await create_test_plan(session)
        await session.commit()

        # 2. User creates subscription request
        print(f"Step 1: User {user.email} creating subscription request...")
        req_id = await WorkflowService.create_subscription_request(
            session, str(user.id), user.email, user.company_name, plan.display_name, plan.price
        )
        await session.commit()
        
        # Verify workflow item created (Starts with FINANCIAL)
        res = await session.execute(text("SELECT * FROM workflow_items WHERE entity_id = :eid"), {"eid": req_id})
        wf_item = res.mappings().first()
        print(f"Workflow Item Created: ID={wf_item['id']}, Status={wf_item['status']}, Handler={wf_item['current_handler_role']}")
        assert wf_item['current_handler_role'] == 'FINANCIAL'

        # 3. Financial reviews and approves
        print("Step 2: Financial reviewing and approving...")
        await WorkflowService.financial_approve_subscription(session, wf_item['id'], fin.email, "Payment verified")
        await session.commit()
        
        # Verify status update (Moves to OPERATIONS)
        res = await session.execute(text("SELECT * FROM workflow_items WHERE id = :id"), {"id": wf_item['id']})
        wf_item = res.mappings().first()
        print(f"Workflow Item Updated (Fin): Status={wf_item['status']}, Handler={wf_item['current_handler_role']}")
        assert wf_item['current_handler_role'] == 'OPERATIONS'
        assert wf_item['status'] == 'PAYMENT_VERIFIED'

        # 4. Operations reviews and approves
        print("Step 3: Operations reviewing and approving...")
        await WorkflowService.operations_approve_subscription(session, wf_item['id'], ops.email, "Operations check passed")
        await session.commit()
        
        # Verify status update (Moves to MASTER_ADMIN)
        res = await session.execute(text("SELECT * FROM workflow_items WHERE id = :id"), {"id": wf_item['id']})
        wf_item = res.mappings().first()
        print(f"Workflow Item Updated (Ops): Status={wf_item['status']}, Handler={wf_item['current_handler_role']}")
        assert wf_item['current_handler_role'] == 'MASTER_ADMIN'
        assert wf_item['status'] == 'OPERATIONS_APPROVED'

        # 5. Master Admin approves
        print("Step 4: Master Admin final approval...")
        await WorkflowService.master_approve_subscription(session, wf_item['id'], str(master.id), master.email, "Final approval granted")
        await session.commit()
        
        # Verify final state
        res = await session.execute(text("SELECT * FROM workflow_items WHERE id = :id"), {"id": wf_item['id']})
        wf_item = res.mappings().first()
        print(f"Workflow Item Final: Status={wf_item['status']}, Handler={wf_item['current_handler_role']}")
        
        res_user = await session.execute(text("SELECT subscription_status FROM users WHERE id = :uid"), {"uid": str(user.id)})
        updated_status = res_user.scalar()
        print(f"User Subscription Status: {updated_status}")
        assert updated_status == 'ACTIVE'
        assert wf_item['status'] == 'MASTER_APPROVED'
        print("SUCCESS: Subscription workflow completed.")

async def test_po_workflow():
    print("\n--- Testing PO Edit Workflow ---")
    async with AsyncSessionLocal() as session:
        # 1. Setup Users
        user = await create_test_user(session, "client_po@test.com", UserRole.COMPANY_ADMIN, "Client PO Corp", "27CLIENTPO000Z")
        fin = await create_test_user(session, "fin@test.com", UserRole.FINANCIAL, "Internal Finance", "27FINANCE0001Z")
        master = await create_test_user(session, "payalshinde906@gmail.com", UserRole.MASTER_ADMIN, "Master Admin", "27MASTER000A1Z")
        
        # Create a PO to edit
        po = PurchaseOrder(
            id=str(uuid4()),
            user_id=user.id,
            po_number="PO-WORKFLOW-001",
            vendor="Test Vendor",
            vendor_gstin="27VENDOR0001Z",
            amount=50000.0,
            due_date=datetime.now(timezone.utc) + timedelta(days=30),
            status="Open",
            company_id=user.company_id
        )
        session.add(po)
        await session.flush()
        await session.commit()

        # 2. User submits PO edit for approval
        print(f"Step 1: User {user.email} submitting PO {po.po_number} edit...")
        edit_data = {"amount": 75000.0, "vendor": "Updated Vendor"}
        req_id = await WorkflowService.create_po_approval_request(
            session, po.id, po.po_number, str(user.id), user.email, edit_data, "http://evidence.url/doc.pdf", "evidence.pdf"
        )
        await session.commit()
        
        # Verify workflow item
        res = await session.execute(text("SELECT * FROM workflow_items WHERE entity_id = :eid"), {"eid": req_id})
        wf_item = res.mappings().first()
        print(f"Workflow Item Created: ID={wf_item['id']}, Status={wf_item['status']}, Handler={wf_item['current_handler_role']}")
        assert wf_item['current_handler_role'] == 'FINANCIAL'

        # 3. Financial reviews and approves
        print("Step 2: Financial reviewing and approving...")
        await WorkflowService.financial_approve_po(session, wf_item['id'], str(fin.id), fin.email, "Financial evidence verified")
        await session.commit()
        
        # Verify status update
        res = await session.execute(text("SELECT * FROM workflow_items WHERE id = :id"), {"id": wf_item['id']})
        wf_item = res.mappings().first()
        print(f"Workflow Item Updated: Status={wf_item['status']}, Handler={wf_item['current_handler_role']}")
        assert wf_item['current_handler_role'] == 'MASTER_ADMIN'
        assert wf_item['status'] == 'FINANCIAL_APPROVED'

        # 4. Master Admin approves
        print("Step 3: Master Admin final approval...")
        await WorkflowService.master_approve_po(session, wf_item['id'], str(master.id), master.email, "Master final approval")
        await session.commit()
        
        # Verify final state
        res = await session.execute(text("SELECT * FROM workflow_items WHERE id = :id"), {"id": wf_item['id']})
        wf_item = res.mappings().first()
        print(f"Workflow Item Final: Status={wf_item['status']}")
        
        # Verify PO updated
        res_po = await session.execute(text("SELECT amount, vendor FROM purchase_orders WHERE id = :id"), {"id": str(po.id)})
        updated_row = res_po.mappings().first()
        print(f"PO Updated: Amount={updated_row['amount']}, Vendor={updated_row['vendor']}")
        assert math.isclose(updated_row['amount'], 75000.0, rel_tol=1e-9)
        assert updated_row['vendor'] == "Updated Vendor"
        print("SUCCESS: PO Edit workflow completed.")

async def main():
    async with AsyncSessionLocal() as session:
        await setup_db(session)
    try:
        await test_subscription_workflow()
        await test_po_workflow()
        print("\n🎉 ALL TESTS PASSED!")
    except Exception as e:
        print(f"\n❌ TEST FAILED: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
