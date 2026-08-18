
import asyncio
import sys
from pathlib import Path
from datetime import datetime, timedelta, timezone
import uuid

# Add server dir to path
server_dir = Path(__file__).parent / "server"
sys.path.insert(0, str(server_dir))

from app.database import AsyncSessionLocal
from app.models import User, Invitation
from sqlalchemy import select

async def main():
    async with AsyncSessionLocal() as session:
        # Get user
        stmt = select(User).where(User.email == 'payalshinde906@gmail.com')
        result = await session.execute(stmt)
        user = result.scalars().first()
        
        if not user:
            print("User not found")
            return
        
        print(f"Got user: {user.email}, company_id: {user.company_id}")
        
        # Now let's manually test the list_invitations code
        print("\n--- Testing list_invitations logic ---")
        try:
            stmt = select(Invitation).where(Invitation.company_id == user.company_id).order_by(Invitation.created_at.desc())
            result = await session.execute(stmt)
            invitations = result.scalars().all()
            
            print(f"Found {len(invitations)} invitations")
            for inv in invitations:
                print(f"  - {inv.email}, status: {inv.status}")
                
            # Now test converting to dict
            data = []
            for inv in invitations:
                inv_dict = {
                    "id": inv.id,
                    "email": inv.email,
                    "role": inv.role,
                    "token": inv.token,
                    "expires_at": inv.expires_at.isoformat() if inv.expires_at else None,
                    "status": inv.status,
                    "created_at": inv.created_at.isoformat() if inv.created_at else None
                }
                print(f"  Invite dict: {inv_dict}")
                data.append(inv_dict)
            
            print("✅ list_invitations logic works!")
            
        except Exception as e:
            print("❌ ERROR in list_invitations logic:")
            print(f"Type: {type(e)}")
            print(f"Message: {e}")
            import traceback
            print("Stack trace:")
            print(traceback.format_exc())

if __name__ == "__main__":
    asyncio.run(main())
