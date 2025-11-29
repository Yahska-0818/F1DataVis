import fastf1
import os
import pandas as pd
cache_dir = 'cache_dir'
if not os.path.exists(cache_dir):
    os.makedirs(cache_dir)

fastf1.Cache.enable_cache(cache_dir) 

def get_session_data(year, gp, session_type):
    try:
        if session_type == 'SS':
            try:
                session = fastf1.get_session(year, gp, 'Sprint Shootout')
            except:
                try:
                    session = fastf1.get_session(year, gp, 'Sprint Qualifying')
                except:
                    session = fastf1.get_session(year, gp, 'SS')
        else:
            session = fastf1.get_session(year, gp, session_type)
            
        session.load()
    except Exception as e:
        print(f"Error loading session {year} {gp} {session_type}: {e}")
        raise e

    is_race_style = session_type in ['R', 'S', 'FP1', 'FP2', 'FP3']
    
    if is_race_style:
        laps = session.laps.pick_accurate()
        result = laps[['Driver', 'LapTime']].to_dict(orient='records')
        
    else:
        laps = session.laps.pick_quicklaps()
        result = laps[['Driver', 'LapTime', 'Sector1Time', 'Sector2Time', 'Sector3Time']].to_dict(orient='records')
    cleaned_result = []
    for lap in result:
        t = lap['LapTime']
        if pd.isnull(t): continue

        clean_lap = {
            'Driver': lap['Driver'],
            'LapTime': str(t).split('days ')[-1]
        }
        if not is_race_style:
            clean_lap['Sector1Time'] = str(lap.get('Sector1Time', '00:00:00')).split('days ')[-1] if not pd.isnull(lap.get('Sector1Time')) else "00:00:00"
            clean_lap['Sector2Time'] = str(lap.get('Sector2Time', '00:00:00')).split('days ')[-1] if not pd.isnull(lap.get('Sector2Time')) else "00:00:00"
            clean_lap['Sector3Time'] = str(lap.get('Sector3Time', '00:00:00')).split('days ')[-1] if not pd.isnull(lap.get('Sector3Time')) else "00:00:00"
            
        cleaned_result.append(clean_lap)
        
    return cleaned_result

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
            identifier = get_session_identifier(str(session_name), year)
            
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

def get_session_identifier(name: str, year: int):
    name_lower = str(name).lower()
    if year == 2021 and "sprint qualifying" in name_lower:
        return "S"
    if "sprint shootout" in name_lower: return "SS"
    if "sprint qualifying" in name_lower: return "SS"
    
    if "sprint" in name_lower: return "S"
    
    if "qualifying" in name_lower: return "Q"
    
    if "practice 1" in name_lower: return "FP1"
    if "practice 2" in name_lower: return "FP2"
    if "practice 3" in name_lower: return "FP3"
    
    if "race" in name_lower: return "R"
    
    return "R"