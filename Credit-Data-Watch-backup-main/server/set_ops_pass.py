import asyncio
from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models import User
from passlib.context import CryptContext

# Match backend password context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def force_set_password():
    email = "ops@test.com"
    raw_password = "Password@123"
    
    async with AsyncSessionLocal() as db:
        stmt = select(User).where(User.email == email)
        res = await db.execute(stmt)
        user = res.scalars().first()

        if not user:
            print(f"❌ User {email} not found! Let's check existing users in DB...")
            stmt_all = select(User)
            res_all = await db.execute(stmt_all)
            users = res_all.scalars().all()
            for u in users:
                print(f" - Found user: {u.email} | Role: {u.role} | GSTIN: {u.gstin}")
            return

        user.password_hash = pwd_context.hash(raw_password)
        user.is_active = True
        user.status = "ACTIVE"
        await db.commit()
        
        print("\n" + "="*50)
        print("✅ SUCCESS! Log in with these credentials:")
        print(f"📧 Work Email: {email}")
        print(f"🔑 Password:   {raw_password}")
        print(f"🏢 GSTIN:      {user.gstin}")
        print("="*50)

if __name__ == "__main__":
    asyncio.run(force_set_password())