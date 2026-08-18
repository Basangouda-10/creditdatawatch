import asyncio
import asyncpg
import sys
import os

# Add server directory to path to import app
sys.path.append(os.path.join(os.getcwd(), 'server'))

from app.utils.password import hash_password

async def update_passwords():
    print('=== UPDATING TEST USER PASSWORDS (USING APP LOGIC) ===')
    try:
        conn = await asyncpg.connect('postgresql://postgres:2004@localhost:5432/creditdatawatch')
        
        new_hash = hash_password('TestPass123!')
        print(f"Generated hash: {new_hash}")
        
        emails = ['user@test.com', 'ops@test.com', 'fin@test.com', 'legal@test.com']
        for email in emails:
            await conn.execute("UPDATE users SET password_hash = $1 WHERE email = $2", new_hash, email)
            print(f"Updated password for {email}")
            
        await conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(update_passwords())
