import asyncio
from app.database import get_db
from app.services.credibility_service import CredibilityService

async def run():
    try:
        async for db in get_db():
            await CredibilityService.recalc_all(db)
            await db.commit()
            print('Recalculation Done!')
            break
    except Exception as e:
        import traceback
        print(f'Error: {e}')
        traceback.print_exc()

if __name__ == '__main__':
    asyncio.run(run())
