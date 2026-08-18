import asyncio
import sys
sys.path.insert(0, '.')

async def test_register():
    from app.database import get_db
    from app.services.auth_service import AuthService
    from app.schemas.auth import RegisterRequest

    try:
        request = RegisterRequest(
            company_name="Test Company",
            email="test123@test.com",
            password="StrongPass@123",
            phone="9876543210",
            gstin="22AAAAA0000A1Z5",
            otp_code="115230"  # 🔥 REQUIRED in practice
        )

        async for db in get_db():
            await AuthService.register(request, db)
            print("REGISTER DATA:", request.dict())
            break

    except Exception as e:
        print(f"ERROR: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_register())
