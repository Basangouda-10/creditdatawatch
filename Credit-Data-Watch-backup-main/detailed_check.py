
import asyncio
import asyncpg

async def check():
    conn = await asyncpg.connect('postgresql://postgres:2004@localhost:5432/creditdatawatch')
    
    # Check both business tables
    for t in ['business_requests', 'business_check_requests']:
        try:
            c = await conn.fetchval(f'SELECT COUNT(*) FROM {t}')
            cols = await conn.fetch(f"SELECT column_name FROM information_schema.columns WHERE table_name='{t}' ORDER BY ordinal_position")
            sample = await conn.fetch(f'SELECT * FROM {t} ORDER BY created_at DESC LIMIT 2')
            print(f'\nOK {t}: {c} rows')
            print(f'  cols: {[r[0] for r in cols]}')
            print(f'  sample statuses: {[dict(r).get("status") for r in sample]}')
        except Exception as e:
            print(f'MISSING {t}: {e}')
    
    # Check purchase_orders legal columns
    cols = await conn.fetch("""
        SELECT column_name FROM information_schema.columns
        WHERE table_name='purchase_orders' AND column_name LIKE '%legal%'
    """)
    print(f'\npurchase_orders legal cols: {[r[0] for r in cols]}')
    
    # Check workflow_items types
    wf = await conn.fetch("SELECT DISTINCT type, status FROM workflow_items ORDER BY type, status")
    print(f'\nworkflow_items types+statuses: {[(r["type"], r["status"]) for r in wf]}')
    
    # Check all routes files that exist
    import os
    route_files = os.listdir('server/app/routes/')
    print(f'\nRoute files: {route_files}')
    
    # Check network trust table
    tables = await conn.fetch("""
        SELECT table_name FROM information_schema.tables
        WHERE table_schema='public' AND (table_name LIKE '%network%' OR table_name LIKE '%trust%')
    """)
    print(f'\nNetwork/trust tables: {[t["table_name"] for t in tables]}')
    
    # Check users table columns (for company info)
    cols2 = await conn.fetch("""
        SELECT column_name FROM information_schema.columns
        WHERE table_name='users' ORDER BY ordinal_position
    """)
    print(f'\nusers cols: {[r[0] for r in cols2]}')
    
    await conn.close()

asyncio.run(check())
