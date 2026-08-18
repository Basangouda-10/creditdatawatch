import asyncio
from app.services.otp_service import OTPService


async def main():
    print("=== TESTING OTP SERVICE ===")

    email = "shindepayal296@gmail.com"

    print("Sending OTP...")
    response = await OTPService.send_otp(email)
    print("Send OTP Response:", response)

    otp = response["otp_code"]

    print(f"Verifying OTP {otp}...")
    verified = OTPService.verify_otp(email, otp)
    print("OTP verification result:", verified)

    print("\nSending password reset OTP...")
    reset_response = await OTPService.send_otp_for_password_reset(email)
    print("Password reset response:", reset_response)


if __name__ == "__main__":
    asyncio.run(main())
