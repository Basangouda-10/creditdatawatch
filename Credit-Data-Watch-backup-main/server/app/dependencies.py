"""
FastAPI dependency injection
"""
from typing import AsyncGenerator, Optional
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import User, UserRole
from app.utils import decode_token
from app.exceptions import InvalidCredentials, UserNotFound

security = HTTPBearer(auto_error=False)

DEVELOPER_EMAILS = ["payalshinde906@gmail.com"] 


def is_developer(user) -> bool: 
    return user.email in DEVELOPER_EMAILS 


async def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Dependency to get current authenticated user from token (cookie or bearer header)
    
    Args:
        request: HTTP request (for cookie extraction)
        credentials: HTTP bearer token (optional)
        db: Database session
        
    Returns:
        Current user object
    """
    token = None
    
    # Try to get token from Authorization header first
    if credentials:
        token = credentials.credentials
    else:
        # Try to get token from cookies
        token = request.cookies.get("access_token")
    
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    
    payload = decode_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )
    
    user_id = payload.get("sub")
    
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )
    
    stmt = select(User).where(User.id == user_id, User.is_active == True)
    result = await db.execute(stmt)
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    return user


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency to get database session
    
    Returns:
        Database session
    """
    async for session in get_db():
        yield session


def require_role(roles: list):
    """
    Dependency to require specific roles
    """
    def checker(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        return user
    
    return checker


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Check for any admin role (MASTER_ADMIN, COMPANY_ADMIN, OPERATION, OPERATIONS, LEGAL, FINANCIAL, FINANCE) or developer email"""
    if current_user.email in DEVELOPER_EMAILS:
        return current_user
    allowed_roles = [UserRole.MASTER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.OPERATION, UserRole.LEGAL, UserRole.FINANCIAL]
    role_str = str(current_user.role).upper()
    if role_str not in ["MASTER_ADMIN", "COMPANY_ADMIN", "OPERATION", "OPERATIONS", "LEGAL", "FINANCIAL", "FINANCE"] and current_user.role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


def require_admin_or_ops(current_user: User = Depends(get_current_user)) -> User:
    """Check for Admin, Operations, or Financial team member access, or developer email"""
    if current_user.email in DEVELOPER_EMAILS:
        return current_user
    user_role_str = str(getattr(current_user.role, "value", current_user.role)).upper()
    if user_role_str not in ["MASTER_ADMIN", "SUPER_ADMIN", "COMPANY_ADMIN", "OPERATION", "OPERATIONS", "FINANCIAL", "FINANCIAL_TEAM"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied. Requires Admin or Operations role.",
        )
    return current_user


def require_master_admin(current_user: User = Depends(get_current_user)) -> User:
    """Check for MASTER_ADMIN role only"""
    user_role_val = getattr(current_user.role, "value", str(current_user.role))
    if user_role_val != "MASTER_ADMIN" and current_user.email not in DEVELOPER_EMAILS:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Master Admin access required"
        )
    return current_user