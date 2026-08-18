import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import AsyncSessionLocal
from app.routes.core import sync_vendor_credibility
from app.models import PurchaseOrder, User
from sqlalchemy import select
import uuid
from datetime import datetime
from datetime import timezone, timezone

async def test_sync():
    async with AsyncSessionLocal() as db:
        try:
            # 1. Get a user to associate with the PO
            result = await db.execute(select(User).limit(1))
            user = result.scalars().first()
            if not user:
                print("No user found in database")
                return

            print(f"Using user: {user.email}")

            # 2. Create a test PO
            po_id = str(uuid.uuid4())
            vendor_name = "Ollama Test Vendor"
            po = PurchaseOrder(
                id=po_id,
                user_id=user.id,
                company_id=user.company_id,
                po_number=f"PO-SYNC-{datetime.now().strftime('%H%M%S')}",
                vendor=vendor_name,
                gstin="22AAAAD0000A1Z5",
                amount=7500.0,
                due_date=datetime.now(timezone.utc),
                status="open",
                created_at=datetime.now(timezone.utc)
            )
            db.add(po)
            await db.commit()
            print(f"Created PO: {po.po_number}")

            # 3. Trigger the sync logic
            print(f"Triggering sync for vendor: {vendor_name}")
            await sync_vendor_credibility(vendor_name, db, user)
            
            print("Sync trigger completed.")

        except Exception as e:
            print(f"Error during test: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_sync())
