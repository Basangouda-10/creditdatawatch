"""
Test database connection
"""

from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
from typing import Optional
import os
from dotenv import load_dotenv
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine

# Load environment variables from .env if present
# Prefer server/.env when running tests from project root
load_dotenv(dotenv_path=os.path.join(os.getcwd(), ".env"))


def get_database_url() -> str:
    db_url = os.getenv("DATABASE_URL")

    if not db_url:
        raise RuntimeError("DATABASE_URL environment variable not set")

    return db_url


def create_db_engine() -> Engine:
    """
    Always returns a valid SQLAlchemy Engine
    or raises an exception.
    """
    database_url = get_database_url()
    if "+aiosqlite" in database_url:
        if database_url.startswith("sqlite+aiosqlite:///"):
            database_url = "sqlite:///" + database_url.split("sqlite+aiosqlite:///", 1)[1]
        else:
            database_url = database_url.replace("+aiosqlite", "")
    return create_engine(database_url, pool_pre_ping=True)


def test_connection() -> None:
    db_url = get_database_url()
    if "+asyncpg" in db_url:
        async_engine = create_async_engine(db_url, pool_pre_ping=True)
        async def _run():
            async with async_engine.connect() as connection:
                result = await connection.execute(text("SELECT 1"))
                value = result.scalar()
                if value is None:
                    raise RuntimeError("Database returned no result")
                print("✅ Database connection successful")
                print("Result:", value)
        asyncio.run(_run())
    else:
        engine: Engine = create_db_engine()
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1")).fetchone()
            if result is None:
                raise RuntimeError("Database returned no result")
            print("✅ Database connection successful")
            print("Result:", result[0])


if __name__ == "__main__":
    test_connection()
