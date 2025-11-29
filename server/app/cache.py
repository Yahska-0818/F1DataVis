import redis
import json
import pandas as pd

r = redis.Redis(host='localhost', port=6379, db=0)

def get_cached_data(key: str):
    data = r.get(key)
    if data:
        return json.loads(data)
    return None

def set_cached_data(key: str, data: dict, expire: int = 3600):
    r.setex(key, expire, json.dumps(data))