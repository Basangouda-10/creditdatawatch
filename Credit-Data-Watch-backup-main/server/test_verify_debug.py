import asyncio
import traceback
from app.database import AsyncSessionLocal
from app.services.payment_service import PaymentService
from sqlalchemy import select
from app.models import Payment

async def debug_verify():
    async with AsyncSessionLocal() as db:
        try:
            stmt = select(Payment).order_by(Payment.created_at.desc())
            res = await db.execute(stmt)
            payment = res.scalars().first()
            
            if not payment:
                print("❌ No payments found in database.")
                return
                
            print(f"🔍 Testing verification for Payment ID: {payment.id}")
            
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
    asyncio.run(debug_verify())