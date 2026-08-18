"""
Subscription service for plan purchases and management
"""
from uuid import uuid4
from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models import Subscription, Plan, User, MembershipStatus
from app.exceptions import PlanNotFound, UserNotFound, InvalidPlanId
from app.utils.response import ResponseFormatter
import logging

logger = logging.getLogger(__name__)


class SubscriptionService:
    """Handle subscription purchases, renewals, and expiry logic"""

    @staticmethod
    async def get_active_subscription(user_id: str, db: AsyncSession) -> Subscription | None:
        """
        Get user's active subscription
        
        Args:
            user_id: User ID
            db: Database session
            
        Returns:
            Active subscription or None if no active subscription
        """
        stmt = (
            select(Subscription)
            .where(
                (Subscription.user_id == user_id) &
                (Subscription.is_active == True)
            )
            .order_by(Subscription.start_date.desc())
        )
        result = await db.execute(stmt)
        return result.scalars().first()

    @staticmethod
    async def is_subscription_valid(subscription: Subscription) -> bool:
        """
        Check if subscription is still valid (not expired)
        
        Args:
            subscription: Subscription object
            
        Returns:
            True if valid, False if expired
        """
        if not subscription:
            return False
        
        if not subscription.is_active:
            return False
        
        if subscription.expiry_date and subscription.expiry_date < datetime.now(timezone.utc):
            return False
        
        return True

    @staticmethod
    async def purchase_subscription(
        user_id: str, 
        plan_id: str, 
        db: AsyncSession,
        payment_proof_url: str = None,
        payment_id: str = None
    ) -> Subscription:
        """
        Purchase a subscription plan
        
        Args:
            user_id: User ID
            plan_id: Plan ID to purchase
            db: Database session
            payment_proof_url: URL of payment screenshot
            payment_id: ID of the payment record
            
        Returns:
            New subscription object
            
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
        
        # Verify plan exists and is active
        plan_stmt = select(Plan).where(
            (Plan.id == plan_id) & 
            (Plan.is_active == True)
        )
        plan_result = await db.execute(plan_stmt)
        plan = plan_result.scalars().first()
        
        if not plan:
            raise PlanNotFound()
        
        # Deactivate any existing active subscriptions
        active_stmt = (
            select(Subscription)
            .where(
                (Subscription.user_id == user_id) &
                (Subscription.is_active == True)
            )
        )
        active_result = await db.execute(active_stmt)
        active_subs = active_result.scalars().all()
        
        for sub in active_subs:
            sub.is_active = False
            sub.status = MembershipStatus.EXPIRED
            sub.updated_at = datetime.now(timezone.utc)
        
        # Create new subscription in PENDING status
        now = datetime.now(timezone.utc)
        
        new_subscription = Subscription(
            id=str(uuid4()),
            user_id=user_id,
            plan_id=plan_id,
            status=MembershipStatus.PENDING,
            is_active=False,
            start_date=now,
            expiry_date=now + timedelta(days=plan.validity_days),
            payment_proof_url=payment_proof_url,
            payment_id=payment_id,
            created_at=now,
            updated_at=now,
        )
        
        db.add(new_subscription)
        await db.flush()
        
        logger.info(
            f"New PENDING subscription created: user_id={user_id}, plan_id={plan_id}"
        )
        
        return new_subscription

    @staticmethod
    async def process_workflow(
        subscription_id: str,
        action: str,
        admin_id: str,
        db: AsyncSession,
        notes: str = None
    ) -> Subscription:
        """Handle subscription workflow (VERIFY, PROCESS, APPROVE, REJECT)"""
        stmt = select(Subscription).where(Subscription.id == subscription_id)
        result = await db.execute(stmt)
        sub = result.scalars().first()
        
        if not sub:
            raise HTTPException(status_code=404, detail="Subscription not found")

        now = datetime.now(timezone.utc)
        
        if action == "VERIFY":
            if sub.status != MembershipStatus.PENDING:
                raise HTTPException(status_code=400, detail=f"Cannot verify from {sub.status}")
            sub.status = "VERIFIED"
            sub.verified_by = admin_id
        
        elif action == "PROCESS":
            if sub.status != "VERIFIED":
                raise HTTPException(status_code=400, detail=f"Cannot process from {sub.status}")
            sub.status = "PROCESSED"
            sub.processed_by = admin_id
            
        elif action == "APPROVE":
            if sub.status != "PROCESSED":
                raise HTTPException(status_code=400, detail=f"Cannot approve from {sub.status}")
            
            # Fetch plan for validity days
            plan_stmt = select(Plan).where(Plan.id == sub.plan_id)
            plan_res = await db.execute(plan_stmt)
            plan = plan_res.scalars().first()
            
            sub.status = MembershipStatus.ACTIVE
            sub.is_active = True
            sub.approved_by = admin_id
            sub.start_date = now
            sub.expiry_date = now + timedelta(days=plan.validity_days)
            
            # Update user's subscription status
            user_stmt = select(User).where(User.id == sub.user_id)
            user_res = await db.execute(user_stmt)
            user = user_res.scalars().first()
            if user:
                user.subscription_status = "ACTIVE"
        
        elif action == "REJECT":
            sub.status = MembershipStatus.REJECTED
            sub.is_active = False
            sub.approved_by = admin_id
            
            # Update user's subscription status
            user_stmt = select(User).where(User.id == sub.user_id)
            user_res = await db.execute(user_stmt)
            user = user_res.scalars().first()
            if user:
                user.subscription_status = "INACTIVE"

        sub.updated_at = now
        await db.flush()
        return sub

    @staticmethod
    async def renew_subscription(
        subscription_id: str,
        db: AsyncSession
    ) -> Subscription:
        """
        Renew an existing subscription for another period
        
        Args:
            subscription_id: Subscription ID to renew
            db: Database session
            
        Returns:
            Renewed subscription object
        """
        # Get current subscription with plan
        stmt = (
            select(Subscription)
            .where(Subscription.id == subscription_id)
        )
        result = await db.execute(stmt)
        subscription = result.scalars().first()
        
        if not subscription:
            raise UserNotFound()
        
        # Calculate new expiry date
        now = datetime.now(timezone.utc)
        new_expiry = now + timedelta(days=subscription.plan.validity_days)
        
        subscription.expiry_date = new_expiry
        subscription.is_active = True
        subscription.updated_at = now
        
        logger.info(
            f"Subscription renewed: subscription_id={subscription_id}, new_expiry={new_expiry}"
        )
        
        return subscription

    @staticmethod
    async def get_subscription_details(subscription_id: str, db: AsyncSession) -> Subscription:
        """
        Get subscription details with plan info
        
        Args:
            subscription_id: Subscription ID
            db: Database session
            
        Returns:
            Subscription with related plan
        """
        stmt = select(Subscription).where(Subscription.id == subscription_id)
        result = await db.execute(stmt)
        subscription = result.scalars().first()
        
        if not subscription:
            raise UserNotFound()
        
        return subscription

    @staticmethod
    async def upload_payment_proof(subscription_id: str, proof_url: str, db: AsyncSession) -> Subscription:
        """Upload payment proof for a pending subscription"""
        subscription = await SubscriptionService.get_subscription_details(subscription_id, db)
        subscription.payment_proof_url = proof_url
        subscription.updated_at = datetime.now(timezone.utc)
        await db.flush()
        return subscription

    @staticmethod
    async def verify_payment(subscription_id: str, financial_user_id: str, db: AsyncSession) -> Subscription:
        """FINANCIAL role verifies the payment"""
        subscription = await SubscriptionService.get_subscription_details(subscription_id, db)
        if subscription.status != MembershipStatus.PENDING:
            raise HTTPException(status_code=400, detail=f"Cannot verify subscription in status {subscription.status}")
        
        subscription.status = MembershipStatus.VERIFIED
        subscription.verified_by = financial_user_id
        subscription.updated_at = datetime.now(timezone.utc)
        await db.flush()
        return subscription

    @staticmethod
    async def process_request(subscription_id: str, operation_user_id: str, db: AsyncSession) -> Subscription:
        """OPERATION role processes the request"""
        subscription = await SubscriptionService.get_subscription_details(subscription_id, db)
        if subscription.status != MembershipStatus.VERIFIED:
            raise HTTPException(status_code=400, detail=f"Cannot process subscription in status {subscription.status}")
        
        subscription.status = MembershipStatus.PROCESSED
        subscription.processed_by = operation_user_id
        subscription.updated_at = datetime.now(timezone.utc)
        await db.flush()
        return subscription

    @staticmethod
    async def approve_subscription(subscription_id: str, admin_user_id: str, db: AsyncSession) -> Subscription:
        """MASTER_ADMIN role approves the subscription and activates it"""
        # We need the plan to calculate expiry
        stmt = select(Subscription).where(Subscription.id == subscription_id)
        result = await db.execute(stmt)
        subscription = result.scalars().first()
        
        if not subscription:
            raise UserNotFound()
            
        if subscription.status != MembershipStatus.PROCESSED:
            raise HTTPException(status_code=400, detail=f"Cannot approve subscription in status {subscription.status}")
        
        # Load plan
        plan_stmt = select(Plan).where(Plan.id == subscription.plan_id)
        plan_res = await db.execute(plan_stmt)
        plan = plan_res.scalars().first()
        
        now = datetime.now(timezone.utc)
        subscription.status = MembershipStatus.APPROVED
        subscription.approved_by = admin_user_id
        subscription.is_active = True
        subscription.start_date = now
        subscription.expiry_date = now + timedelta(days=plan.validity_days)
        subscription.updated_at = now
        
        # Also update user's subscription_status field (if it exists and is used)
        user_stmt = select(User).where(User.id == subscription.user_id)
        user_res = await db.execute(user_stmt)
        user = user_res.scalars().first()
        if user:
            user.subscription_status = "ACTIVE"
            
        await db.flush()
        return subscription

    @staticmethod
    async def reject_subscription(subscription_id: str, reason: str, admin_user_id: str, db: AsyncSession) -> Subscription:
        """Reject a subscription request"""
        subscription = await SubscriptionService.get_subscription_details(subscription_id, db)
        subscription.status = MembershipStatus.REJECTED
        subscription.is_active = False
        subscription.updated_at = datetime.now(timezone.utc)
        # You might want to store the reason in a notes field if added to the model
        await db.flush()
        return subscription
