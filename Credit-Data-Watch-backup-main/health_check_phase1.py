import asyncio
import asyncpg
import requests
import json
import sys
import os

async def check_db_tables():
    print('=== TASK 1.1: ALL TABLES ===')
    try:
        conn = await asyncpg.connect('postgresql://postgres:2004@localhost:5432/creditdatawatch')
        tables = await conn.fetch("""
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        """)
        for t in tables:
            print(f" - {t['table_name']}")
        await conn.close()
    except Exception as e:
        print(f"Error: {e}")

async def check_users():
    print('\n=== TASK 1.2: ALL USERS ===')
    try:
        conn = await asyncpg.connect('postgresql://postgres:2004@localhost:5432/creditdatawatch')
        users = await conn.fetch('SELECT email, role, is_active, status, subscription_status FROM users')
        for u in users:
            print(dict(u))
        await conn.close()
    except Exception as e:
        print(f"Error: {e}")

def check_backend():
    print('\n=== TASK 1.3: BACKEND HEALTH ===')
    try:
        r = requests.get('http://localhost:8000/api/v1/health')
        print(f"Backend health: {r.status_code} {r.text[:100]}")
    except Exception as e:
        print(f"Error: {e}")

def check_api_routes():
    print('\n=== TASK 1.5: API ROUTES ===')
    try:
        r = requests.get('http://localhost:8000/openapi.json')
        data = r.json()
        paths = list(data.get('paths', {}).keys())
        print(f"Total routes: {len(paths)}")
        for p in sorted(paths):
            print(f"  {p}")
    except Exception as e:
        print(f"Error: {e}")

async def main():
    await check_db_tables()
    await check_users()
    check_backend()
    check_api_routes()

if __name__ == "__main__":
    asyncio.run(main())
