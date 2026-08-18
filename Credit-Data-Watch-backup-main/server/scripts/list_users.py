import asyncio
import sys
import os

# Add the server directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.database import AsyncSessionLocal
from sqlalchemy import text

async def list_users():
    db = AsyncSessionLocal()
    result = await db.execute(text("SELECT id, name, email, role, status, created_at FROM users ORDER BY created_at DESC"))
    users = result.fetchall()
    print(f"\nTotal users: {len(users)}\n")
    for u in users:
        print(f"  ID: {u.id}, Email: {u.email}, Role: {u.role}, Status: {u.status}, Created: {str(u.created_at)[:19]}")
    await db.close()

asyncio.run(list_users())
