"""Seed default subscription plans into the database."""

import asyncio
import uuid
from datetime import datetime, timezone
from sqlalchemy import select
from app.database import AsyncSessionLocal, Base
from app.models import Plan


async def seed_plans():
    """Create default subscription plans if they don't exist."""
    
    # Define default plans
    default_plans = [
        {
            "name": "base",
            "display_name": "Base",
            "description": "Perfect for individuals starting their credit journey",
            "price": 0.0,
            "validity_days": 365,
            "follow_up_limit": 10,
            "legal_assistance_limit": 2,
            "is_active": True,
        },
        {
            "name": "royal",
            "display_name": "Royal",
            "description": "For growing businesses needing better credit management",
            "price": 4999.0,
            "validity_days": 365,
            "follow_up_limit": 20,
            "legal_assistance_limit": 5,
            "is_active": True,
        },
        {
            "name": "groups",
            "display_name": "Groups",
            "description": "For organizations and groups managing multiple entities",
            "price": 14999.0,
            "validity_days": 365,
            "follow_up_limit": 50,
            "legal_assistance_limit": 15,
            "is_active": True,
        },
        {
            "name": "enterprise",
            "display_name": "Enterprise",
            "description": "Custom solutions for large enterprises",
            "price": 0.0,  # Custom pricing
            "validity_days": 365,
            "follow_up_limit": 999,
            "legal_assistance_limit": 999,
            "is_active": True,
        },
    ]
    
    async with AsyncSessionLocal() as session:
        try:
            # Check if plans already exist
            result = await session.execute(select(Plan))
            existing_plans = result.scalars().all()
            
            if existing_plans:
                print(f"✓ Plans already exist ({len(existing_plans)} plans found)")
                return
            
            # Create new plans
            now = datetime.now(None)
            plans_to_create = [
                Plan(
                    id=str(uuid.uuid4()),
                    **plan,
                    created_at=now,
                    updated_at=now,
                )
                for plan in default_plans
            ]
            
            session.add_all(plans_to_create)
            await session.commit()
            
            print(f"✓ Successfully seeded {len(plans_to_create)} default plans:")
            for plan in plans_to_create:
                print(f"  - {plan.display_name} (₹{plan.price}, {plan.follow_up_limit} follow-ups)")
                
        except Exception as e:
            await session.rollback()
            print(f"✗ Error seeding plans: {e}")
            raise


if __name__ == "__main__":
    asyncio.run(seed_plans())
