
import asyncio
import asyncpg
from passlib.context import CryptContext

pwd = CryptContext(schemes=['bcrypt'], deprecated='auto')

async def main():
    conn = await asyncpg.connect('postgresql://postgres:2004@localhost:5432/creditdatawatch')
    
    print("Current users:")
    users = await conn.fetch("SELECT id, email, role, gstin FROM users WHERE role IN ('OPERATION', 'FINANCIAL', 'LEGAL')")
    for u in users:
        print(f"  {u['role']:20} | {u['email']} | {u['gstin']}")
    
    # Update ops@test.com, fin@test.com, legal@test.com
    new_password = "Test@1234"
    hashed = pwd.hash(new_password)
    
    for email in ['ops@test.com', 'fin@test.com', 'legal@test.com']:
        result = await conn.execute("""
            UPDATE users 
            SET password_hash = $1, is_active = true, status = 'ACTIVE'
            WHERE email = $2
        """, hashed, email)
        print(f"\nUpdated {email}: {result}")
    
    # Check their GSTINs
    print("\nFinal check:")
    users = await conn.fetch("SELECT id, email, role, gstin FROM users WHERE email IN ('ops@test.com', 'fin@test.com', 'legal@test.com')")
    for u in users:
        print(f"  {u['role']:20} | {u['email']} | GSTIN: {u['gstin']}")
    
    await conn.close()

asyncio.run(main())
