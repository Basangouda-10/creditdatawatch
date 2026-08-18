import sys, os
sys.path.insert(0, '.')
from app.services.legal_notice_service import generate_legal_notice_pdf

os.makedirs('uploads/temp', exist_ok=True)
pdf_path = 'uploads/temp/test_legal.pdf'

po_data = {
    'vendor': 'Test Vendor',
    'po_number': 'PO-TEST-001', 
    'amount': 9999,
    'due_date': '2026-03-13',
    'company_name': 'Test Company'
}

result = generate_legal_notice_pdf(po_data, pdf_path)
print(f"PDF path: {result}")
print(f"File exists: {os.path.exists(pdf_path)}")
if os.path.exists(pdf_path):
    print(f"File size: {os.path.getsize(pdf_path)} bytes")
