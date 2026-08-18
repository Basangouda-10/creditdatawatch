import asyncio
import sys
import os

# Add the server directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.database import AsyncSessionLocal
from sqlalchemy import text

# Test user IDs
TEST_USER_IDS = [
    "c4ec40de-3b0c-4477-8c98-3d9c87a05a2a",
    "9c2c27bf-8184-4256-b723-09749628cbfc",
    "40223a0e-5722-4d56-94e5-0b727507a1de",
    "258ee3d6-3b9a-4919-9477-7efc93cb745e",
    "5fbf58c1-3296-4160-849c-80d2f80a5a58",
    "42b000e2-920b-4da9-859e-5aa74b8d3f78",
    "2cc16a5e-1f5c-4c8f-97b7-249d73c44495",
    "5ee1592c-99c4-44c7-9d2e-0509479ba625",
    "42b56437-371d-4f20-97e5-e4ceddd46d3c",
    "9be5ac5f-def0-452d-b748-8d36b28eb895",
    "00abdc8c-c8b1-48ee-bdd4-41ed71ddd5dc",
    "1c4ca498-d367-4e41-96d0-7af0238bb998"
]

async def delete_test_users_final():
    db = AsyncSessionLocal()
    try:
        print("Disabling foreign key checks...")
        await db.execute(text("SET session_replication_role = replica"))
        await db.commit()
        
        print("Deleting test users...")
        await db.execute(text("DELETE FROM users WHERE id = ANY(:user_ids)"), {"user_ids": TEST_USER_IDS})
        await db.commit()
        
        print("OK! All test users deleted!")
        
        print("Enabling foreign key checks...")
        await db.execute(text("SET session_replication_role = DEFAULT"))
        await db.commit()
        
        print("Done!")
    except Exception as e:
        print(f"ERROR: {e}")
        await db.rollback()
        await db.execute(text("SET session_replication_role = DEFAULT"))
        await db.commit()
    finally:
        await db.close()

async def list_remaining_users():
    db = AsyncSessionLocal()
    result = await db.execute(text("SELECT id, email, role, status, created_at FROM users ORDER BY created_at DESC"))
    users = result.fetchall()
    print(f"\nTotal remaining users: {len(users)}")
    for u in users:
        print(f"  {u.email}")
    await db.close()

asyncio.run(delete_test_users_final())
list_remaining_users()
