import asyncio
import asyncpg

async def check():
    try:
        conn = await asyncpg.connect('postgresql://postgres:2004@localhost:5432/creditdatawatch')
        users = await conn.fetch('SELECT email, password_hash FROM users')
        print('=== USER PASSWORDS ===')
        for u in users:
            print(f" - {u['email']}: {u['password_hash'][:30]}...")
        await conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(check())
