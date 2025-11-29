import fastf1
import os
import pandas as pd
cache_dir = 'cache_dir'
if not os.path.exists(cache_dir):
    os.makedirs(cache_dir)

fastf1.Cache.enable_cache(cache_dir) 

def get_session_data(year, gp, session_type):
    session = fastf1.get_session(year, gp, session_type)
    session.load()
    laps = session.laps.pick_quicklaps()
    result = laps[['Driver', 'LapTime', 'Sector1Time', 'Sector2Time', 'Sector3Time']].to_dict(orient='records')
    for lap in result:
        lap['LapTime'] = str(lap['LapTime']).split('days ')[-1] if lap['LapTime'] is not None else "00:00:00"
        lap['Sector1Time'] = str(lap['Sector1Time']).split('days ')[-1] if lap['Sector1Time'] is not None else "00:00:00"
        lap['Sector2Time'] = str(lap['Sector2Time']).split('days ')[-1] if lap['Sector2Time'] is not None else "00:00:00"
        lap['Sector3Time'] = str(lap['Sector3Time']).split('days ')[-1] if lap['Sector3Time'] is not None else "00:00:00"
        
    return result

def get_year_schedule(year: int):
    schedule = fastf1.get_event_schedule(year)
    events = []
    
    for _, row in schedule.iterrows():
        if row['RoundNumber'] == 0:
            continue
            
        sessions = []
        for i in range(1, 6):
            session_name = row.get(f'Session{i}')
            session_date = row.get(f'Session{i}Date')
            if pd.isna(session_name) or pd.isna(session_date):
                continue
            identifier = get_session_identifier(str(session_name))
            if any(s['value'] == identifier for s in sessions):
                continue
                
            sessions.append({"name": str(session_name), "value": identifier})
        
        events.append({
            "RoundNumber": int(row['RoundNumber']),
            "EventName": str(row['EventName']),
            "Location": str(row['Location']),
            "Sessions": sessions 
        })
        
    return events

def get_session_identifier(name: str):
    name_lower = str(name).lower()
    if "sprint shootout" in name_lower: return "SS"
    if "sprint qualifying" in name_lower: return "SS"
    if "sprint" in name_lower: return "S"
    if "qualifying" in name_lower and "sprint" not in name_lower: return "Q"
    if "practice 1" in name_lower: return "FP1"
    if "practice 2" in name_lower: return "FP2"
    if "practice 3" in name_lower: return "FP3"
    
    if "race" in name_lower: return "R"
    return "R"