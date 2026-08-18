from fastapi import APIRouter, HTTPException, Depends
from typing import Annotated
from app.utils import ResponseFormatter
from app.database import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.schemas import ChatRequest
from app.models import SOPDocument
import httpx
from app.config import settings

router = APIRouter()

@router.post("/chat")
async def chat(
    db: Annotated[AsyncSession, Depends(get_db)],
    req: ChatRequest
):
    message = req.message
    
    try:
        context = ""
        try:
            result = await db.execute(
                select(SOPDocument)
                .order_by(SOPDocument.uploaded_at.desc())
                .limit(1)
            )
            sop = result.scalar_one_or_none()
            if sop:
                context = f"Here is the SOP document for reference:\n{sop.content}\n\n"
        except Exception as e:
            print(f"Error fetching SOP: {str(e)}")
            pass

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{settings.OLLAMA_BASE_URL}/api/generate",
                json={
                    "model": "llama3",
                    "prompt": f"You are a helpful credit assistant for CreditDataWatch. Answer the user's questions clearly, directly, and concisely using the information from the SOP document. Do not mention sections, guides, or 'according to' anything. Just give the answer. {context}\n\nUser: {message}",
                    "stream": False,
                    "options": {
                        "temperature": 0.7,
                        "top_p": 0.9
                    }
                },
                timeout=120.0
            )
            
            if response.status_code == 200:
                ai_response = response.json().get("response", "")
                return ResponseFormatter.create_success(data={"reply": ai_response})
            else:
                print(f"Ollama returned status code: {response.status_code}")
                print(f"Ollama response: {response.text}")
                return ResponseFormatter.create_success(data={"reply": "I am having trouble connecting to my AI core right now. Please try again later."})
                
    except httpx.ConnectError:
        print("Ollama connection error: Ollama is not running")
        return ResponseFormatter.create_success(data={"reply": "Ollama is not running. Please start Ollama on localhost:11434 to enable AI chat."})
    except httpx.TimeoutException:
        print("Ollama timeout error")
        return ResponseFormatter.create_success(data={"reply": "The AI is taking too long to respond. Please try again."})
    except Exception as e:
        import traceback
        error_msg = traceback.format_exc()
        print("Chat error:")
        print(error_msg)
        return ResponseFormatter.create_success(data={"reply": "An unexpected error occurred in the chat system. Please try again later."})
