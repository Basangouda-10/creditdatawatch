import asyncio
import sys
import os

# Add the server directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.database import AsyncSessionLocal
from sqlalchemy import text

# Test user IDs (extracted from list_users output)
TEST_USER_IDS = [
    "c4ec40de-3b0c-4477-8c98-3d9c87a05a2a",  # client@test.com
    "9c2c27bf-8184-4256-b723-09749628cbfc",  # test.user.1779003979@creditwatch.test
    "40223a0e-5722-4d56-94e5-0b727507a1de",  # test_238657@example.com
    "258ee3d6-3b9a-4919-9477-7efc93cb745e",  # test.user.1779003322@creditwatch.test
    "5fbf58c1-3296-4160-849c-80d2f80a5a58",  # test.user.1778663157@creditwatch.test
    "42b000e2-920b-4da9-859e-5aa74b8d3f78",  # test.user.1778662893@creditwatch.test
    "2cc16a5e-1f5c-4c8f-97b7-249d73c44495",  # testuser123@example.com
    "5ee1592c-99c4-44c7-9d2e-0509479ba625",  # legal@test.com
    "42b56437-371d-4f20-97e5-e4ceddd46d3c",  # fin@test.com
    "9be5ac5f-def0-452d-b748-8d36b28eb895",  # ops@test.com
    "00abdc8c-c8b1-48ee-bdd4-41ed71ddd5dc",  # user@test.com
    "1c4ca498-d367-4e41-96d0-7af0238bb998"   # internal_c42f6e@example.com
]

# All tables with foreign keys to users.id (and their column names)
FK_TABLES = [
    ("subscriptions", "user_id"),
    ("business_profiles", "user_id"),
    ("purchase_orders", "user_id"),
    ("defaulter_cases", "user_id"),
    ("credit_reports", "user_id"),
    ("settlements", "user_id"),
    ("wallets", "user_id"),
    ("payments", "user_id"),
    ("user_settings", "user_id"),
    ("invoices", "user_id"),
    ("appointments", "user_id"),
    ("purchase_order_audit_logs", "performed_by_user_id"),
    ("notifications", "user_id"),
    ("scheduled_reminders", "user_id"),
    ("business_requests", "user_id"),
    ("business_requests", "analyzed_by"),
    ("support_requests", "user_id"),
    ("support_requests", "resolved_by"),
    ("notifications_v2", "user_id"),
    ("user_activity_logs", "user_id"),
    ("audit_logs", "user_id"),
    ("invitations", "invited_by")
]

async def delete_single_user(user_id):
    """Delete a single user and all their related records"""
    db = None
    try:
        db = AsyncSessionLocal()
        # Delete related records from all FK tables
        for table, column in FK_TABLES:
            try:
                await db.execute(text(f"DELETE FROM {table} WHERE {column} = :user_id"), {"user_id": user_id})
            except Exception as e:
                # Rollback just this failed statement's transaction
                await db.rollback()
        
        # Now delete the user
        await db.execute(text("DELETE FROM users WHERE id = :user_id"), {"user_id": user_id})
        await db.commit()
        print(f"[OK] Deleted user {user_id}")
        return True
    except Exception as e:
        print(f"[ERROR] Deleting {user_id}: {str(e)[:100]}")
        try:
            await db.rollback()
        except:
            pass
        return False
    finally:
        if db:
            await db.close()

async def delete_test_users():
    # Delete each user one by one
    for user_id in TEST_USER_IDS:
        await delete_single_user(user_id)

    # Now list remaining users
    db = AsyncSessionLocal()
    print("\n[OK] Final Remaining users:")
    result = await db.execute(text("SELECT id, email, role, status, created_at FROM users ORDER BY created_at DESC"))
    users = result.fetchall()
    print(f"\nTotal users: {len(users)}\n")
    for u in users:
        print(f"  Email: {u.email:40} | Role: {u.role:15} | Status: {u.status} | Created: {str(u.created_at)[:19]}")
    await db.close()

asyncio.run(delete_test_users())
