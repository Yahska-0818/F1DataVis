import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { parseLapTime } from '../utils';

const YEARS = [2025, 2024, 2023, 2022, 2021, 2020];
interface SessionInfo {
    name: string;
    value: string;
}
interface RaceEvent {
    RoundNumber: number;
    EventName: string;
    Location: string;
    Sessions: SessionInfo[];
}

export const RaceChart = () => {
    const [schedule, setSchedule] = useState<RaceEvent[]>([]);
    const [selectedYear, setSelectedYear] = useState(2025);
    const [selectedEventRound, setSelectedEventRound] = useState<number>(1);
    const [selectedSession, setSelectedSession] = useState("Q");
    const [chartData, setChartData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    useEffect(() => {
        const fetchSchedule = async () => {
            try {
                const res = await axios.get(`http://127.0.0.1:8000/api/schedule/${selectedYear}`);
                const events: RaceEvent[] = res.data.data;
                setSchedule(events);
                
                if (events.length > 0) {
                  setSelectedEventRound(events[0].RoundNumber);
                  const defaultSession = events[0].Sessions.find(s => s.value === 'Q' || s.value === 'R') || events[0].Sessions[0];
                  setSelectedSession(defaultSession.value);
                }
            } catch (err) {
                console.error("Failed to fetch schedule", err);
            }
        };
        fetchSchedule();
    }, [selectedYear]);

    const currentEvent = useMemo(() => 
        schedule.find(e => e.RoundNumber === selectedEventRound), 
    [schedule, selectedEventRound]);

    const fetchData = async () => {
        if (!currentEvent) return;
        
        setLoading(true);
        setError(null);
        setChartData([]);

        try {
            const url = `http://127.0.0.1:8000/api/race/${selectedYear}/${currentEvent.EventName}/${selectedSession}`;
            const res = await axios.get(url);
            
            const rawData = res.data.data;
            if (!rawData || rawData.length === 0) {
                throw new Error("No data available for this session yet.");
            }

            const processedData = rawData.map((d: any) => ({
                name: d.Driver,
                seconds: parseLapTime(d.LapTime),
                rawTime: d.LapTime
            }));
            processedData.sort((a: any, b: any) => a.seconds - b.seconds);
            setChartData(processedData);

        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.detail || err.message || "Failed to load data.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-6xl mx-auto">
            <div className="bg-gray-800 p-6 rounded-xl shadow-lg mb-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div>
                    <label className="text-gray-400 text-sm block mb-1">Season</label>
                    <select 
                        className="w-full bg-gray-700 text-white p-2 rounded border border-gray-600 focus:border-red-500 outline-none"
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                    >
                        {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-gray-400 text-sm block mb-1">Grand Prix</label>
                    <select 
                        className="w-full bg-gray-700 text-white p-2 rounded border border-gray-600 focus:border-red-500 outline-none"
                        value={selectedEventRound}
                        onChange={(e) => setSelectedEventRound(Number(e.target.value))}
                        disabled={schedule.length === 0}
                    >
                        {schedule.map(e => (
                            <option key={e.RoundNumber} value={e.RoundNumber}>
                                {e.EventName}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="text-gray-400 text-sm block mb-1">Session</label>
                    <select 
                        className="w-full bg-gray-700 text-white p-2 rounded border border-gray-600 focus:border-red-500 outline-none"
                        value={selectedSession}
                        onChange={(e) => setSelectedSession(e.target.value)}
                        disabled={!currentEvent}
                    >
                        {currentEvent?.Sessions.map(s => (
                            <option key={s.value} value={s.value}>
                                {s.name}
                            </option>
                        ))}
                    </select>
                </div>

                <button 
                    onClick={fetchData}
                    disabled={loading || !currentEvent}
                    className={`h-10 px-6 rounded font-bold transition-colors ${
                        loading 
                        ? 'bg-gray-600 cursor-not-allowed' 
                        : 'bg-red-600 hover:bg-red-700 text-white'
                    }`}
                >
                    {loading ? 'Loading...' : 'Analyze'}
                </button>
            </div>

            <div style={{ height: '500px', width: '100%' }} className="p-4 bg-gray-900 rounded-xl shadow-lg relative">
                <h2 className="text-white text-2xl mb-4 font-bold">
                    {currentEvent ? `${currentEvent.EventName} - ${selectedSession}` : 'Select a Race'}
                </h2>

                {error && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-900/90 z-10 text-red-400 font-mono">
                        Error: {error}
                    </div>
                )}
                
                {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="name" stroke="#9ca3af" />
                            <YAxis domain={['dataMin - 0.5', 'dataMax + 0.5']} hide />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', color: '#fff' }}
                                itemStyle={{ color: '#fff' }}
                                formatter={(value: number) => [`${value.toFixed(3)}s`, 'Time']}
                                cursor={{fill: '#374151', opacity: 0.4}}
                            />
                            <Bar dataKey="seconds" radius={[4, 4, 0, 0]}>
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={index === 0 ? '#ef4444' : '#3b82f6'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex items-center justify-center text-gray-500">
                        Select a race and click Analyze to view data.
                    </div>
                )}
            </div>
        </div>
    );
};