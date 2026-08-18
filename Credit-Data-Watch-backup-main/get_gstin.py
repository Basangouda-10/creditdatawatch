
import asyncio
import sys
from pathlib import Path

# Add server dir to path
server_dir = Path(__file__).parent / "server"
sys.path.insert(0, str(server_dir))

from app.database import AsyncSessionLocal
from app.models import User
from sqlalchemy import select

async def main():
    async with AsyncSessionLocal() as session:
        stmt = select(User).where(User.email == 'payalshinde906@gmail.com')
        result = await session.execute(stmt)
        user = result.scalars().first()
        if user:
            print("User found!")
            print("  Email:", user.email)
            print("  GSTIN:", user.gstin)
            print("  Company ID:", user.company_id)
            print("  Role:", user.role)
        else:
            print("User not found!")

if __name__ == "__main__":
    asyncio.run(main())
