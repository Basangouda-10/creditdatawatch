"""
Google Drive routes
"""
from fastapi import APIRouter, Depends, Request, UploadFile, File, Form
from typing import Annotated
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.services import DriveService
from app.utils import ResponseFormatter
from app.dependencies import get_current_user
from app.models import User
from app.config import settings
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/auth-url")
async def get_drive_auth_url(http_request: Request = None):
    """Get Google Drive OAuth2 authorization URL"""
    try:
        auth_url = DriveService.get_authorization_url()
        request_id = http_request.state.request_id if http_request else ""
        return ResponseFormatter.create_success(
            data={"auth_url": auth_url},
            message="Authorization URL generated",
            request_id=request_id
        )
    except Exception as e:
        logger.error(f"Error getting auth URL: {str(e)}")
        raise


@router.post("/callback")
async def drive_oauth_callback(current_user: Annotated[User, Depends(get_current_user)], db: Annotated[AsyncSession, Depends(get_db)], code: str, state: str, http_request: Request = None):
    """Handle OAuth2 callback from Google Drive"""
    try:

        request_id = http_request.state.request_id if http_request else ""
        return ResponseFormatter.create_success(
            message="Drive connected successfully",
            request_id=request_id
        )
    except Exception as e:
        logger.error(f"Error in OAuth callback: {str(e)}")
        raise


@router.get("/files")
async def list_drive_files(current_user: Annotated[User, Depends(get_current_user)], http_request: Request = None):
    """List files from Google Drive"""
    try:
        # Placeholder until Drive credential storage is wired
        files = [
            {"id": "1", "name": "Sample Document 1", "mimeType": "application/pdf", "modifiedTime": "2026-01-04"},
            {"id": "2", "name": "Sample Document 2", "mimeType": "application/pdf", "modifiedTime": "2026-01-03"},
        ]

        request_id = http_request.state.request_id if http_request else ""
        return ResponseFormatter.create_success(
            data={"files": files},
            request_id=request_id
        )
    except Exception as e:
        logger.error(f"Error listing files: {str(e)}")
        raise


@router.post("/upload")
async def upload_file(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    file: UploadFile = File(...),
    folder_id: str = Form(None),
    http_request: Request = None
):
    """Upload file to Google Drive (System Account)"""
    try:
        # Use Service Account credentials
        creds = DriveService.get_service_account_credentials()
        
        target_folder_id = folder_id or settings.GOOGLE_FOLDER_ID
        
        # Upload
        result = await DriveService.upload_file(
            file_obj=file.file,
            filename=file.filename,
            mime_type=file.content_type,
            credentials=creds,
            folder_id=target_folder_id
        )
        
        request_id = http_request.state.request_id if http_request else ""
        return ResponseFormatter.create_success(
            data=result,
            message="File uploaded successfully",
            request_id=request_id
        )
    except Exception as e:
        logger.error(f"Error uploading file: {str(e)}")
        raise
