"""
Payment service for handling payment transactions
"""
from uuid import uuid4
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from typing import Optional, Dict, Any, Tuple
from app.models import Payment, Plan, User, PaymentStatus, PaymentMethod
from app.exceptions import PlanNotFound, UserNotFound
from app.services.subscription_service import SubscriptionService
import logging
import secrets
import string

logger = logging.getLogger(__name__)


def generate_reference_id() -> str:
    """Generate unique reference ID for payment"""
    chars = string.ascii_uppercase + string.digits
    return f"REF{''.join(secrets.choice(chars) for _ in range(10))}"


def generate_transaction_id() -> str:
    """Generate transaction ID (simulated gateway ID)"""
    chars = string.ascii_uppercase + string.digits
    return f"TXN{''.join(secrets.choice(chars) for _ in range(12))}"


class PaymentService:
    """Handle payment processing and verification"""

    @staticmethod
    async def initiate_payment(
        user_id: str,
        plan_id: str,
        payment_method: str,
        db: AsyncSession
    ) -> Tuple[Payment, Dict[str, Any]]:
        """
        Initiate payment for a plan
        
        Args:
            user_id: User ID
            plan_id: Plan ID to purchase
            payment_method: Payment method (upi, credit_card, etc.)
            db: Database session
            
        Returns:
            Tuple of (Payment object, payment_options dict)
            
        Raises:
            UserNotFound: If user doesn't exist
            PlanNotFound: If plan doesn't exist or is inactive
        """
        # Verify user exists
        user_stmt = select(User).where(User.id == user_id)
        user_result = await db.execute(user_stmt)
        user = user_result.scalars().first()
        
        if not user:
            raise UserNotFound()
        
        # Flexible plan lookup (matches ID, uppercase ID, name, or display_name)
        plan_query = str(plan_id or "").strip()
        plan_stmt = select(Plan).where(
            or_(
                Plan.id == plan_query,
                Plan.id == plan_query.upper(),
                Plan.name == plan_query.upper(),
                Plan.display_name == plan_query
            ) & (Plan.is_active == True)
        )
        plan_result = await db.execute(plan_stmt)
        plan = plan_result.scalars().first()
        
        # Auto-seed standard plan into DB if missing during initial setup
        if not plan:
            upper_plan = plan_query.upper()
            DEFAULT_PRICES = {
                "BASE": 500,
                "ROYAL": 1000,
                "GROUPS": 2000,
                "ENTERPRISE": 100000
            }
            if upper_plan in DEFAULT_PRICES:
                now_naive = datetime.now(timezone.utc).replace(tzinfo=None)
                plan = Plan(
                    id=upper_plan,
                    name=upper_plan,
                    display_name=f"{upper_plan.capitalize()} Plan",
                    price=DEFAULT_PRICES[upper_plan],
                    validity_days=30 if upper_plan == "BASE" else (180 if upper_plan == "ROYAL" else 365),
                    is_active=True,
                    created_at=now_naive,
                    updated_at=now_naive
                )
                db.add(plan)
                await db.flush()
            else:
                raise PlanNotFound()
        
        # Cancel any pending payments for this user
        pending_stmt = select(Payment).where(
            (Payment.user_id == user_id) &
            (Payment.status == PaymentStatus.PENDING)
        )
        pending_result = await db.execute(pending_stmt)
        pending_payments = pending_result.scalars().all()
        
        now_naive = datetime.now(timezone.utc).replace(tzinfo=None)
        for payment in pending_payments:
            payment.status = PaymentStatus.CANCELLED
            payment.updated_at = now_naive
        
        # Safe PaymentMethod enum parsing
        method_str = payment_method.value if hasattr(payment_method, 'value') else str(payment_method).lower()
        try:
            enum_method = PaymentMethod(method_str)
        except ValueError:
            enum_method = getattr(PaymentMethod, 'QR_CODE', list(PaymentMethod)[0])

        reference_id = generate_reference_id()
        
        payment = Payment(
            id=str(uuid4()),
            user_id=user_id,
            plan_id=plan.id,
            amount=plan.price,
            currency="INR",
            payment_method=enum_method,
            payment_provider=None,
            status=PaymentStatus.PENDING,
            reference_id=reference_id,
            payment_metadata={},
            initiated_at=now_naive,
            created_at=now_naive,
            updated_at=now_naive,
        )
        
        db.add(payment)
        await db.flush()
        
        # Generate payment options based on method
        payment_options = PaymentService._generate_payment_options(
            method_str, payment.reference_id, plan.price
        )
        
        logger.info(
            f"Payment initiated: user_id={user_id}, plan_id={plan.id}, "
            f"payment_id={payment.id}, reference_id={reference_id}"
        )
        
        return payment, payment_options

    @staticmethod
    def _generate_payment_options(
        payment_method: str,
        reference_id: str,
        amount: float
    ) -> Dict[str, Any]:
        options = {}
        method_norm = payment_method.lower()
        
        if method_norm in ["upi", "qr_code"]:
            upi_id = "payalshinde906@okicici"
            upi_string = f"upi://pay?pa={upi_id}&pn=CreditDataWatch&am={amount}&cu=INR&tn={reference_id}"
            qr_code_url = f"https://api.qrserver.com/v1/create-qr-code/?size=300x300&data={upi_string}"
            
            options["upi"] = {
                "qr_code_url": qr_code_url,
                "upi_id": upi_id,
                "upi_string": upi_string,
                "instructions": "Scan QR code or send money to UPI ID",
                "amount": amount,
                "reference_id": reference_id
            }
        
        if method_norm in ["credit_card", "debit_card", "card"]:
            options["card"] = {
                "gateway_url": "https://checkout.razorpay.com/v1/checkout.js",
                "order_id": f"order_{reference_id}",
                "amount": amount,
                "currency": "INR",
                "instructions": "Enter your card details",
                "supported_cards": ["Visa", "Mastercard", "RuPay"]
            }
        
        if method_norm == "net_banking":
            options["net_banking"] = {
                "gateway_url": "https://checkout.razorpay.com/v1/checkout.js",
                "order_id": f"order_{reference_id}",
                "banks": ["HDFC Bank", "ICICI Bank", "State Bank of India", "Axis Bank", "Kotak Mahindra Bank"],
                "amount": amount,
                "currency": "INR",
                "instructions": "Select your bank and complete payment"
            }
        
        return options

    @staticmethod
    async def verify_payment(
        payment_id: str,
        transaction_id: str,
        gateway_order_id: Optional[str] = None,
        gateway_payment_id: Optional[str] = None,
        db: AsyncSession = None
    ) -> Tuple[Payment, Optional[Any]]:
        payment_stmt = select(Payment).where(Payment.id == payment_id)
        payment_result = await db.execute(payment_stmt)
        payment = payment_result.scalars().first()
        
        if not payment:
            raise UserNotFound()
        
        if payment.status == PaymentStatus.SUCCESS:
            logger.warning(f"Payment {payment_id} already verified")
            subscription = await SubscriptionService.get_active_subscription(
                payment.user_id, db
            )
            return payment, subscription
        
        now_naive = datetime.now(timezone.utc).replace(tzinfo=None)
        payment.status = PaymentStatus.SUCCESS
        payment.transaction_id = transaction_id
        payment.gateway_order_id = gateway_order_id
        payment.gateway_payment_id = gateway_payment_id
        payment.completed_at = now_naive
        payment.updated_at = now_naive
        
        await db.flush()
        
        from app.services.workflow_service import WorkflowService
        from app.models import User, Plan, Company
        
        user_stmt = select(User).where(User.id == payment.user_id)
        user_res = await db.execute(user_stmt)
        user = user_res.scalars().first()
        
        plan_stmt = select(Plan).where(Plan.id == payment.plan_id)
        plan_res = await db.execute(plan_stmt)
        plan = plan_res.scalars().first()
        
        company_name = "Unknown Company"
        if user and user.company_id:
            comp_stmt = select(Company.company_name).where(Company.id == user.company_id)
            comp_res = await db.execute(comp_stmt)
            company_name = comp_res.scalar() or "Unknown Company"
        elif user:
            company_name = user.company_name or "Unknown Company"

        try:
            sub_id = await WorkflowService.start_subscription(
                db=db,
                user_id=payment.user_id,
                user_email=user.email if user else "unknown",
                company_name=company_name,
                plan_name=plan.display_name if plan else payment.plan_id,
                amount=payment.amount
            )
            logger.info(
                f"Subscription workflow started after payment: payment_id={payment_id}, "
                f"subscription_request_id={sub_id}"
            )
        except Exception as e:
            logger.error(f"Failed to start subscription workflow after payment: {e}", exc_info=True)
            raise
        
        return payment, None

    @staticmethod
    async def get_payment_status(
        payment_id: str,
        db: AsyncSession
    ) -> Optional[Payment]:
        payment_stmt = select(Payment).where(Payment.id == payment_id)
        payment_result = await db.execute(payment_stmt)
        return payment_result.scalars().first()

    @staticmethod
    async def get_user_payment_history(
        user_id: str,
        limit: int = 50,
        offset: int = 0,
        db: AsyncSession = None
    ) -> list[Payment]:
        stmt = (
            select(Payment)
            .where(Payment.user_id == user_id)
            .order_by(Payment.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())

    @staticmethod
    async def cancel_payment(
        payment_id: str,
        user_id: str,
        db: AsyncSession
    ) -> Payment:
        payment_stmt = select(Payment).where(
            (Payment.id == payment_id) &
            (Payment.user_id == user_id)
        )
        payment_result = await db.execute(payment_stmt)
        payment = payment_result.scalars().first()
        
        if not payment:
            raise UserNotFound()
        
        if payment.status != PaymentStatus.PENDING:
            raise ValueError(f"Cannot cancel payment with status: {payment.status}")
        
        now_naive = datetime.now(timezone.utc).replace(tzinfo=None)
        payment.status = PaymentStatus.CANCELLED
        payment.updated_at = now_naive
        
        await db.flush()
        
        logger.info(f"Payment cancelled: payment_id={payment_id}")
        
        return payment