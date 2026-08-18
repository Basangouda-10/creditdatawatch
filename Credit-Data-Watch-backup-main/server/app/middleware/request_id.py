"""
Request ID middleware for tracking
"""
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from uuid import uuid4


class RequestIDMiddleware(BaseHTTPMiddleware):
    """Add request ID to each request for tracking"""

    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get("X-Request-ID") or str(uuid4())
        request.state.request_id = request_id
        
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        
        return response
