from fastapi import FastAPI, Query
from typing import List, Optional
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from fastapi.concurrency import run_in_threadpool
from contextlib import asynccontextmanager
from apscheduler.schedulers.background import BackgroundScheduler
import datetime

from app.f1_service import get_session_data, get_year_schedule, get_session_drivers, get_multi_lap_telemetry
from app.cache import get_cached_data, set_cached_data
from app.warmup import warm_cache_task

@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler = BackgroundScheduler()
    scheduler.add_job(warm_cache_task, 'date', run_date=datetime.datetime.now() + datetime.timedelta(seconds=15))
    scheduler.add_job(warm_cache_task, 'interval', hours=24)
    scheduler.start()
    yield
    scheduler.shutdown()

app = FastAPI(lifespan=lifespan)

origins = ["https://f1datavis-frontend.onrender.com","http://localhost:5173"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CompareRequest(BaseModel):
    year: int
    gp: str
    session: str
    laps: List[dict]

@app.get("/")
def read_root(): return {"status": "F1 Analytics API is running"}

@app.get("/api/schedule/{year}")
async def get_schedule(year: int):
    cache_key = f"schedule_{year}"
    cached = get_cached_data(cache_key)
    if cached: return {"source": "redis", "data": cached}
    
    data = await run_in_threadpool(get_year_schedule, year)
    set_cached_data(cache_key, data, expire=86400)
    return {"source": "live", "data": data}

@app.get("/api/drivers/{year}/{gp}/{session}")
async def get_drivers(year: int, gp: str, session: str):
    cache_key = f"drivers_{year}_{gp}_{session}"
    cached = get_cached_data(cache_key)
    if cached: return {"source": "redis", "data": cached}
    
    data = await run_in_threadpool(get_session_drivers, year, gp, session)
    set_cached_data(cache_key, data)
    return {"source": "live", "data": data}

@app.get("/api/race/{year}/{gp}/{session}")
async def get_race_data(
    year: int, 
    gp: str, 
    session: str, 
    drivers: Optional[List[str]] = Query(None),
    mode: str = "summary"
):
    driver_key = "ALL" if not drivers else "-".join(sorted(drivers))
    cache_key = f"{year}_{gp}_{session}_{driver_key}_{mode}"
    
    cached = get_cached_data(cache_key)
    if cached: return {"source": "redis", "data": cached}
    
    try:
        data = await run_in_threadpool(get_session_data, year, gp, session, drivers, mode)
    except Exception as e:
        return {"error": str(e)}
    
    set_cached_data(cache_key, data)
    return {"source": "live", "data": data}

@app.post("/api/telemetry/compare")
async def compare_laps(req: CompareRequest):
    req_str = f"{req.year}_{req.gp}_{req.session}_{str(req.laps)}"
    cache_key = f"compare_{hash(req_str)}"
    
    cached = get_cached_data(cache_key)
    if cached: return {"source": "redis", "data": cached}
    
    try:
        data = await run_in_threadpool(get_multi_lap_telemetry, req.year, req.gp, req.session, req.laps)
    except Exception as e:
        return {"error": str(e)}
    
    set_cached_data(cache_key, data)
    return {"source": "live", "data": data}