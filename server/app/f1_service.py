import fastf1
import os
import pandas as pd
import numpy as np
import gc

cache_dir = 'cache_dir'
if not os.path.exists(cache_dir):
    os.makedirs(cache_dir)

fastf1.Cache.enable_cache(cache_dir) 

def _get_session_object(year, gp, session_type):
    if session_type == 'SS':
        try: return fastf1.get_session(year, gp, 'Sprint Shootout')
        except: return fastf1.get_session(year, gp, 'Sprint Qualifying')
    return fastf1.get_session(year, gp, session_type)

def get_session_drivers(year, gp, session_type):
    try:
        session = _get_session_object(year, gp, session_type)
        session.load(laps=False, telemetry=False, weather=False, messages=False)
        return sorted(session.results['Abbreviation'].unique().tolist())
    except Exception as e:
        print(f"Error fetching drivers: {e}")
        return []

def get_session_data(year, gp, session_type, selected_drivers=None, mode='summary'):
    try:
        session = _get_session_object(year, gp, session_type)
        session.load(telemetry=False, weather=False, messages=False)
    except Exception as e:
        raise e

    is_race_style = session_type in ['R', 'S', 'FP1', 'FP2', 'FP3']
    
    if is_race_style or mode == 'all':
        laps = session.laps
        if selected_drivers and len(selected_drivers) > 0:
            laps = laps.pick_drivers(selected_drivers)
        
        accurate_laps = laps.pick_accurate().index
        result = laps[['Driver', 'LapTime', 'LapNumber']].to_dict(orient='records')
        
        for i, lap in enumerate(result):
            lap['IsAccurate'] = (laps.index[i] in accurate_laps)
    else:
        laps = session.laps.pick_quicklaps()
        if selected_drivers and len(selected_drivers) > 0:
            laps = laps.pick_drivers(selected_drivers)
        result = laps[['Driver', 'LapTime', 'Sector1Time', 'Sector2Time', 'Sector3Time']].to_dict(orient='records')
    
    cleaned_result = []
    for lap in result:
        t = lap['LapTime']
        if pd.isnull(t): continue
        clean_lap = {
            'Driver': lap['Driver'],
            'LapTime': str(t).split('days ')[-1]
        }
        if is_race_style or mode == 'all':
            clean_lap['LapNumber'] = int(lap['LapNumber'])
            clean_lap['IsAccurate'] = bool(lap.get('IsAccurate', False))
        if not is_race_style and mode == 'summary':
            clean_lap['Sector1Time'] = str(lap.get('Sector1Time', '00:00:00')).split('days ')[-1] if not pd.isnull(lap.get('Sector1Time')) else "00:00:00"
            clean_lap['Sector2Time'] = str(lap.get('Sector2Time', '00:00:00')).split('days ')[-1] if not pd.isnull(lap.get('Sector2Time')) else "00:00:00"
            clean_lap['Sector3Time'] = str(lap.get('Sector3Time', '00:00:00')).split('days ')[-1] if not pd.isnull(lap.get('Sector3Time')) else "00:00:00"
        cleaned_result.append(clean_lap)
    
    del session
    gc.collect()
        
    return cleaned_result

