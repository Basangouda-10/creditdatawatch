
import asyncio
from sqlalchemy import text
from app.database import engine

async def check_audit_logs_columns():
    async with engine.connect() as conn:
        dburl = str(engine.url)
        if dburl.startswith("sqlite"):
            result = await conn.execute(text("PRAGMA table_info(audit_logs)"))
            columns = [row[1] for row in result.all()]
        else:
            result = await conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'audit_logs'"))
            columns = [row[0] for row in result.all()]
        print(f"Audit logs columns: {columns}")

if __name__ == "__main__":
    asyncio.run(check_audit_logs_columns())
