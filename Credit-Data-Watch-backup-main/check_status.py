import asyncio
import asyncpg

async def check():
    try:
        conn = await asyncpg.connect('postgresql://postgres:2004@localhost:5432/creditdatawatch')
        users = await conn.fetch('SELECT email, gstin, is_active, status FROM users')
        print('=== USER STATUS ===')
        for u in users:
            print(dict(u))
        await conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(check())
