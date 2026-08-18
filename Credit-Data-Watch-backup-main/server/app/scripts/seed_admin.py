"""
Seed initial admin user into database
"""
import asyncio
import uuid
from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models import User
from app.config import settings
from app.utils import hash_password, format_phone_e164, is_valid_gstin, is_valid_phone
import logging

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


async def seed_admin():
    """Create initial admin user if admin credentials are configured"""
    
    # Check if admin credentials are provided
    if not all([settings.ADMIN_GSTIN, settings.ADMIN_EMAIL, settings.ADMIN_PASSWORD]):
        print("⚠ Admin credentials not configured in .env. Skipping admin seeding.")
        print("To seed admin, set ADMIN_GSTIN, ADMIN_EMAIL, ADMIN_PASSWORD in .env")
        return
    
    # Validate GSTIN and phone
    if not is_valid_gstin(settings.ADMIN_GSTIN):
        print(f"✗ Invalid GSTIN: {settings.ADMIN_GSTIN}")
        return
    
    if not is_valid_phone(settings.ADMIN_PHONE):
        print(f"✗ Invalid phone number: {settings.ADMIN_PHONE}")
        return
    
    phone_e164 = format_phone_e164(settings.ADMIN_PHONE)
    
    async with AsyncSessionLocal() as session:
        try:
            # Check if admin already exists
            stmt = select(User).where(
                User.gstin == settings.ADMIN_GSTIN.upper()
            )
            result = await session.execute(stmt)
            existing = result.scalars().first()
            
            if existing:
                print(f"✓ Admin user already exists: {existing.email}")
                updated = False
                if existing.role != "MASTER_ADMIN":
                    existing.role = "MASTER_ADMIN"
                    updated = True
                # Update password if provided
                try:
                    new_hash = hash_password(settings.ADMIN_PASSWORD)
                    if existing.password_hash != new_hash:
                        existing.password_hash = new_hash
                        updated = True
                except Exception:
                    pass
                # Update phone/company if provided
                if settings.ADMIN_PHONE and existing.phone != phone_e164:
                    existing.phone = phone_e164
                    updated = True
                if settings.ADMIN_COMPANY_NAME and existing.company_name != settings.ADMIN_COMPANY_NAME:
                    existing.company_name = settings.ADMIN_COMPANY_NAME
                    updated = True
                if updated:
                    await session.commit()
                    print("✓ Existing admin details updated")
                return
            
            # Create admin user
            admin_user = User(
                id=str(uuid.uuid4()),
                gstin=settings.ADMIN_GSTIN.upper(),
                company_name=settings.ADMIN_COMPANY_NAME or "Admin",
                email=settings.ADMIN_EMAIL.lower(),
                phone=phone_e164,
                password_hash=hash_password(settings.ADMIN_PASSWORD),
                is_active=True,
                role="MASTER_ADMIN",
            )
            
            session.add(admin_user)
            await session.commit()
            
            print(f"✓ Admin user created successfully:")
            print(f"  - GSTIN: {admin_user.gstin}")
            print(f"  - Email: {admin_user.email}")
            print(f"  - Company: {admin_user.company_name}")
            print(f"  - Phone: {admin_user.phone}")
            print(f"  - Role: {admin_user.role}")
            
        except Exception as e:
            await session.rollback()
            print(f"✗ Error seeding admin: {e}")
            import traceback
            traceback.print_exc()
            raise


if __name__ == "__main__":
    asyncio.run(seed_admin())
