
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.database import AsyncSessionLocal
from sqlalchemy import select, text

async def check_user():
    async with AsyncSessionLocal() as db:
        # First get all users
        result = await db.execute(text("""
            SELECT id, name, email, role, company_id FROM users ORDER BY created_at DESC
        """))
        users = result.fetchall()
        print("All users and their roles and company_id:")
        for u in users:
            print(f"  ID: {u.id} | Email: {u.email} | Role: {u.role} | Company ID: {u.company_id}")
        
        # Get current admin's company_id (payalshinde906@gmail.com)
        admin_result = await db.execute(text("SELECT company_id FROM users WHERE email = 'payalshinde906@gmail.com'"))
        admin_company = admin_result.fetchone()
        print(f"\nMaster Admin's Company ID: {admin_company[0] if admin_company else 'NONE'}")

if __name__ == "__main__":
    import asyncio
    asyncio.run(check_user())
