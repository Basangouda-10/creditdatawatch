
import asyncio
import asyncpg
from datetime import datetime

print("=" * 60)
print("CHECKING SUBSCRIPTION ACCESS FOR USERS")
print("=" * 60)

async def check():
    try:
        conn = await asyncpg.connect('postgresql://postgres:2004@localhost:5432/creditdatawatch')
        
        users = await conn.fetch("""
            SELECT id, email, role, is_active, status, 
                   subscription_status, subscription_bypass, full_access, 
                   name, company_name
            FROM users 
            ORDER BY role, email
        """)
        
        print(f"\nTotal users in DB: {len(users)}\n")
        
        # Let's activate all users with subscription_bypass=true and full_access=true
        target_email = "payalshinde906@gmail.com"
        
        await conn.execute("""
            UPDATE users 
            SET subscription_status='ACTIVE', subscription_bypass=true, full_access=true 
            WHERE email=$1
        """, target_email)
        
        print(f"\nUpdated {target_email} to have subscription_bypass=true and full_access=true!")
        
        # Show updated user
        updated_user = await conn.fetchrow("SELECT * FROM users WHERE email=$1", target_email)
        if updated_user:
            print(f"\nUpdated user details:")
            print(f"  email: {updated_user['email']}")
            print(f"  role: {updated_user['role']}")
            print(f"  subscription_status: {updated_user['subscription_status']}")
            print(f"  subscription_bypass: {updated_user['subscription_bypass']}")
            print(f"  full_access: {updated_user['full_access']}")
            print(f"  is_active: {updated_user['is_active']}")
        
        # Also activate other test users
        test_emails = [
            "user@test.com",
            "testuser@example.com",
            "shindepayal295@gmail.com"
        ]
        
        for email in test_emails:
            await conn.execute("""
                UPDATE users 
                SET subscription_status='ACTIVE', subscription_bypass=true, full_access=true 
                WHERE email=$1
            """, email)
            print(f"\nUpdated {email} too!")
        
        await conn.close()
        
        print("\n" + "=" * 60)
        print("DONE!")
        print("=" * 60)
        print("\nNow refresh the page and PO Management should work perfectly!")
        
    except Exception as e:
        print(f"DB Error: {e}")
        import traceback
        traceback.print_exc()

asyncio.run(check())
