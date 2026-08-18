import asyncio
from sqlalchemy import text
from app.database import engine

async def forward_subscription():
    async with engine.begin() as conn:
        # Update user status to PENDING_MASTER
        await conn.execute(text("""
            UPDATE users 
            SET subscription_status = 'PENDING_MASTER' 
            WHERE email = 'basangoudahadimani2000@gmail.com';
        """))

        # Update workflow_items if present
        await conn.execute(text("""
            UPDATE workflow_items 
            SET status = 'PENDING_MASTER', 
                review_notes = 'Payment verified by Financial team' 
            WHERE requested_by_email = 'basangoudahadimani2000@gmail.com' 
               OR entity_id IN (SELECT id FROM users WHERE email = 'basangoudahadimani2000@gmail.com');
        """))

        # Update subscription_requests table if present
        try:
            await conn.execute(text("""
                UPDATE subscription_requests 
                SET status = 'PENDING_MASTER' 
                WHERE user_email = 'basangoudahadimani2000@gmail.com';
            """))
        except Exception as e:
            print(f"Notice: {e}")

    print("✅ Successfully forwarded 'tcs' subscription to Master Admin!")

if __name__ == "__main__":
    asyncio.run(forward_subscription())