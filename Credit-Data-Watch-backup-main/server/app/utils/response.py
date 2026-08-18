"""
Consistent response formatting
"""
from datetime import datetime, timezone
from typing import Any, Optional, Generic, TypeVar
from uuid import uuid4
from pydantic import BaseModel

T = TypeVar("T")

UTC_REPLACEMENT = "+00:00"


def current_timestamp() -> str:
    """Return timezone-aware UTC timestamp as ISO string with Z suffix."""
    return datetime.now(timezone.utc).isoformat().replace(UTC_REPLACEMENT, "Z")


class ResponseFormatter(BaseModel, Generic[T]):
    """Format consistent API responses"""
    success: bool
    data: Optional[T] = None
    error: Optional[dict] = None
    message: Optional[str] = None
    timestamp: str
    request_id: str

    @staticmethod
    def create_success(
        data: Any = None,
        message: str = "Operation successful",
        status_code: int = 200,
        request_id: Optional[str] = None,
    ) -> dict:
        """
        Success response helper
        """
        return {
            "success": True,
            "data": data,
            "message": message,
            "timestamp": current_timestamp(),
            "request_id": request_id or str(uuid4()),
        }

    @staticmethod
    def create_error(
        code: str,
        message: str,
        status_code: int = 400,
        details: Optional[dict] = None,
        request_id: Optional[str] = None,
    ) -> dict:
        """
        Error response helper
        """
        return {
            "success": False,
            "error": {
                "code": code,
                "message": message,
                "details": details or {},
            },
            "timestamp": current_timestamp(),
            "request_id": request_id or str(uuid4()),
        }


def paginated_response(items: list, total: int, page: int, page_size: int, request_id: Optional[str] = None) -> dict:
    """
    Paginated list response
    
    Args:
        items: List of items
        total: Total count
        page: Current page
        page_size: Items per page
        request_id: Request ID
        
    Returns:
        Formatted paginated response
    """
    return {
        "success": True,
        "data": {
            "items": items,
            "pagination": {
                "total": total,
                "page": page,
                "page_size": page_size,
                "pages": (total + page_size - 1) // page_size,
            },
        },
        "timestamp": current_timestamp(),
        "request_id": request_id or str(uuid4()),
    }
