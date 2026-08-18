import asyncio
import sys
import os

# Add the server directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.database import AsyncSessionLocal
from sqlalchemy import text

async def find_all_fks():
    db = AsyncSessionLocal()
    try:
        # Query to find all foreign keys referencing the users table
        query = """
        SELECT
            tc.table_name,
            kcu.column_name
        FROM
            information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
        WHERE
            tc.constraint_type = 'FOREIGN KEY' AND
            ccu.table_name = 'users';
        """
        result = await db.execute(text(query))
        fks = result.fetchall()
        print("All tables/columns with foreign keys to users table:")
        for table, column in fks:
            print(f"  - {table}.{column}")

        # Now check how many records each of these has for test users
        test_user_ids = [
            "c4ec40de-3b0c-4477-8c98-3d9c87a05a2a",
            "9c2c27bf-8184-4256-b723-09749628cbfc",
            "40223a0e-5722-4d56-94e5-0b727507a1de",
            "258ee3d6-3b9a-4919-9477-7efc93cb745e",
            "5fbf58c1-3296-4160-849c-80d2f80a5a58",
            "42b000e2-920b-4da9-859e-5aa74b8d3f78",
            "2cc16a5e-1f5c-4c8f-97b7-249d73c44495",
            "5ee1592c-99c4-44c7-9d2e-0509479ba625",
            "42b56437-371d-4f20-97e5-e4ceddd46d3c",
            "9be5ac5f-def0-452d-b748-8d36b28eb895",
            "00abdc8c-c8b1-48ee-bdd4-41ed71ddd5dc",
            "1c4ca498-d367-4e41-96d0-7af0238bb998"
        ]
        print("\nChecking which tables have test user records:")
        for table, column in fks:
            try:
                check_query = text(f"SELECT COUNT(*) FROM {table} WHERE {column} = ANY(:user_ids)")
                result = await db.execute(check_query, {"user_ids": test_user_ids})
                count = result.scalar()
                if count > 0:
                    print(f"  {table}.{column}: {count} records")
            except Exception as e:
                pass
    except Exception as e:
        print(f"Error: {e}")
    finally:
        await db.close()

asyncio.run(find_all_fks())
