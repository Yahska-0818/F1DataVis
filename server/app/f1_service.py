import fastf1
import os

cache_dir = 'cache_dir'

if not os.path.exists(cache_dir):
    os.makedirs(cache_dir)

fastf1.Cache.enable_cache(cache_dir)

fastf1.Cache.enable_cache('cache_dir') 

def get_session_data(year, gp, session_type):
    session = fastf1.get_session(year, gp, session_type)
    session.load()

    laps = session.laps.pick_quicklaps()
    
    result = laps[['Driver', 'LapTime', 'Sector1Time', 'Sector2Time', 'Sector3Time']].to_dict(orient='records')
    
    for lap in result:
        lap['LapTime'] = str(lap['LapTime']).split('days ')[-1]
        lap['Sector1Time'] = str(lap['Sector1Time']).split('days ')[-1]
        lap['Sector2Time'] = str(lap['Sector2Time']).split('days ')[-1]
        lap['Sector3Time'] = str(lap['Sector3Time']).split('days ')[-1]
        
    return result