import sqlite3
import asyncio
import os, sys
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import select

# Ensure app package is importable
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from app.config import settings
from app.models import PurchaseOrder, User, Company, Invitation

SQLITE_PATH = "test.db"

async def migrate():
    src = sqlite3.connect(SQLITE_PATH)
    src.row_factory = sqlite3.Row
    cur = src.cursor()
    cur.execute("""
        SELECT id, company_id, user_id, po_number, vendor, gstin, vendor_email, vendor_phone,
               amount, due_date, status, archived, document_url, notes,
               supplier_address, delivery_address, invoice_address,
               payment_completed_at, created_at, updated_at
        FROM purchase_orders
    """)
    rows = cur.fetchall()

    engine = create_async_engine(settings.DATABASE_URL, future=True)
    SessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    migrated = 0
    async with SessionLocal() as session:
        for r in rows:
            # Skip if already exists by id
            existing = await session.execute(select(PurchaseOrder).where(PurchaseOrder.id == r["id"]))
            if existing.scalars().first():
                continue
            po = PurchaseOrder(
                id=r["id"],
                company_id=r["company_id"],
                user_id=r["user_id"],
                po_number=r["po_number"],
                vendor=r["vendor"],
                gstin=r["gstin"],
                vendor_email=r["vendor_email"],
                vendor_phone=r["vendor_phone"],
                amount=r["amount"],
                due_date=r["due_date"],
                status=r["status"],
                archived=bool(r["archived"]),
                document_url=r["document_url"],
                notes=r["notes"],
                supplier_address=r["supplier_address"],
                delivery_address=r["delivery_address"],
                invoice_address=r["invoice_address"],
                payment_completed_at=r["payment_completed_at"],
                created_at=r["created_at"],
                updated_at=r["updated_at"],
            )
            session.add(po)
            try:
                await session.commit()
                migrated += 1
            except Exception:
                await session.rollback()

        # Migrate companies
        cur.execute("SELECT * FROM companies")
        comp_rows = cur.fetchall()
        for c in comp_rows:
            existing = await session.execute(select(Company).where(Company.id == c["id"]))
            if existing.scalars().first():
                continue
            company = Company(
                id=c["id"],
                company_name=c["company_name"],
                gstin=c["gstin"],
                domain_name=c["domain_name"],
                is_verified=bool(c["is_verified"]),
                created_at=c["created_at"],
                updated_at=c["updated_at"],
            )
            session.add(company)
            try:
                await session.commit()
            except Exception:
                await session.rollback()

        # Migrate users
        cur.execute("SELECT * FROM users")
        user_rows = cur.fetchall()
        for u in user_rows:
            existing = await session.execute(select(User).where(User.id == u["id"]))
            if existing.scalars().first():
                continue
            user = User(
                id=u["id"],
                company_id=u["company_id"],
                name=u["name"],
                email=u["email"],
                password_hash=u["password_hash"],
                role=u["role"],
                status=u["status"],
                phone=u["phone"],
                gstin=u["gstin"],
                company_name=u["company_name"],
                is_active=bool(u["is_active"]),
                subscription_bypass=bool(u["subscription_bypass"]) if "subscription_bypass" in u.keys() else False,
                full_access=bool(u["full_access"]) if "full_access" in u.keys() else False,
                subscription_status=u["subscription_status"] if "subscription_status" in u.keys() else "INACTIVE",
                created_at=u["created_at"],
                updated_at=u["updated_at"],
            )
            session.add(user)
            try:
                await session.commit()
            except Exception:
                await session.rollback()

        # Migrate invitations if present
        try:
            cur.execute("SELECT * FROM invitations")
            inv_rows = cur.fetchall()
            for inv in inv_rows:
                existing = await session.execute(select(Invitation).where(Invitation.id == inv["id"]))
                if existing.scalars().first():
                    continue
                invitation = Invitation(
                    id=inv["id"],
                    company_id=inv["company_id"],
                    email=inv["email"],
                    status=inv["status"],
                    created_at=inv["created_at"],
                    updated_at=inv["updated_at"],
                )
                session.add(invitation)
                try:
                    await session.commit()
                except Exception:
                    await session.rollback()
        except Exception:
            pass
        await engine.dispose()

    print(f"Migrated {migrated} purchase_orders rows from SQLite to PostgreSQL")

if __name__ == "__main__":
    asyncio.run(migrate())
