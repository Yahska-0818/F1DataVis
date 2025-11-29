from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.f1_service import get_session_data, get_year_schedule
from app.cache import get_cached_data, set_cached_data

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "F1 Analytics API is running"}

@app.get("/api/schedule/{year}")
def get_schedule(year: int):
    cache_key = f"schedule_{year}"
    cached = get_cached_data(cache_key)

    if cached:
        print(f"Cache HIT for schedule {year}")
        return {"source": "redis", "data": cached}
    print(f"Cache MISS for schedule {year} - Fetching live...")
    data = get_year_schedule(year)
    set_cached_data(cache_key, data, expire=86400)
    
    return {"source": "live", "data": data}

@app.get("/api/race/{year}/{gp}/{session}")
def get_race_data(year: int, gp: str, session: str):
    cache_key = f"{year}_{gp}_{session}"
    cached = get_cached_data(cache_key)
    if cached:
        return {"source": "redis", "data": cached}
    try:
        data = get_session_data(year, gp, session)
    except Exception as e:
        return {"error": str(e)}
    set_cached_data(cache_key, data)
    
    return {"source": "live", "data": data}