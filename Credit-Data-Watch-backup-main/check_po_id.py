
import asyncio
import asyncpg

async def main():
    conn = await asyncpg.connect(
        user="postgres",
        password="2004",
        database="creditdatawatch",
        host="localhost",
        port=5432
    )
    # Get purchase_orders id column type
    result = await conn.fetch("""
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'purchase_orders' AND column_name = 'id'
    """)
    print("purchase_orders.id:", [dict(r) for r in result])
    await conn.close()

asyncio.run(main())
