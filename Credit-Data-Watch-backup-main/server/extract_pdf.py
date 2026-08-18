
import pypdf
import os

pdf_path = r"a:\programming\credit-data-watch\CreditDataWatch (2).pdf"

if not os.path.exists(pdf_path):
    print(f"Error: File not found at {pdf_path}")
    exit(1)

try:
    reader = pypdf.PdfReader(pdf_path)
    print(f"Total Pages: {len(reader.pages)}")
    
    print(f"Total Pages: {len(reader.pages)}")
    
    with open("pdf_full_content.txt", "w", encoding="utf-8") as f:
        for i, page in enumerate(reader.pages):
            f.write(f"\n--- Page {i+1} ---\n")
            try:
                text = page.extract_text()
                f.write(text)
            except Exception as e:
                f.write(f"[Error extracting page {i+1}: {e}]")
    
    print("Extraction complete. check pdf_full_content.txt")
            

except Exception as e:
    print(f"Error reading PDF: {e}")
