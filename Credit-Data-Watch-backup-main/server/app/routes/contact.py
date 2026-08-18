from fastapi import APIRouter, Depends
from typing import Annotated
from pydantic import BaseModel, EmailStr
from app.dependencies import get_current_user
from app.models import User
from app.utils.response import ResponseFormatter
from app.services.email_service import EmailService

router = APIRouter(prefix="/contact", tags=["Contact"])


class ContactRequest(BaseModel):
    """Contact form submission"""
    name: str
    email: EmailStr
    message: str


@router.post("")
async def submit_contact_form(
    data: ContactRequest,
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Submit contact form"""
    # In production, send email to support team
    # For now, just acknowledge receipt
    
    # Optionally send confirmation email to user
    # await EmailService.send_email(
    #     to=data.email,
    #     subject="Contact Form Received",
    #     body=f"Thank you for contacting us. We will respond shortly.\n\nYour message:\n{data.message}"
    # )
    
    return ResponseFormatter.create_success(
        message="Contact form submitted successfully. We will get back to you soon."
    )


@router.post("/public")
async def submit_public_contact_form(data: ContactRequest):
    """Submit contact form (public endpoint, no auth required)"""
    # In production, send email to support team
    # For now, just acknowledge receipt
    
    return ResponseFormatter.create_success(
        message="Thank you for contacting us. We will respond within 24 hours."
    )
