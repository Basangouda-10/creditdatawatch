import asyncio
import asyncpg
from app.config import settings


async def main():
    # Parse database URL from app settings
    db_url = settings.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")
    
    # Split credentials to connect to default 'postgres' database
    base_url = db_url.rsplit("/", 1)[0]
    target_db = settings.DATABASE_URL.rsplit("/", 1)[-1]
    postgres_db_url = f"{base_url}/postgres"

    print(f"Connecting to PostgreSQL system database...")
    try:
        conn = await asyncpg.connect(postgres_db_url, statement_cache_size=0)
    except Exception as err:
        print(f"\nAuthentication Error: {err}")
        print("Please check DATABASE_URL in your server/.env file.")
        return

    try:
        print(f"Terminating active connections to '{target_db}'...")
        await conn.execute(
            f"""
            SELECT pg_terminate_backend(pid)
            FROM pg_stat_activity
            WHERE datname = '{target_db}' AND pid <> pg_backend_pid()
            """
        )

        print(f"Dropping database '{target_db}' if it exists...")
        await conn.execute(f"DROP DATABASE IF EXISTS {target_db};")

        print(f"Creating fresh database '{target_db}'...")
        await conn.execute(f"CREATE DATABASE {target_db};")
        print(f"Successfully reset database '{target_db}'!")

    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(main())