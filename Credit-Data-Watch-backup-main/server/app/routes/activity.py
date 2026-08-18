from fastapi import APIRouter, Depends, HTTPException, Request 
from typing import Annotated
from sqlalchemy.ext.asyncio import AsyncSession 
from sqlalchemy import text 
from datetime import datetime
from app.database import get_db, engine 
from app.dependencies import get_current_user 
from app.models import User

router = APIRouter() 


def normalize_role(role_val) -> str:
    """Normalize Enum or string roles into uppercase string format."""
    role_str = str(role_val or '').split('.')[-1]
    return role_str.upper().strip()


def serialize_row(row_dict: dict) -> dict:
    """Convert datetime objects in SQL query mappings into JSON-safe strings."""
    clean_dict = {}
    for k, v in row_dict.items():
        if isinstance(v, datetime):
            clean_dict[k] = v.isoformat()
        else:
            clean_dict[k] = v
    return clean_dict


async def log_activity( 
    db: AsyncSession, 
    user_email: str, 
    user_id: str, 
    user_role: str, 
    action: str, 
    page: str = '', 
    entity_type: str = '', 
    entity_id: str = '', 
    details: str = '', 
    ip_address: str = '' 
): 
    try: 
        await db.execute(text(""" 
            INSERT INTO user_activity_logs 
            (user_id, user_email, user_role, action, page, entity_type, entity_id, details, ip_address) 
            VALUES (:uid, :email, :role, :action, :page, :etype, :eid, :details, :ip) 
        """), { 
            "uid": str(user_id), 
            "email": user_email, 
            "role": user_role, 
            "action": action, 
            "page": page, 
            "etype": entity_type, 
            "eid": str(entity_id), 
            "details": details, 
            "ip": ip_address 
        }) 
        await db.commit() 
    except Exception as e: 
        print(f"Activity log error: {e}") 


@router.post("/log") 
async def log_user_activity( 
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    request: Request
): 
    try: 
        body = await request.json() 
        ip = request.client.host if request.client else '' 
        role_str = normalize_role(current_user.role)
        await log_activity( 
            db=db, 
            user_email=current_user.email, 
            user_id=str(current_user.id), 
            user_role=role_str, 
            action=body.get('action', ''), 
            page=body.get('page', ''), 
            entity_type=body.get('entity_type', ''), 
            entity_id=body.get('entity_id', ''), 
            details=body.get('details', ''), 
            ip_address=ip 
        ) 
        return {"success": True} 
    except Exception as e: 
        return {"success": False, "error": str(e)} 


@router.get("/logs") 
async def get_activity_logs( 
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    limit: int = 200, 
    user_email: str = '', 
    action: str = '' 
): 
    role_str = normalize_role(current_user.role)
    allowed_roles = ['MASTER_ADMIN', 'OPERATION', 'OPERATIONS', 'LEGAL', 'FINANCIAL', 'FINANCE']
    
    if role_str not in allowed_roles and current_user.email != 'payalshinde906@gmail.com': 
        raise HTTPException(status_code=403, detail="Access denied") 

    is_sqlite = str(engine.url).startswith("sqlite")
    like_op = "LIKE" if is_sqlite else "ILIKE"

    filters = ["1=1"] 
    params = {"limit": limit} 

    if user_email: 
        filters.append(f"user_email {like_op} :email") 
        params["email"] = f"%{user_email}%" 
    if action: 
        filters.append("action = :action") 
        params["action"] = action 

    where = " AND ".join(filters) 
    try:
        result = await db.execute(text(f""" 
            SELECT * FROM user_activity_logs 
            WHERE {where} 
            ORDER BY timestamp DESC 
            LIMIT :limit 
        """), params) 

        rows = [serialize_row(dict(r._mapping)) for r in result.fetchall()] 
        return {"success": True, "data": rows} 
    except Exception as e:
        return {"success": False, "error": str(e)}


@router.get("/logs/summary") 
async def get_activity_summary( 
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
): 
    role_str = normalize_role(current_user.role)
    allowed_roles = ['MASTER_ADMIN', 'OPERATION', 'OPERATIONS']
    if role_str not in allowed_roles and current_user.email != 'payalshinde906@gmail.com': 
        raise HTTPException(status_code=403, detail="Access denied") 

    try:
        # Total metrics count for Master Admin summary cards
        total_result = await db.execute(text("""
            SELECT 
                COUNT(*) as total_logs,
                COUNT(DISTINCT user_email) as unique_users
            FROM user_activity_logs
        """))
        total_stats = dict(total_result.mappings().first() or {})

        # Actions breakdown
        result = await db.execute(text(""" 
            SELECT 
                action, 
                COUNT(*) as count, 
                MAX(timestamp) as last_seen 
            FROM user_activity_logs 
            GROUP BY action 
            ORDER BY count DESC 
            LIMIT 20 
        """)) 
        rows = [serialize_row(dict(r._mapping)) for r in result.fetchall()] 

        # User activity breakdown
        users_result = await db.execute(text(""" 
            SELECT 
                user_email, 
                user_role, 
                COUNT(*) as total_actions, 
                MAX(timestamp) as last_active 
            FROM user_activity_logs 
            GROUP BY user_email, user_role 
            ORDER BY total_actions DESC 
            LIMIT 10 
        """)) 
        users = [serialize_row(dict(r._mapping)) for r in users_result.fetchall()]

        return {
            "success": True, 
            "data": {
                "total_logs": total_stats.get("total_logs", 0),
                "unique_users": total_stats.get("unique_users", 0),
                "by_action": rows, 
                "by_user": users
            }
        } 
    except Exception as e:
        return {"success": False, "error": str(e)}