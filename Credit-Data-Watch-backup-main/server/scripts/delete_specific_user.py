
import asyncio
import sys
import os

# Add the server directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.database import AsyncSessionLocal
from sqlalchemy import text

# All tables with foreign keys to users.id (and their column names)
FK_TABLES = [
    ("subscriptions", "user_id"),
    ("business_profiles", "user_id"),
    ("defaulter_cases", "user_id"),
    ("credit_reports", "user_id"),
    ("settlements", "user_id"),
    ("wallets", "user_id"),
    ("payments", "user_id"),
    ("user_settings", "user_id"),
    ("invoices", "user_id"),
    ("appointments", "user_id"),
    ("purchase_order_audit_logs", "performed_by_user_id"),
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
        # Delete ALL notifications to avoid any FK issues!
        try:
            await db.execute(text("DELETE FROM notifications"))
            await db.commit()
        except Exception:
            await db.rollback()
        
        # First, set any nullable FKs to NULL where this user is referenced
        null_updates = [
            ("purchase_orders", "approved_by"),
            ("subscriptions", "verified_by"),
            ("subscriptions", "processed_by"),
            ("subscriptions", "approved_by"),
            ("business_requests", "analyzed_by"),
            ("support_requests", "resolved_by")
        ]
        for table, column in null_updates:
            try:
                await db.begin_nested()
                await db.execute(text(f"UPDATE {table} SET {column} = NULL WHERE {column} = :user_id"), {"user_id": user_id})
            except Exception:
                await db.rollback()
        
        # Delete notifications first (user_id)
        try:
            await db.execute(text("DELETE FROM notifications WHERE user_id = :user_id"), {"user_id": user_id})
        except Exception:
            pass
        
        # Then delete purchase orders
        try:
            await db.execute(text("DELETE FROM purchase_orders WHERE user_id = :user_id"), {"user_id": user_id})
        except Exception:
            pass
        
        # Delete related records from all other FK tables
        for table, column in FK_TABLES:
            try:
                await db.begin_nested()
                await db.execute(text(f"DELETE FROM {table} WHERE {column} = :user_id"), {"user_id": user_id})
            except Exception:
                await db.rollback()
        
        # Now delete the user
        await db.execute(text("DELETE FROM users WHERE id = :user_id"), {"user_id": user_id})
        await db.commit()
        print(f"[OK] Deleted user {user_id}")
        return True
    except Exception as e:
        print(f"[ERROR] Deleting {user_id}: {str(e)}")
        try:
            await db.rollback()
        except:
            pass
        return False
    finally:
        if db:
            await db.close()

# Test User 123's ID is 2cc16a5e-1f5c-4c8f-97b7-249d73c44495
asyncio.run(delete_single_user("2cc16a5e-1f5c-4c8f-97b7-249d73c44495"))

