
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.database import AsyncSessionLocal
from sqlalchemy import select, text

async def fix_company_admin():
    async with AsyncSessionLocal() as db:
        # Get master admin's company_id
        admin_result = await db.execute(text("SELECT company_id FROM users WHERE email = 'payalshinde906@gmail.com'"))
        admin_row = admin_result.fetchone()
        if not admin_row:
            print("Master admin not found!")
            return
        
        master_company_id = admin_row[0]
        print(f"Master admin company ID: {master_company_id}")
        
        # Update COMPANY_ADMIN users to have this company_id
        update_result = await db.execute(text("""
            UPDATE users 
            SET company_id = :cid 
            WHERE role = 'COMPANY_ADMIN'
        """), {"cid": master_company_id})
        
        await db.commit()
        
        print(f"Updated {update_result.rowcount} COMPANY_ADMIN users to have company_id {master_company_id}")
        
        # Verify the change
        verify_result = await db.execute(text("""
            SELECT id, email, company_id, role FROM users WHERE role = 'COMPANY_ADMIN'
        """))
        print("\nVerifying changes:")
        for u in verify_result.fetchall():
            print(f"  {u.email} | {u.company_id} | {u.role}")

if __name__ == "__main__":
    import asyncio
    asyncio.run(fix_company_admin())
