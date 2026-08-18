import asyncio, asyncpg 
async def health(): 
    conn = await asyncpg.connect('postgresql://postgres:2004@localhost:5432/creditdatawatch') 
    
    critical_tables = [ 
        'users', 'purchase_orders', 'subscription_requests', 'workflow_items', 
        'po_approval_requests', 'business_check_requests', 'legal_notice_requests', 
        'system_settings', 'global_credibility_index', 'notifications' 
    ] 
    
    print('=== TABLE HEALTH ===') 
    for t in critical_tables: 
        try: 
            c = await conn.fetchval(f'SELECT COUNT(*) FROM {t}') 
            print(f'OK  {t}: {c} rows') 
        except Exception as e: 
            print(f'MISSING  {t}: {e}') 
    
    print('\n=== SYSTEM SETTINGS ===') 
    settings = await conn.fetch('SELECT key, value FROM system_settings') 
    for s in settings: print(f'  {s["key"]} = {s["value"]}') 
    
    print('\n=== WORKFLOW ITEMS BY TYPE+STATUS ===') 
    wf = await conn.fetch('SELECT type, status, COUNT(*) as cnt FROM workflow_items GROUP BY type, status ORDER BY type, status') 
    for w in wf: print(f'  {w["type"]} | {w["status"]} | {w["cnt"]} items') 
    
    print('\n=== BUSINESS CHECK REQUESTS BY STATUS ===') 
    biz = await conn.fetch('SELECT status, COUNT(*) as cnt FROM business_check_requests GROUP BY status') 
    for b in biz: print(f'  {b["status"]}: {b["cnt"]}') 
    
    print('\n=== LEGAL NOTICE REQUESTS BY STATUS ===') 
    try: 
        leg = await conn.fetch('SELECT status, COUNT(*) as cnt FROM legal_notice_requests GROUP BY status') 
        for l in leg: print(f'  {l["status"]}: {l["cnt"]}') 
    except: print('  legal_notice_requests table missing!') 
    
    print('\n=== SUBSCRIPTION REQUESTS BY STATUS ===') 
    subs = await conn.fetch('SELECT COALESCE(workflow_status, status, "UNKNOWN") as s, COUNT(*) as cnt FROM subscription_requests GROUP BY s') 
    for s in subs: print(f'  {s["s"]}: {s["cnt"]}') 
    
    print('\n=== TEST USERS ===') 
    test_emails = ['payalshinde906@gmail.com','ops@cdw.test','fin@cdw.test','legal@cdw.test'] 
    for email in test_emails: 
        u = await conn.fetchrow('SELECT email, role, is_active, status FROM users WHERE email=$1', email) 
        if u: print(f'  {dict(u)}') 
        else: print(f'  MISSING: {email}') 
    
    print('\n=== PURCHASE ORDERS SAMPLE ===') 
    pos = await conn.fetch('SELECT id, po_number, status, amount, legal_support_requested_at, legal_notice_sent_at FROM purchase_orders LIMIT 3') 
    for p in pos: print(f'  {dict(p)}') 
    
    await conn.close() 

asyncio.run(health())