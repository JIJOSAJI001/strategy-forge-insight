"""
Redis connection and caching utilities for Strategy Forge API
Provides caching layer to reduce database load and improve response times
"""
import redis.asyncio as redis
from typing import Optional, Any
import os
import json
from dotenv import load_dotenv

load_dotenv()

class RedisCache:
    """Redis cache manager with async support"""
    client: Optional[redis.Redis] = None
    _connected: bool = False
    
    @classmethod
    async def connect_to_redis(cls):
        """Create Redis connection pool"""
        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
        
        try:
            cls.client = redis.from_url(
                redis_url,
                encoding="utf-8",
                decode_responses=True,
                max_connections=10,  # Connection pool size
                socket_connect_timeout=5,
                socket_timeout=5
            )
            
            # Test connection
            await cls.client.ping()
            cls._connected = True
            print(f"✅ Redis connected at {redis_url}")
        except Exception as e:
            print(f"⚠️  Redis connection failed: {e}")
            print("   Continuing without cache (will use database directly)")
            cls._connected = False
            cls.client = None
    
    @classmethod
    async def close_redis_connection(cls):
        """Close Redis connection"""
        if cls.client:
            await cls.client.close()
            cls._connected = False
            print("Disconnected from Redis.")
    
    @classmethod
    async def get(cls, key: str) -> Optional[Any]:
        """
        Get value from cache
        Returns None if key doesn't exist or Redis is unavailable
        """
        if not cls._connected or cls.client is None:
            return None
        
        try:
            value = await cls.client.get(key)
            if value:
                return json.loads(value)
            return None
        except Exception as e:
            print(f"⚠️  Redis GET error: {e}")
            return None
    
    @classmethod
    async def set(cls, key: str, value: Any, ttl: int = 30):
        """
        Set value in cache with TTL (time to live in seconds)
        Default TTL: 30 seconds
        """
        if not cls._connected or cls.client is None:
            return False
        
        try:
            serialized = json.dumps(value, default=str)  # default=str handles datetime
            await cls.client.set(key, serialized, ex=ttl)
            return True
        except Exception as e:
            print(f"⚠️  Redis SET error: {e}")
            return False
    
    @classmethod
    async def delete(cls, key: str):
        """Delete key from cache"""
        if not cls._connected or cls.client is None:
            return False
        
        try:
            await cls.client.delete(key)
            return True
        except Exception as e:
            print(f"⚠️  Redis DELETE error: {e}")
            return False
    
    @classmethod
    async def clear_pattern(cls, pattern: str):
        """
        Clear all keys matching pattern
        Example: clear_pattern("dashboard:*") clears all dashboard cache
        """
        if not cls._connected or cls.client is None:
            return 0
        
        try:
            keys = await cls.client.keys(pattern)
            if keys:
                return await cls.client.delete(*keys)
            return 0
        except Exception as e:
            print(f"⚠️  Redis CLEAR error: {e}")
            return 0
    
    @classmethod
    def is_connected(cls) -> bool:
        """Check if Redis is connected"""
        return cls._connected


# Cache key generators
def dashboard_metrics_key(user_id: str) -> str:
    """Generate cache key for dashboard metrics"""
    return f"dashboard:metrics:{user_id}"

def equity_curve_key(user_id: str, days: int) -> str:
    """Generate cache key for equity curve"""
    return f"dashboard:equity:{user_id}:{days}"

def drawdown_key(user_id: str) -> str:
    """Generate cache key for drawdown data"""
    return f"dashboard:drawdown:{user_id}"

def performance_key(user_id: str) -> str:
    """Generate cache key for performance comparison"""
    return f"dashboard:performance:{user_id}"
