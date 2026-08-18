
import asyncio
import asyncpg

async def main():
    conn = await asyncpg.connect('postgresql://postgres:2004@localhost:5432/creditdatawatch')
    print("=== ALL USERS ===")
    users = await conn.fetch('SELECT id, email, role, name, phone, gstin, company_name FROM users')
    for user in users:
        print(f"\nUser: {user['email']}")
        print(f"  Role: {user['role']}")
        print(f"  Name: {user['name']}")
        print(f"  Phone: {user['phone']}")
        print(f"  GSTIN: {user['gstin']}")
        print(f"  Company: {user['company_name']}")
    await conn.close()

if __name__ == "__main__":
    asyncio.run(main())
