
import asyncio
import asyncpg

async def check():
    conn = await asyncpg.connect(
        user="postgres",
        password="2004",
        database="creditdatawatch",
        host="localhost",
        port=5432
    )

    # Check legal_notice_requests table
    try:
        c = await conn.fetchval('SELECT COUNT(*) FROM legal_notice_requests')
        cols = await conn.fetch("SELECT column_name FROM information_schema.columns WHERE table_name='legal_notice_requests' ORDER BY ordinal_position")
        print(f'legal_notice_requests: {c} rows | cols: {[r["column_name"] for r in cols]}')
    except Exception as e:
        print(f'legal_notice_requests: MISSING — {e}')

    await conn.close()

asyncio.run(check())
