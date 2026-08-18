import asyncio
import asyncpg
import uuid
import bcrypt

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

async def seed_test_users():
    print('=== SEEDING TEST USERS ===')
    try:
        conn = await asyncpg.connect('postgresql://postgres:2004@localhost:5432/creditdatawatch')
        
        # 1. Ensure company exists
        gstin = '22AAAAD0000A1Z5'
        company_name = 'Test Company'
        company_id = await conn.fetchval('SELECT id FROM companies WHERE gstin = $1', gstin)
        if not company_id:
            company_id = str(uuid.uuid4())
            await conn.execute("""
                INSERT INTO companies (id, company_name, gstin, domain_name, is_verified)
                VALUES ($1, $2, $3, $4, true)
            """, company_id, company_name, gstin, 'test.com')
            print(f"Created company: {company_name}")
        
        test_users = [
            ('user@test.com', 'USER', 'Test User', '1234567890'),
            ('ops@test.com', 'OPERATION', 'Ops User', '1234567891'),
            ('fin@test.com', 'FINANCIAL', 'Fin User', '1234567892'),
            ('legal@test.com', 'LEGAL', 'Legal User', '1234567893'),
            ('payalshinde906@gmail.com', 'MASTER_ADMIN', 'Payal Shinde', '1234567894'),
            ('shindepayal490@gmail.com', 'OPERATION', 'Jack', '1234567895'),
            ('shindepayal296@gmail.com', 'FINANCIAL', 'Mona', '1234567896'),
            ('mansvikadam2007@gmail.com', 'COMPANY_ADMIN', 'Manasvi Pvt.Ltd', '1234567897'),
        ]
        
        password_hash = hash_password('TestPass123!')
        
        for email, role, name, phone in test_users:
            # Check if exists
            exists = await conn.fetchval('SELECT id FROM users WHERE email = $1', email)
            if not exists:
                uid = str(uuid.uuid4())
                await conn.execute("""
                    INSERT INTO users (id, email, role, name, phone, gstin, company_name, company_id, password_hash, is_active, status, subscription_status)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, 'ACTIVE', 'INACTIVE')
                """, uid, email, role, name, phone, gstin, company_name, company_id, password_hash)
                print(f"Created {role}: {email}")
            else:
                # Update user's password, role, name if needed
                await conn.execute("""
                    UPDATE users
                    SET password_hash = $1, role = $2, name = $3, phone = $4
                    WHERE email = $5
                """, password_hash, role, name, phone, email)
                print(f"Updated {role}: {email}")
                
        await conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(seed_test_users())
