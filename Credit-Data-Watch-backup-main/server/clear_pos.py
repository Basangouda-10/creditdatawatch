import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text

DATABASE_URL = "postgresql+asyncpg://postgres:2004@localhost:5432/creditdatawatch"

async def clear_pos():
    engine = create_async_engine(DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        # Clear dependent tables first due to foreign key constraints
        await session.execute(text("DELETE FROM purchase_order_audit_logs"))
        await session.execute(text("DELETE FROM scheduled_reminders"))
        await session.execute(text("UPDATE notifications SET related_po_id = NULL"))
        
        # Now delete from purchase_orders
        result = await session.execute(text("DELETE FROM purchase_orders"))
        await session.commit()
        print(f"Deleted {result.rowcount} purchase orders successfully.")
    
    await engine.dispose()

asyncio.run(clear_pos())
