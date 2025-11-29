from fastapi import FastAPI
from app.f1_service import get_session_data
from app.cache import get_cached_data, set_cached_data

app = FastAPI()

@app.get("/")
def read_root():
    return {"status": "F1 Analytics API is running"}

@app.get("/api/race/{year}/{gp}/{session}")
def get_race_data(year: int, gp: str, session: str):
    cache_key = f"{year}_{gp}_{session}"
    
    cached = get_cached_data(cache_key)
    if cached:
        return {"source": "redis", "data": cached}
    
    data = get_session_data(year, gp, session)
    
    set_cached_data(cache_key, data)
    
    return {"source": "live", "data": data}