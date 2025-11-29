import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export const fetchSchedule = async (year: number) => {
    const res = await axios.get(`${API_BASE_URL}/api/schedule/${year}`);
    return res.data.data;
};

export const fetchRaceData = async (year: number, eventName: string, session: string) => {
    const res = await axios.get(`${API_BASE_URL}/api/race/${year}/${eventName}/${session}`);
    return res.data.data;
};