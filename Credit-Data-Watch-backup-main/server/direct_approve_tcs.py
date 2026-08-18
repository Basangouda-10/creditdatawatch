import asyncio
from sqlalchemy import text
from app.database import engine

async def approve_tcs_directly():
    async with engine.begin() as conn:
        # 1. Set tcs user subscription status to ACTIVE and enable access
        await conn.execute(text("""
            UPDATE users 
            SET subscription_status = 'ACTIVE',
                subscription_bypass = true,
                full_access = true,
                is_active = true
            WHERE email = 'basangoudahadimani2000@gmail.com';
        """))

        # 2. Mark any related workflow item as APPROVED
        await conn.execute(text("""
            UPDATE workflow_items 
            SET status = 'APPROVED',
                review_notes = 'Final Approved by Master Admin'
            WHERE requested_by_email = 'basangoudahadimani2000@gmail.com'
               OR entity_id IN (SELECT id FROM users WHERE email = 'basangoudahadimani2000@gmail.com');
        """))

        # 3. Mark subscription record as ACTIVE if present
        try:
            await conn.execute(text("""
                UPDATE subscriptions 
                SET status = 'ACTIVE', is_active = true 
                WHERE user_id IN (SELECT id FROM users WHERE email = 'basangoudahadimani2000@gmail.com');
            """))
        except Exception as e:
            print(f"Notice: {e}")

    print("\n" + "="*50)
    print("✅ SUCCESS! Subscription for 'tcs' (basangoudahadimani2000@gmail.com) is now fully ACTIVE!")
    print("="*50)

if __name__ == "__main__":
    asyncio.run(approve_tcs_directly())