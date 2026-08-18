
import asyncio
import uuid
import sys
sys.path.insert(0, '.')
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.database import AsyncSessionLocal
from app.utils.password import hash_password
from datetime import datetime, timezone

async def create_test_users():
    async with AsyncSessionLocal() as db:
        # First, get or create a test company
        company_result = await db.execute(
            text("SELECT id, company_name, gstin FROM companies LIMIT 1")
        )
        company = company_result.fetchone()
        
        company_id = None
        company_name = None
        company_gstin = None
        
        if not company:
            # Create a test company
            company_id = str(uuid.uuid4())
            company_name = "Test Company Pvt Ltd"
            company_gstin = "27AAAAA0000A1Z5"
            await db.execute(text("""
                INSERT INTO companies (id, company_name, gstin, company_email, created_at)
                VALUES (:id, :name, :gstin, :email, NOW())
            """), {
                "id": company_id,
                "name": company_name,
                "gstin": company_gstin,
                "email": "test@company.com"
            })
            await db.commit()
            print(f"Created test company: {company_name} ({company_gstin})")
        else:
            company_id, company_name, company_gstin = company
            print(f"Using existing company: {company_name} ({company_gstin})")
        
        # Define test users
        test_users = [
            {
                "name": "User A",
                "email": "usera.test@creditwatch.com",
                "password": "Test@1234",
                "role": "COMPANY_ADMIN",
                "is_internal": False
            },
            {
                "name": "Operation User",
                "email": "ops.test@creditwatch.com",
                "password": "Test@1234",
                "role": "OPERATION",
                "is_internal": True
            },
            {
                "name": "Financial User",
                "email": "fin.test@creditwatch.com",
                "password": "Test@1234",
                "role": "FINANCIAL",
                "is_internal": True
            },
            {
                "name": "Legal User",
                "email": "legal.test@creditwatch.com",
                "password": "Test@1234",
                "role": "LEGAL",
                "is_internal": True
            },
            {
                "name": "Master Admin",
                "email": "master.test@creditwatch.com",
                "password": "Test@1234",
                "role": "MASTER_ADMIN",
                "is_internal": True
            }
        ]
        
        for user_data in test_users:
            # Check if user already exists
            existing_result = await db.execute(
                text("SELECT id FROM users WHERE email = :email"),
                {"email": user_data["email"]}
            )
            existing = existing_result.fetchone()
            
            if existing:
                print(f"User {user_data['email']} already exists - skipping")
                continue
            
            # Create user
            user_id = str(uuid.uuid4())
            hashed_pw = hash_password(user_data["password"])
            
            await db.execute(text("""
                INSERT INTO users (
                    id, name, email, password_hash, role, gstin, company_id, company_name,
                    is_active, status, subscription_bypass, full_access, phone, created_at
                ) VALUES (
                    :id, :name, :email, :password_hash, :role, :gstin, :company_id, :company_name,
                    :is_active, :status, :subscription_bypass, :full_access, :phone, NOW()
                )
            """), {
                "id": user_id,
                "name": user_data["name"],
                "email": user_data["email"],
                "password_hash": hashed_pw,
                "role": user_data["role"],
                "gstin": company_gstin,
                "company_id": company_id,
                "company_name": company_name,
                "is_active": True,
                "status": "ACTIVE",
                "subscription_bypass": user_data["is_internal"],
                "full_access": user_data["is_internal"],
                "phone": "N/A"
            })
            
            print(f"Created user: {user_data['email']} with role {user_data['role']}")
        
        await db.commit()
        print("\nAll test users processed successfully!")

if __name__ == "__main__":
    asyncio.run(create_test_users())

