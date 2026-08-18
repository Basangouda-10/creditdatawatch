import asyncio
import asyncpg

async def check():
    try:
        conn = await asyncpg.connect('postgresql://postgres:2004@localhost:5432/creditdatawatch')
        row = await conn.fetchrow("SELECT gstin FROM users WHERE email = 'payalshinde906@gmail.com'")
        if row:
            print(f"GSTIN: {row['gstin']}")
        else:
            print("User not found")
        await conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(check())
