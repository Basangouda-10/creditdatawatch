#!/usr/bin/env python3
"""
Unified setup script - Initialize database, seed plans and admin user
Run this after setting up database URL in .env
"""
import asyncio
import sys
from app.scripts import seed_plans, seed_admin


async def main():
    """Run all seeding operations"""
    print("=" * 60)
    print("CreditDataWatch - Database Initialization")
    print("=" * 60)
    print()
    
    try:
        print("Step 1: Seeding default plans...")
        print("-" * 60)
        await seed_plans()
        print()
        
        print("Step 2: Seeding admin user...")
        print("-" * 60)
        await seed_admin()
        print()
        
        print("=" * 60)
        print("✓ Setup complete!")
        print("=" * 60)
        print()
        print("Next steps:")
        print("1. Start the server: python -m uvicorn app.main:app --reload")
        print("2. Access API docs at: http://localhost:8000/docs")
        print("3. Login with admin credentials from .env")
        
    except Exception as e:
        print()
        print("=" * 60)
        print("✗ Setup failed!")
        print("=" * 60)
        print(f"Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
