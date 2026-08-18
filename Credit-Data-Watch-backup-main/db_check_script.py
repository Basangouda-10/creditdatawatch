
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

    # Check LEGAL_NOTICE workflow items in detail
    rows = await conn.fetch("SELECT id, type, status, entity_id, entity_type, submitted_by_email, current_handler_role FROM workflow_items WHERE type='LEGAL_NOTICE'")
    print(f'\nLEGAL_NOTICE workflow items ({len(rows)}):')
    for r in rows:
        print(f'  {dict(r)}')

    # Check purchase_orders with legal requests
    pos = await conn.fetch("SELECT id, po_number, vendor, amount, legal_support_requested_at, legal_support_status, legal_notice_sent_at FROM purchase_orders WHERE legal_support_requested_at IS NOT NULL LIMIT 5")
    print(f'\nPOs with legal requests ({len(pos)}):')
    for p in pos:
        print(f'  {dict(p)}')

    # Check business_check_requests pending master
    biz = await conn.fetch("SELECT id, company_name, gstin, status, verdict, report_url FROM business_check_requests WHERE status='PENDING_MASTER'")
    print(f'\nbusiness_check_requests PENDING_MASTER ({len(biz)}):')
    for b in biz:
        print(f'  {dict(b)}')

    # Check global_credibility_index columns
    try:
        cols = await conn.fetch("SELECT column_name FROM information_schema.columns WHERE table_name='global_credibility_index' ORDER BY ordinal_position")
        print(f'\nglobal_credibility_index cols: {[r["column_name"] for r in cols]}')
    except:
        print('\nglobal_credibility_index: MISSING')

    await conn.close()

asyncio.run(check())
