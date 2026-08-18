"""
Redis client connection management
"""
import logging
from app.config import settings

logger = logging.getLogger(__name__)

try:
    import redis.asyncio as redis
    redis_client = redis.from_url(settings.REDIS_URL, encoding="utf-8", decode_responses=True)
except ImportError:
    logger.warning("Redis package not found. Install with 'pip install redis'. Using in-memory fallback.")
    redis_client = None
except Exception as e:
    logger.warning(f"Failed to initialize Redis: {e}")
    redis_client = None

async def get_redis_client():
    """FastAPI dependency to get Redis client."""
    return redis_client