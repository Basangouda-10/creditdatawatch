from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.units import inch
from reportlab.lib import colors
from datetime import datetime
import os

def generate_legal_notice_pdf(po_data: dict, output_path: str, custom_text: str = None) -> str:
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        rightMargin=inch,
        leftMargin=inch,
        topMargin=inch,
        bottomMargin=inch
    )
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=16,
        spaceAfter=20,
        alignment=1,
        textColor=colors.black
    )
    body_style = ParagraphStyle(
        'CustomBody',
        parent=styles['Normal'],
        fontSize=11,
        spaceAfter=12,
        leading=18
    )
    
    vendor_name = po_data.get('vendor', 'Vendor')
    po_number = po_data.get('po_number', 'N/A')
    amount = po_data.get('amount', 0)
    due_date = po_data.get('due_date', 'N/A')
    company_name = po_data.get('company_name', 'Company')
    today = datetime.now().strftime('%d/%m/%Y')
    
    content = custom_text if custom_text else f"""To: {vendor_name}
RE: Outstanding Payment - PO {po_number}

Dear {vendor_name},

This is a formal legal notice that payment of Rs.{amount} for Purchase Order {po_number} due on {due_date} remains unpaid/pending.

You are required to clear this payment within 7 days of receiving this notice, failing which legal proceedings will be initiated without further notice.

Issued by: {company_name}
Date: {today}"""

    story = []
    story.append(Paragraph("LEGAL NOTICE", title_style))
    story.append(Spacer(1, 0.3 * inch))
    
    for line in content.strip().split('\n'):
        if line.strip():
            story.append(Paragraph(line.strip(), body_style))
        else:
            story.append(Spacer(1, 0.1 * inch))
    
    doc.build(story)
    print(f"[PDF] Legal notice PDF generated at: {output_path}")
    return output_path