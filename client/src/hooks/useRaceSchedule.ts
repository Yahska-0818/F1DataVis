import { useState, useEffect } from 'react';
import { fetchSchedule } from '../services/api';

export interface SessionInfo { name: string; value: string; }
export interface RaceEvent { RoundNumber: number; EventName: string; Location: string; Sessions: SessionInfo[]; }

export const useRaceSchedule = (year: number) => {
    const [schedule, setSchedule] = useState<RaceEvent[]>([]);
    
    useEffect(() => {
        const load = async () => {
            try {
                const data = await fetchSchedule(year);
                setSchedule(data);
            } catch (err) {
                console.error(err);
            }
        };
        load();
    }, [year]);

    return schedule;
};