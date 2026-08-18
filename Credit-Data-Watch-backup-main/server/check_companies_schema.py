import asyncio
import asyncpg

async def check():
    try:
        conn = await asyncpg.connect('postgresql://postgres:2004@localhost:5432/creditdatawatch')
        rows = await conn.fetch("""
            SELECT column_name, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'companies'
        """)
        for r in rows:
            print(dict(r))
        await conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(check())
