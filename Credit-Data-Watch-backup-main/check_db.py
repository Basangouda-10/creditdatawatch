
import asyncio
import asyncpg

async def check():
    conn = await asyncpg.connect('postgresql://postgres:2004@localhost:5432/creditdatawatch')
    for t in ['subscription_requests','workflow_items','po_approval_requests','business_requests','system_settings','purchase_orders','legal_notice_requests']:
        try:
            c = await conn.fetchval(f'SELECT COUNT(*) FROM {t}')
            cols = await conn.fetch(f"SELECT column_name FROM information_schema.columns WHERE table_name='{t}' ORDER BY ordinal_position")
            print(f'OK  {t}: {c} rows | cols: {[r["column_name"] for r in cols]}')
        except Exception as e:
            print(f'MISSING  {t}: {e}')
    settings = await conn.fetch('SELECT key, value FROM system_settings')
    print('Settings:', [(s['key'], s['value']) for s in settings])
    await conn.close()

asyncio.run(check())
