# run_once_seed_plans.py - run this once to populate plans
import asyncio
from app.database import AsyncSessionLocal
from app.models import Plan  # adjust import path if needed
from uuid import uuid4
from datetime import datetime

async def seed_plans():
    async with AsyncSessionLocal() as db:
        from sqlalchemy import select
        existing = await db.execute(select(Plan))
        if existing.scalars().first():
            print("Plans already exist, skipping seed")
            return

        plans = [
            Plan(
                id='base',
                name='base',
                display_name='Base',
                price=500,
                duration_type='monthly',  # adjust to match your enum
                is_active=True,
            ),
            Plan(
                id='royal',
                name='royal',
                display_name='Royal',
                price=1000,
                duration_type='half_yearly',
                is_active=True,
            ),
            Plan(
                id='groups',
                name='groups',
                display_name='Groups',
                price=2000,
                duration_type='yearly',
                is_active=True,
            ),
            Plan(
                id='enterprise',
                name='enterprise',
                display_name='Enterprise',
                price=100000,
                duration_type='yearly',
                is_active=True,
            ),
        ]

        for plan in plans:
            db.add(plan)

        await db.commit()
        print("✅ Plans seeded successfully")

asyncio.run(seed_plans())