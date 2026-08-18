from docx import Document
import sys
import os

def extract_to_file(files, output_path):
    with open(output_path, 'w', encoding='utf-8') as f:
        for path in files:
            f.write(f"--- START {os.path.basename(path)} ---\n")
            try:
                doc = Document(path)
                for para in doc.paragraphs:
                    if para.text.strip():
                        f.write(para.text.strip() + "\n\n")
            except Exception as e:
                f.write(f"Error reading {path}: {e}\n")
            f.write(f"--- END {os.path.basename(path)} ---\n\n")

if __name__ == "__main__":
    files = [
        r"a:\programming\credit-data-watch\Your Privacy Rights.docx",
        r"a:\programming\credit-data-watch\Usage Policy.docx"
    ]
    extract_to_file(files, "legal_content.txt")
