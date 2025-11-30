import redis
import json
import os

redis_url = os.getenv('REDIS_URL', 'redis://localhost:6379')

r = redis.from_url(redis_url)

def get_cached_data(key: str):
    try:
        data = r.get(key)
        if data:
            return json.loads(data)
    except Exception:
        pass
    return None

def set_cached_data(key: str, data: dict, expire: int = 3600):
    try:
        r.setex(key, expire, json.dumps(data))
    except Exception:
        pass