
import asyncio
import asyncpg

async def main():
    conn = await asyncpg.connect('postgresql://postgres:2004@localhost:5432/creditdatawatch')
    # Update shindepayal490@gmail.com to OPERATION
    await conn.execute("""
        UPDATE users 
        SET role = 'OPERATION'
        WHERE email = 'shindepayal490@gmail.com'
    """)
    # Update ops@test.com
    await conn.execute("""
        UPDATE users 
        SET role = 'OPERATION'
        WHERE email = 'ops@test.com'
    """)
    # Update shindepayla296@gmail.com
    await conn.execute("""
        UPDATE users 
        SET role = 'OPERATION'
        WHERE email = 'shindepayla296@gmail.com'
    """)
    print("Updated users' roles!")
    await conn.close()

if __name__ == "__main__":
    asyncio.run(main())
