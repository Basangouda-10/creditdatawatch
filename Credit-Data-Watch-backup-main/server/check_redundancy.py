import asyncio, asyncpg 
 
async def check(): 
    conn = await asyncpg.connect('postgresql://postgres:2004@localhost:5432/creditdatawatch') 
    
    print('=== DUPLICATE PO NUMBERS ===') 
    rows = await conn.fetch(""" 
        SELECT po_number, COUNT(*) as count, array_agg(id::text) as ids 
        FROM purchase_orders GROUP BY po_number HAVING COUNT(*) > 1 
    """) 
    print(f'Found: {len(rows)} duplicates') 
    for r in rows: print(dict(r)) 
    
    print('\n=== DUPLICATE VENDORS IN COMPANIES ===') 
    rows = await conn.fetch(""" 
        SELECT company_name, COUNT(*) as count, array_agg(id::text) as ids 
        FROM companies GROUP BY company_name HAVING COUNT(*) > 1 
    """) 
    print(f'Found: {len(rows)} duplicates') 
    for r in rows: print(dict(r)) 
    
    print('\n=== DUPLICATE USERS (same email) ===') 
    rows = await conn.fetch(""" 
        SELECT email, COUNT(*) as count FROM users GROUP BY email HAVING COUNT(*) > 1 
    """) 
    print(f'Found: {len(rows)} duplicates') 
    for r in rows: print(dict(r)) 
    
    print('\n=== DUPLICATE CREDIBILITY RECORDS ===') 
    rows = await conn.fetch(""" 
        SELECT company_id, COUNT(*) as count FROM company_credibility_index 
        GROUP BY company_id HAVING COUNT(*) > 1 
    """) 
    print(f'Found: {len(rows)} duplicates') 
    for r in rows: print(dict(r)) 
    
    await conn.close() 
    print('\n✅ Redundancy check complete!') 
 
if __name__ == "__main__":
    asyncio.run(check()) 
