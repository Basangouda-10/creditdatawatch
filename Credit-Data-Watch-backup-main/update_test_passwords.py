import asyncio
import asyncpg
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt_sha256", "bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

async def update_passwords():
    print('=== UPDATING TEST USER PASSWORDS ===')
    try:
        conn = await asyncpg.connect('postgresql://postgres:2004@localhost:5432/creditdatawatch')
        
        new_hash = hash_password('TestPass123!')
        
        emails = ['user@test.com', 'ops@test.com', 'fin@test.com', 'legal@test.com']
        for email in emails:
            await conn.execute("UPDATE users SET password_hash = $1 WHERE email = $2", new_hash, email)
            print(f"Updated password for {email}")
            
        await conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(update_passwords())
