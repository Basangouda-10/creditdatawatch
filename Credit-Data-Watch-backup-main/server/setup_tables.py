import asyncio
from app.database import engine
from app.models import Base

async def init_models():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✅ All missing database tables created in creditdatawatch!")

if __name__ == "__main__":
    asyncio.run(init_models())