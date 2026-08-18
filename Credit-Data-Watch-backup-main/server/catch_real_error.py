import asyncio
import traceback
from app.database import AsyncSessionLocal
from app.models import Payment
from sqlalchemy import select
from app.services.payment_service import PaymentService

async def find_real_error():
    async with AsyncSessionLocal() as db:
        # Get the most recent payment regardless of status
        stmt = select(Payment).order_by(Payment.created_at.desc())
        res = await db.execute(stmt)
        payment = res.scalars().first()

        if not payment:
            print("❌ No payments found in the database. Please submit a payment proof in your browser first.")
            return

        print(f"🔍 Testing verification for Payment ID: {payment.id} (Current status: '{payment.status}')")
        
        # Reset status to PENDING to test the full verification workflow
        payment.status = "PENDING"
        await db.flush()

        try:
            await PaymentService.verify_payment(
                payment_id=payment.id,
                transaction_id="123456789012",
                db=db
            )
            await db.commit()
            print("✅ Verification succeeded!")
        except Exception as e:
            await db.rollback()
            print("\n" + "="*50)
            print("🔥 EXACT UNDERLYING ROOT CAUSE EXCEPTION 🔥")
            print("="*50)
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(find_real_error())