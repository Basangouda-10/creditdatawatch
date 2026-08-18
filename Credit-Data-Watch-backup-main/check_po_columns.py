import asyncio
import asyncpg
import sys

async def check_columns():
    print('=== CHECKING purchase_orders COLUMNS ===')
    try:
        conn = await asyncpg.connect('postgresql://postgres:2004@localhost:5432/creditdatawatch')
        cols = await conn.fetch("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'purchase_orders'
        """)
        for c in cols:
            print(f" - {c['column_name']} ({c['data_type']})")
        await conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(check_columns())
