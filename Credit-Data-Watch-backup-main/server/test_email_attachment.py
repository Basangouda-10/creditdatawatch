import asyncio, sys, os
sys.path.insert(0, '.')
from app.services.legal_notice_service import generate_legal_notice_pdf
from app.services.email_service import send_email_with_attachment

async def test():
    os.makedirs('uploads/temp', exist_ok=True)
    pdf_path = 'uploads/temp/test_legal.pdf'
    
    po_data = {
        'vendor': 'Test Vendor',
        'po_number': 'PO-TEST-001', 
        'amount': 9999,
        'due_date': '2026-03-13',
        'company_name': 'Test Company'
    }
    
    generate_legal_notice_pdf(po_data, pdf_path)
    print(f"PDF exists: {os.path.exists(pdf_path)}")
    print(f"PDF size: {os.path.getsize(pdf_path)} bytes")
    
    success = await send_email_with_attachment(
        to_email='payalshinde906@gmail.com',
        subject='Test Legal Notice PDF',
        body='This is a test email. PDF should be attached.',
        attachment_path=pdf_path,
        attachment_name='Test_Legal_Notice.pdf'
    )
    if success:
        print("Email sent! Check inbox for PDF attachment.")
    else:
        print("Failed to send email.")

if __name__ == "__main__":
    asyncio.run(test())
