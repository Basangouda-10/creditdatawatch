import asyncio
from datetime import datetime
from datetime import timezone, timedelta, timezone
from uuid import uuid4
from sqlalchemy import select
import os, sys
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
SERVER_ROOT = os.path.dirname(os.path.dirname(CURRENT_DIR))
if SERVER_ROOT not in sys.path:
    sys.path.insert(0, SERVER_ROOT)
from app.database import AsyncSessionLocal
from app.models import Company, User, PurchaseOrder, CompanyCredibilityIndex
from app.services.credibility_service import CredibilityService


async def create_company(session, name, domain, gstin):
    existing = await session.execute(select(Company).where(Company.gstin == gstin))
    comp = existing.scalars().first()
    if comp:
        return comp
    comp = Company(id=str(uuid4()), company_name=name, vendor_gstin=gstin, domain_name=domain, is_verified=True)
    session.add(comp)
    await session.flush()
    return comp


async def create_user(session, comp, email):
    existing = await session.execute(select(User).where(User.email == email))
    u = existing.scalars().first()
    if u:
        return u
    u = User(
        id=str(uuid4()),
        company_id=comp.id,
        name=comp.company_name,
        email=email,
        password_hash='x',
        role='USER',
        status='ACTIVE',
        phone='',
        vendor_gstin=comp.gstin,
        company_name=comp.company_name,
        is_active=True,
    )
    session.add(u)
    await session.flush()
    return u


async def add_po(session, user, number, days_offset, status='Open'):
    due = datetime.now(timezone.utc) + timedelta(days=days_offset)
    po = PurchaseOrder(
        id=str(uuid4()),
        user_id=user.id,
        number=number,
        vendor_name='Vendor',
        vendor_vendor_gstin='27BBBBB0000B1Z5',
        amount=1000.0,
        due_date=due,
        status=status,
    )
    session.add(po)
    await session.flush()
    return po


async def run():
    # Ensure tables exist
    from app.database import engine, Base
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async with AsyncSessionLocal() as session:
        # Scenario A: Perfect Company
        compA = await create_company(session, 'Perfect Co', 'perfect.com', '27AAAAA0000A1Z5')
        userA = await create_user(session, compA, 'user@perfect.com')
        for i in range(10):
            await add_po(session, userA, f'PA-{i+1}', days_offset=30, status='Closed')

        # Scenario B: Risky Company
        compB = await create_company(session, 'Risky Co', 'risky.com', '27BBBBB0000B1Z5')
        userB = await create_user(session, compB, 'user@risky.com')
        for i in range(2):
            await add_po(session, userB, f'RB-ONT-{i+1}', days_offset=10, status='Closed')
        for i in range(3):
            await add_po(session, userB, f'RB-LATE-{i+1}', days_offset=-5, status='Open')
        for i in range(5):
            await add_po(session, userB, f'RB-UNP-{i+1}', days_offset=-10, status='Open')

        # Scenario C: No POs
        compC = await create_company(session, 'Empty Co', 'empty.com', '27CCCCC0000C1Z5')
        await create_user(session, compC, 'user@empty.com')

        await session.commit()

        # Recalculate
        await CredibilityService.recalc_all(session)
        await session.commit()

        # Print results
        for comp in [compA, compB, compC]:
            res = await session.execute(select(CompanyCredibilityIndex).where(CompanyCredibilityIndex.company_id == comp.id))
            idx = res.scalars().first()
            print('company=', comp.company_name, 'score=', getattr(idx, 'score', None), 'grade=', getattr(idx, 'grade', None), 'risk=', getattr(idx, 'risk_level', None), 'metrics=', {
                'total_pos': getattr(idx, 'total_pos', None),
                'paid_on_time': getattr(idx, 'paid_on_time', None),
                'paid_late': getattr(idx, 'paid_late', None),
                'unpaid': getattr(idx, 'unpaid', None),
                'overdue_count': getattr(idx, 'overdue_count', None),
                'avg_delay_days': getattr(idx, 'avg_delay_days', None),
                'max_delay_days': getattr(idx, 'max_delay_days', None),
            })


if __name__ == '__main__':
    asyncio.run(run())