def get_multi_lap_telemetry(year, gp, session_type, lap_requests):
    try:
        session = _get_session_object(year, gp, session_type)
        session.load(weather=False, messages=False)
    except Exception as e:
        raise e

    reference_lap = None
    max_dist = 0
    loaded_laps = []
    
    fastest_lap_time = float('inf')
    fastest_lap_obj = None

    for req in lap_requests:
        driver = req['driver']
        lap_n = int(req['lapNumber'])
        try:
            d_laps = session.laps.pick_driver(driver)
            specific_lap = d_laps[d_laps['LapNumber'] == lap_n].iloc[0]
            
            lap_time_seconds = specific_lap['LapTime'].total_seconds()
            if lap_time_seconds < fastest_lap_time:
                fastest_lap_time = lap_time_seconds
                fastest_lap_obj = specific_lap

            tel = specific_lap.get_telemetry().add_distance()
            max_d = tel['Distance'].max()
            
            if max_d > max_dist:
                max_dist = max_d
                reference_lap = tel
            
            loaded_laps.append({
                'id': f"{driver}_{lap_n}",
                'driver': driver,
                'lap': lap_n,
                'telemetry': tel,
                'time': lap_time_seconds
            })
        except Exception as e:
            print(f"Error loading {driver} {lap_n}: {e}")
            continue

    if reference_lap is None:
        del session
        gc.collect()
        return {"error": "No valid laps found"}

    common_dist = np.arange(0, max_dist, 10) 
    merged_data = pd.DataFrame({'Distance': common_dist})

    ref_time_interp = None
    if fastest_lap_obj is not None:
        fastest_tel = fastest_lap_obj.get_telemetry().add_distance()
        ref_time_interp = np.interp(common_dist, fastest_tel['Distance'], fastest_tel['Time'].dt.total_seconds())

    for item in loaded_laps:
        tel = item['telemetry']
        key = item['id']
        
        merged_data[f'Speed_{key}'] = np.interp(common_dist, tel['Distance'], tel['Speed'])
        merged_data[f'Throttle_{key}'] = np.interp(common_dist, tel['Distance'], tel['Throttle'])
        merged_data[f'Brake_{key}'] = np.interp(common_dist, tel['Distance'], tel['Brake'])
        merged_data[f'RPM_{key}'] = np.interp(common_dist, tel['Distance'], tel['RPM'])
        merged_data[f'nGear_{key}'] = np.interp(common_dist, tel['Distance'], tel['nGear'])
        merged_data[f'DRS_{key}'] = np.interp(common_dist, tel['Distance'], tel['DRS'])

        if ref_time_interp is not None:
            lap_time_interp = np.interp(common_dist, tel['Distance'], tel['Time'].dt.total_seconds())
            merged_data[f'Delta_{key}'] = lap_time_interp - ref_time_interp

    dominance_map = []
    ref_x = np.interp(common_dist, reference_lap['Distance'], reference_lap['X'])
    ref_y = np.interp(common_dist, reference_lap['Distance'], reference_lap['Y'])

    for i in range(len(common_dist)):
        best_speed = -1
        fastest_id = None
        for item in loaded_laps:
            key = item['id']
            speed = merged_data.loc[i, f'Speed_{key}']
            if speed > best_speed:
                best_speed = speed
                fastest_id = item['driver']
        
        dominance_map.append({
            'X': ref_x[i],
            'Y': ref_y[i],
            'FastestDriver': fastest_id
        })

    lap_summaries = [{
        'driver': l['driver'], 
        'lap': l['lap'], 
        'time': l['time'],
        'diff': l['time'] - fastest_lap_time
    } for l in loaded_laps]

    chart_data = merged_data.replace({np.nan: None}).to_dict(orient='records')
    
    del session
    gc.collect()
    
    return {
        "telemetry": chart_data,
        "dominance": dominance_map,
        "summary": lap_summaries
    }

def get_year_schedule(year: int):
    schedule = fastf1.get_event_schedule(year)
    events = []
    for _, row in schedule.iterrows():
        if row['RoundNumber'] == 0: continue
        sessions = []
        for i in range(1, 6):
            session_name = row.get(f'Session{i}')
            session_date = row.get(f'Session{i}Date')
            if pd.isna(session_name) or pd.isna(session_date): continue
            identifier = get_session_identifier(str(session_name), year)
            if any(s['value'] == identifier for s in sessions): continue
            sessions.append({"name": str(session_name), "value": identifier})
        events.append({
            "RoundNumber": int(row['RoundNumber']),
            "EventName": str(row['EventName']),
            "Location": str(row['Location']),
            "EventDate": str(row['EventDate']),
            "Sessions": sessions 
        })
    return events

def get_session_identifier(name: str, year: int):
    name_lower = str(name).lower()
    if year == 2021 and "sprint qualifying" in name_lower: return "S"
    if "sprint shootout" in name_lower: return "SS"
    if "sprint qualifying" in name_lower: return "SS"
    if "sprint" in name_lower: return "S"
    if "qualifying" in name_lower: return "Q"
    if "practice 1" in name_lower: return "FP1"
    if "practice 2" in name_lower: return "FP2"
    if "practice 3" in name_lower: return "FP3"
    if "race" in name_lower: return "R"
    return "R"