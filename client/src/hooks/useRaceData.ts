import { useState } from 'react';
import { fetchRaceData } from '../services/api';
import { calculateBoxPlotData, processQualiData } from '../services/dataProcessing';

export const useRaceData = () => {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [domain, setDomain] = useState<[number, number] | ['auto', 'auto']>(['auto', 'auto']);

    const loadData = async (year: number, eventName: string, session: string, viewMode: string, selectedDrivers: string[]) => {
        setLoading(true);
        setError(null);
        setData([]);

        try {
            const mode = viewMode === 'progression' ? 'all' : 'summary';
            
            const driversToSend = viewMode === 'progression' ? selectedDrivers : [];
            
            const rawData = await fetchRaceData(year, eventName, session, mode, driversToSend);
            
            const isQuali = session === 'Q' || session === 'SS';

            if (viewMode === 'progression') {
                setData(rawData); 
            } else if (isQuali) {
                const processed = processQualiData(rawData);
                setData(processed);
                setDomain(['auto', 'auto']);
            } else {
                const processed = calculateBoxPlotData(rawData);
                
                let globalMin = Infinity;
                let globalMax = -Infinity;
                processed.forEach(d => {
                    if (d.min < globalMin) globalMin = d.min;
                    if (d.max > globalMax) globalMax = d.max;
                });

                const spread = globalMax - globalMin;
                const padding = spread > 0 ? spread * 0.1 : 1;
                setDomain([globalMin - padding, globalMax + padding]);
                setData(processed);
            }
        } catch (err) {
            setError("Failed to load telemetry data.");
        } finally {
            setLoading(false);
        }
    };

    return { data, loading, error, domain, loadData };
};