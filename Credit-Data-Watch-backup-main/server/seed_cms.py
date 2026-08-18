import asyncio
import uuid
import sys
import os

# Ensure app can be imported
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__))))

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
from datetime import datetime, timezone

from app.config import settings
from app.models import CMSPage, CMSSection

# Database Setup
engine = create_async_engine(settings.DATABASE_URL)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

OFFERING_CONTENT = {
    "title": "Our Offerings",
    "subtitle": "Choose the right plan for your business",
    "plans": [
        {
            "name": "Base",
            "price": "₹500",
            "description": "Entry-level plan for small businesses.",
            "features": [
                "Validity: 1 Month",
                "Legal Assistance: NO",
                "Reminder Follow-ups: Yes",
                "CIR Generation Fee: Included"
            ]
        },
        {
            "name": "Royal",
            "price": "₹1,000",
            "description": "For growing businesses.",
            "features": [
                "Validity: 6 Months",
                "Legal Assistance: 5 Incidents",
                "Reminder Follow-ups: Yes",
                "CIR Generation Fee: Included"
            ]
        },
        {
            "name": "Groups",
            "price": "₹2,000",
            "description": "For organizations with multiple entities.",
            "features": [
                "Validity: 1 Year",
                "Legal Assistance: 20 Incidents",
                "Reminder Follow-ups: Yes",
                "CIR Generation Fee: Included"
            ]
        },
        {
            "name": "Enterprise",
            "price": "₹1,00,000",
            "description": "Maximum protection and support.",
            "features": [
                "Validity: 1 Year",
                "Legal Assistance: 100 Incidents",
                "Reminder Follow-ups: Yes",
                "CIR Generation Fee: Included"
            ]
        }
    ]
}

async def seed():
    async with AsyncSessionLocal() as db:
        print("Checking for existing 'offerings' page...")
        result = await db.execute(select(CMSPage).where(CMSPage.slug == "offerings"))
        page = result.scalars().first()
        
        if not page:
            print("Creating 'offerings' page...")
            now_naive = datetime.now(timezone.utc).replace(tzinfo=None)
            page = CMSPage(
                id=str(uuid.uuid4()),
                slug="offerings",
                title="Offerings",
                is_published=True,
                created_at=now_naive,
                updated_at=now_naive
            )
            db.add(page)
            await db.commit()
            await db.refresh(page)
            print(f"Page created with ID: {page.id}")
        else:
            print(f"Page already exists: {page.id}")
            
        # Check for section
        print("Checking for pricing_table section...")
        result = await db.execute(select(CMSSection).where(CMSSection.page_id == page.id, CMSSection.type == "pricing_table"))
        section = result.scalars().first()
        
        if not section:
            print("Creating pricing_table section...")
            now_naive = datetime.now(timezone.utc).replace(tzinfo=None)
            section = CMSSection(
                id=str(uuid.uuid4()),
                page_id=page.id,
                type="pricing_table",
                order_index=0,
                is_visible=True,
                content=OFFERING_CONTENT,
                created_at=now_naive,
                updated_at=now_naive
            )
            db.add(section)
            await db.commit()
            print("Section created.")
        else:
            print("Section already exists. Updating content...")
            section.content = OFFERING_CONTENT
            await db.commit()
            print("Section updated.")
            
    await engine.dispose()

import traceback

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    try:
        print(f"Using DB URL: {settings.DATABASE_URL.split('@')[-1]}") # Print host/db only
        asyncio.run(seed())
    except Exception:
        traceback.print_exc()
