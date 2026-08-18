
import asyncio
import asyncpg

async def main():
    conn = await asyncpg.connect('postgresql://postgres:2004@localhost:5432/creditdatawatch')
    users = await conn.fetch("SELECT id, email, role, is_active FROM users ORDER BY created_at DESC LIMIT 10")
    print("Last 10 users in DB:")
    for u in users:
        print(f"  {u['role']:20} | {u['email']}")
    await conn.close()

asyncio.run(main())
