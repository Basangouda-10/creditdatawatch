
import os
import sys
import uuid
import asyncio
from dotenv import load_dotenv

# Add server directory
server_dir = os.path.join(os.path.dirname(__file__), 'server')
sys.path.insert(0, server_dir)

# Load env
load_dotenv(os.path.join(server_dir, '.env'))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.database import Base
from app.models import User, PurchaseOrder
from app.config import settings

# Create engine and session
engine = create_async_engine(settings.DATABASE_URL, echo=True)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def test_po_creation():
    print("=== Test Direct PO Creation ===")
    
    async with AsyncSessionLocal() as db:
        # Get test user
        user_res = await db.execute(User.__table__.select().where(User.email == "master.test@creditwatch.com"))
        user = user_res.fetchone()
        if not user:
            print("ERROR: Test user not found")
            return
        
        user_id, company_id = user.id, user.company_id
        print(f"Test user found: id={user_id}, company={company_id}")
        
        # Create PO object
        po_number = f"DIRECT-TEST-{uuid.uuid4().hex[:8]}"
        po = PurchaseOrder(
            id=str(uuid.uuid4()),
            user_id=user_id,
            company_id=company_id,
            po_number=po_number,
            vendor="Test Vendor Direct",
            gstin="27AAACR1234A1Z1",
            amount=2500.00,
            due_date="2026-07-15",
            status="Open"
        )
        print(f"Created PO object: {po.po_number}, id={po.id}")
        
        # Try adding and committing
        try:
            db.add(po)
            await db.commit()
            print("✅ Added and committed PO successfully!")
            await db.refresh(po)
            print(f"Refreshed PO: {po.id}")
        except Exception as e:
            print("❌ ERROR adding PO to DB:")
            print(f"  Type: {type(e).__name__}")
            print(f"  Message: {str(e)}")
            import traceback
            print("  Stack:")
            traceback.print_exc()
            await db.rollback()
            return
        
        print("\n=== PO Creation SUCCESS ===")
        
        await db.close()

if __name__ == "__main__":
    asyncio.run(test_po_creation())
