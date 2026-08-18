import asyncpg
import asyncio

async def main():
    conn = await asyncpg.connect('postgresql://postgres:2004@localhost:5432/creditdatawatch')
    print("=== CONNECTED TO DB ===")
    
    print("\n=== UPDATING ALL USERS TO HAVE FULL ACCESS ===")
    await conn.execute("""
        UPDATE users 
        SET subscription_bypass = true, 
            full_access = true,
            subscription_status = 'ACTIVE'
        WHERE email IN (
            'payalshinde906@gmail.com',
            'user@test.com',
            'testuser@example.com',
            'shindepayal295@gmail.com',
            'ops@test.com',
            'fin@test.com',
            'legal@test.com',
            'jay@pvt.ltd'
        )
    """)
    
    print("\n=== FINAL USER STATUS ===")
    users = await conn.fetch("""
        SELECT email, role, subscription_status, subscription_bypass, full_access 
        FROM users 
        WHERE email IN (
            'payalshinde906@gmail.com',
            'user@test.com',
            'testuser@example.com',
            'shindepayal295@gmail.com',
            'ops@test.com',
            'fin@test.com',
            'legal@test.com',
            'jay@pvt.ltd'
        )
        ORDER BY email
    """)
    
    for u in users:
        print(f"  {u['email']:<40} | {u['role']:<20} | {u['subscription_status']:<10} | bypass={u['subscription_bypass']} | full={u['full_access']}")
    
    await conn.close()
    print("\n✅ DONE!")

asyncio.run(main())