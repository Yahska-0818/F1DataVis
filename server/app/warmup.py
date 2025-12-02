import datetime
import logging
import gc
from app.f1_service import get_year_schedule, get_session_data, get_session_drivers
from app.cache import set_cached_data

logger = logging.getLogger("uvicorn")

def get_last_5_races(year):
    schedule = get_year_schedule(year)
    now = datetime.datetime.now()
    completed_races = [
        r for r in schedule 
        if datetime.datetime.strptime(r['EventDate'], '%Y-%m-%d %H:%M:%S') < now
    ]
    return completed_races[-5:] if len(completed_races) > 5 else completed_races

def warm_cache_task():
    logger.info("Starting Cache Warming...")
    year = datetime.datetime.now().year
    if datetime.datetime.now().month < 3:
        year = year - 1
        
    recent_races = get_last_5_races(year)
    
    for race in recent_races:
        gp = race['EventName']
        for session in ['Q', 'R']:
            if not any(s['value'] == session for s in race['Sessions']):
                continue

            logger.info(f"   Pre-caching: {year} {gp} - {session}")
            
            try:
                drivers = get_session_drivers(year, gp, session)
                set_cached_data(f"drivers_{year}_{gp}_{session}", drivers)
            except Exception as e:
                logger.error(f"   Failed drivers {gp}: {e}")

            try:
                data_summary = get_session_data(year, gp, session, mode='summary')
                set_cached_data(f"{year}_{gp}_{session}_ALL_summary", data_summary)
            except Exception as e:
                logger.error(f"   Failed data {gp}: {e}")
                gc.collect()

    logger.info("Cache Warming Complete!")