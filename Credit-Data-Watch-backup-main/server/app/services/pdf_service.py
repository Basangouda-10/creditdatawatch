import PyPDF2 
import io 
 
class PDFService: 
    @staticmethod 
    def extract_text(pdf_bytes: bytes) -> str: 
        try: 
            reader = PyPDF2.PdfReader( 
                io.BytesIO(pdf_bytes) 
            ) 
            text = "" 
            for page in reader.pages: 
                extracted = page.extract_text() 
                if extracted: 
                    text += extracted + "\n" 
            return text.strip() 
        except Exception as e: 
            return f"Error extracting PDF: {str(e)}" 
