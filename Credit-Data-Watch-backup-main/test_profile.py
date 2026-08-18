
import asyncio
import sys
from pathlib import Path

# Add server dir to path
server_dir = Path(__file__).parent / "server"
sys.path.insert(0, str(server_dir))

from app.database import AsyncSessionLocal
from app.models import User
from app.schemas.user import UserProfileResponse
from sqlalchemy import select

async def main():
    async with AsyncSessionLocal() as session:
        stmt = select(User).where(User.email == 'payalshinde906@gmail.com')
        result = await session.execute(stmt)
        user = result.scalars().first()
        
        if user:
            print("User found! Testing model_validate...")
            print(f"user.role: {user.role}, type: {type(user.role)}")
            
            try:
                profile = UserProfileResponse.model_validate(user)
                print("SUCCESS! profile:")
                print(profile.model_dump())
            except Exception as e:
                print("ERROR model_validate:")
                print(f"Type: {type(e)}")
                print(f"Message: {e}")
                import traceback
                print("Stack trace:")
                print(traceback.format_exc())

if __name__ == "__main__":
    asyncio.run(main())
