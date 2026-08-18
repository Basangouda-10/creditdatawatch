import asyncio
import asyncpg
import sys
import os

# Add server directory to path to import app
sys.path.append(os.path.join(os.getcwd(), 'server'))

from app.utils.password import hash_password

async def update_workflow_test_users():
    print('=== UPDATING WORKFLOW TEST USERS ===')
    try:
        conn = await asyncpg.connect('postgresql://postgres:2004@localhost:5432/creditdatawatch')
        
        # Test password
        test_pass = hash_password('TestPass123!')
        
        users = [
            ('ops@test.com', 'OPERATION'),
            ('fin@test.com', 'FINANCIAL'),
            ('legal@test.com', 'LEGAL'),
            ('user@test.com', 'USER')
        ]
        
        # Get a real company_id from existing users or companies table
        company_row = await conn.fetchrow("SELECT id FROM companies LIMIT 1")
        if not company_row:
            import uuid
            company_id = str(uuid.uuid4())
            await conn.execute("""
                INSERT INTO companies (id, company_name, gstin, domain, is_active)
                VALUES ($1, $2, $3, $4, $5)
            """, company_id, 'Test Company', '22AAAAD0000A1Z5', 'test.com', True)
            print(f"✅ Created test company: {company_id}")
        else:
            company_id = company_row['id']
            print(f"ℹ️ Using existing company: {company_id}")
        
        for email, role in users:
            # Check if user exists
            exists = await conn.fetchval("SELECT COUNT(*) FROM users WHERE email = $1", email)
            if exists:
                await conn.execute("""
                    UPDATE users 
                    SET password_hash = $1, role = $2, gstin = $3, is_active = true, status = 'ACTIVE', company_id = $4
                    WHERE email = $5
                """, test_pass, role, '22AAAAD0000A1Z5', company_id, email)
                print(f"✅ Updated user: {email} ({role})")
            else:
                import uuid
                await conn.execute("""
                    INSERT INTO users (id, email, password_hash, role, gstin, is_active, status, subscription_status, company_id)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                """, str(uuid.uuid4()), email, test_pass, role, '22AAAAD0000A1Z5', True, 'ACTIVE', 'ACTIVE' if role != 'USER' else 'INACTIVE', company_id)
                print(f"✅ Created user: {email} ({role})")

        await conn.close()
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(update_workflow_test_users())
