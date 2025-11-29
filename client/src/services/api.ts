import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export const fetchSchedule = async (year: number) => {
    const res = await axios.get(`${API_BASE_URL}/api/schedule/${year}`);
    return res.data.data;
};

export const fetchDrivers = async (year: number, eventName: string, session: string) => {
    const res = await axios.get(`${API_BASE_URL}/api/drivers/${year}/${eventName}/${session}`);
    return res.data.data;
};

export const fetchRaceData = async (year: number, eventName: string, session: string, mode: string, drivers: string[] = []) => {
    let url = `${API_BASE_URL}/api/race/${year}/${eventName}/${session}?mode=${mode}`;
    if (drivers.length > 0) {
        const queryParams = drivers.map(d => `drivers=${d}`).join('&');
        url += `&${queryParams}`;
    }
    const res = await axios.get(url);
    return res.data.data;
};