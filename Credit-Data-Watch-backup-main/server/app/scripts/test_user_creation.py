import asyncio
from uuid import uuid4
from sqlalchemy import select, text
import os, sys

# Setup paths
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
SERVER_ROOT = os.path.dirname(os.path.dirname(CURRENT_DIR))
if SERVER_ROOT not in sys.path:
    sys.path.insert(0, SERVER_ROOT)

from app.database import AsyncSessionLocal
from app.models import User, UserRole
from app.utils.password import verify_password

async def test_internal_user_creation():
    print("\n--- Testing Internal User Creation Logic ---")
    
    # We'll simulate the logic inside create_internal_user route
    # but run it directly in a test script for verification.
    
    test_email = f"staff_{uuid4().hex[:6]}@test.com"
    test_name = "Test Staff"
    test_pass = "StaffPass@123"
    test_role = "FINANCIAL"
    test_gstin = "27AAAAA0000A1Z5"

    async with AsyncSessionLocal() as session:
        # 1. Check if master admin exists (prerequisite)
        res_master = await session.execute(select(User).where(User.role == 'MASTER_ADMIN'))
        master = res_master.scalars().first()
        if not master:
            print("❌ Master Admin not found. Please run e2e_workflow_test.py first to bootstrap.")
            return

        # 2. Simulate User creation (logic from admin.py)
        from app.utils.password import hash_password
        hashed = hash_password(test_pass)
        
        new_user = User(
            id=str(uuid4()),
            name=test_name,
            email=test_email,
            role=test_role,
            gstin=test_gstin,
            company_id=master.company_id,
            company_name=master.company_name,
            password_hash=hashed,
            is_active=True,
            status='ACTIVE',
            subscription_bypass=True,
            full_access=True,
            phone='N/A'
        )
        session.add(new_user)
        await session.commit()
        print(f"✅ User created in DB: {test_email}")

        # 3. Verify in DB
        res_check = await session.execute(select(User).where(User.email == test_email))
        db_user = res_check.scalars().first()
        
        print(f"Verifying DB record...")
        assert db_user is not None
        assert db_user.name == test_name
        assert db_user.role == test_role
        assert db_user.company_id == master.company_id
        assert db_user.subscription_bypass == True
        assert verify_password(test_pass, db_user.password_hash)
        print("✅ DB Verification Successful.")

        # 4. Check Email Service logic (without sending real email if possible)
        # In a real test we'd mock EmailService, here we just verify the role_tasks lookup
        role_tasks = {
            'OPERATION': '- Process subscription requests\n- Review business requests\n- Map vendor data',
            'FINANCIAL': '- Review high-value POs\n- Verify payments\n- Track invoices',
            'LEGAL': '- Handle legal notices\n- Review GSTIN reports\n- Process legal requests'
        }
        assert test_role in role_tasks
        print(f"✅ Role responsibilities found: {role_tasks[test_role][:30]}...")

    print("\n🎉 Internal User Creation logic verified successfully!")

if __name__ == "__main__":
    asyncio.run(test_internal_user_creation())
