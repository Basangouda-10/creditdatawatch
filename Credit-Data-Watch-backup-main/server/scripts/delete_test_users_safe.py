import asyncio
import sys
import os

# Add the server directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.database import AsyncSessionLocal
from sqlalchemy import text

# Test user IDs
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

async def delete_from_table(table, column):
    db = AsyncSessionLocal()
    try:
        await db.execute(text(f"DELETE FROM {table} WHERE {column} = ANY(:user_ids)"), {"user_ids": TEST_USER_IDS})
        await db.commit()
        print(f"OK: Deleted from {table}.{column}")
    except Exception as e:
        print(f"SKIP: Could not delete from {table}.{column}: {str(e)[:100]}")
        await db.rollback()
    finally:
        await db.close()

async def delete_users():
    db = AsyncSessionLocal()
    try:
        await db.execute(text("DELETE FROM users WHERE id = ANY(:user_ids)"), {"user_ids": TEST_USER_IDS})
        await db.commit()
        print("OK: Deleted all test users!")
    except Exception as e:
        print(f"ERROR: Could not delete users: {str(e)[:100]}")
        await db.rollback()
    finally:
        await db.close()

async def list_remaining_users():
    db = AsyncSessionLocal()
    result = await db.execute(text("SELECT id, email, role, status, created_at FROM users ORDER BY created_at DESC"))
    users = result.fetchall()
    print(f"\nTotal remaining users: {len(users)}\n")
    for u in users:
        print(f"  Email: {u.email:40} | Role: {u.role:15} | Status: {u.status}")
    await db.close()

async def main():
    for table, column in FK_TABLES:
        await delete_from_table(table, column)
    await delete_users()
    await list_remaining_users()

asyncio.run(main())
