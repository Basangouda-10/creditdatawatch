"""
Rate limiting middleware
"""
from datetime import datetime, timedelta, timezone
import logging
from collections import defaultdict

logger = logging.getLogger(__name__)

# Store request counts per IP/endpoint
request_tracker = defaultdict(list)
RATE_LIMIT_WINDOW = 60  # seconds
RATE_LIMIT_MAX_REQUESTS = {
    '/api/v1/auth/login': 10,  # 10 login attempts per minute
    '/api/v1/auth/register': 10,  # 10 registration attempts per minute
    '/api/v1/auth/otp/send': 10,  # 10 OTP requests per minute
    '/api/v1/auth/password/send-otp': 10,  # 10 password reset OTP per minute
    '/api/v1/auth/register/send-otp': 10,  # Added for registration
}


class RateLimitMiddleware:
    """Rate limiting middleware to prevent brute force attacks"""

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        """Check rate limit and proceed if allowed"""
        
        # Only apply to HTTP requests
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        
        path = scope["path"]
        
        # Only rate limit specific endpoints
        if path not in RATE_LIMIT_MAX_REQUESTS:
            await self.app(scope, receive, send)
            return
        
        # Get client IP
        client_ip = scope.get("client", ("unknown", 0))[0]
        
        # Create key for tracking: IP + endpoint
        key = f"{client_ip}:{path}"
        
        # Clean up old requests (older than RATE_LIMIT_WINDOW)
        now = datetime.now(timezone.utc)
        request_tracker[key] = [
            req_time for req_time in request_tracker[key]
            if (now - req_time).total_seconds() < RATE_LIMIT_WINDOW
        ]
        
        # Check if limit exceeded
        max_requests = RATE_LIMIT_MAX_REQUESTS[path]
        if len(request_tracker[key]) >= max_requests:
            logger.warning(f"Rate limit exceeded for {key}")
            
            # Send 429 response
            await send({
                "type": "http.response.start",
                "status": 429,
                "headers": [[b"content-type", b"application/json"]],
            })
            await send({
                "type": "http.response.body",
                "body": b'{"success": false, "error": {"code": "RATE_LIMIT_EXCEEDED", "message": "Too many requests. Please try again after 60 seconds."}}',
            })
            return
        
        # Add current request to tracker
        request_tracker[key].append(now)
        
        # Proceed with request
        await self.app(scope, receive, send)
