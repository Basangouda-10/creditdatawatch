from pdf2image import convert_from_path
import os

pdf_path = "uploads/flow.pdf"
output_dir = "uploads"

try:
    # Convert PDF to images (first page)
    images = convert_from_path(pdf_path)
    if images:
        # Save first page as flow.png
        output_path = os.path.join(output_dir, "flow.png")
        images[0].save(output_path, "PNG")
        print(f"Success! Image saved to: {output_path}")
    else:
        print("No pages found in PDF")
except Exception as e:
    print(f"Error converting PDF: {e}")
