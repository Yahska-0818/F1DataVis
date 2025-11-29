import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { 
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
    ComposedChart, Scatter, ErrorBar
} from 'recharts';
import { parseLapTime } from '../utils';

const YEARS = [2025, 2024, 2023, 2022, 2021, 2020];

interface SessionInfo { name: string; value: string; }
interface RaceEvent { RoundNumber: number; EventName: string; Location: string; Sessions: SessionInfo[]; }

const calculateBoxPlotData = (data: any[]) => {
    const driverLaps: { [key: string]: number[] } = {};
    data.forEach(d => {
        const time = parseLapTime(d.LapTime);
        if (time > 0) {
            if (!driverLaps[d.Driver]) driverLaps[d.Driver] = [];
            driverLaps[d.Driver].push(time);
        }
    });

    const boxData = Object.keys(driverLaps).map(driver => {
        const times = driverLaps[driver].sort((a, b) => a - b);
        const q1 = times[Math.floor(times.length * 0.25)];
        const median = times[Math.floor(times.length * 0.5)];
        const q3 = times[Math.floor(times.length * 0.75)];
        const min = times[0];
        const max = times[times.length - 1];

        return {
            name: driver,
            min, q1, median, q3, max,
            whiskerRange: [median - min, max - median],
            sortValue: median 
        };
    });

    return boxData.sort((a, b) => a.sortValue - b.sortValue);
};

type DomainType = [number, number] | ['auto', 'auto'];

export const RaceChart = () => {
    const [schedule, setSchedule] = useState<RaceEvent[]>([]);
    const [selectedYear, setSelectedYear] = useState(2025);
    const [selectedEventRound, setSelectedEventRound] = useState<number>(1);
    const [selectedSession, setSelectedSession] = useState('Q');
    
    const [barData, setBarData] = useState<any[]>([]);
    const [boxData, setBoxData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [domain, setDomain] = useState<DomainType>(['auto', 'auto']);

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
                console.error(err);
            }
        };
        fetchSchedule();
    }, [selectedYear]);

    const currentEvent = useMemo(
        () => schedule.find(e => e.RoundNumber === selectedEventRound),
        [schedule, selectedEventRound]
    );
    
    const fetchData = async () => {
        if (!currentEvent) return;
        setLoading(true);
        setError(null);
        setBarData([]);
        setBoxData([]);

        try {
            const url = `http://127.0.0.1:8000/api/race/${selectedYear}/${currentEvent.EventName}/${selectedSession}`;
            const res = await axios.get(url);
            const rawData = res.data.data;

            if (selectedSession === 'Q' || selectedSession === 'SS') {
                const uniqueDrivers = new Map();
                rawData.forEach((d: any) => {
                    const time = parseLapTime(d.LapTime);
                    if (!uniqueDrivers.has(d.Driver) || time < uniqueDrivers.get(d.Driver).total) {
                        uniqueDrivers.set(d.Driver, {
                            name: d.Driver,
                            s1: parseLapTime(d.Sector1Time),
                            s2: parseLapTime(d.Sector2Time),
                            s3: parseLapTime(d.Sector3Time),
                            total: time,
                        });
                    }
                });
                const processed = Array.from(uniqueDrivers.values()).sort(
                    (a: any, b: any) => a.total - b.total
                );
                setBarData(processed);
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
                setBoxData(processed);
            }
        } catch (err: any) {
            setError('Failed to load data.');
        } finally {
            setLoading(false);
        }
    };

    const isQuali = selectedSession === 'Q' || selectedSession === 'SS';

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
                        {currentEvent?.Sessions.map((s, idx) => (
                            <option key={`${s.name}-${idx}`} value={s.value}>{s.name}</option>
                        ))}
                    </select>
                </div>

                <button 
                    onClick={fetchData} 
                    disabled={loading || !currentEvent}
                    className={`h-10 px-6 rounded font-bold transition-colors ${loading ? 'bg-gray-600' : 'bg-red-600 hover:bg-red-700 text-white'}`}
                >
                    {loading ? 'Loading...' : 'Analyze'}
                </button>
            </div>

            <div style={{ height: '700px', width: '100%' }} className="p-4 bg-gray-900 rounded-xl shadow-lg relative">
                <h2 className="text-white text-2xl mb-4 font-bold">{currentEvent?.EventName} - {selectedSession}</h2>

                {error && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-900/90 z-10 text-red-400">
                        {error}
                    </div>
                )}

                {isQuali ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={barData}
                            layout="vertical"
                            margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#374151" />
                            <YAxis
                                type="category"
                                dataKey="name"
                                stroke="#9ca3af"
                                width={80}
                                interval={0}
                            />
                            <XAxis
                                type="number"
                                domain={['dataMin - 1', 'dataMax + 1']}
                                hide
                            />
                            <Tooltip contentStyle={{ backgroundColor: '#1f2937' }} />
                            <Legend />
                            <Bar dataKey="s1" name="Sector 1" stackId="a" fill="#ef4444" />
                            <Bar dataKey="s2" name="Sector 2" stackId="a" fill="#eab308" />
                            <Bar dataKey="s3" name="Sector 3" stackId="a" fill="#3b82f6" />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart
                            key={Array.isArray(domain) ? domain.join('-') : 'auto'}
                            data={boxData}
                            layout="vertical"
                            margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#374151" />
                            <YAxis
                                type="category"
                                dataKey="name"
                                stroke="#9ca3af"
                                width={80}
                                interval={0}
                            />
                            <XAxis
                                type="number"
                                domain={domain as [number, number]}
                                stroke="#9ca3af"
                                tickFormatter={(val) => `${val.toFixed(1)}s`}
                                allowDataOverflow={true}
                            />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }}
                                formatter={(value: any, name: string, props: any) => {
                                    const { min, q1, median, q3, max } = props.payload;
                                    if (name === 'Median') {
                                        return [
                                            <div key="tooltip">
                                                <div>Min: {min.toFixed(3)}s</div>
                                                <div>Q1: {q1.toFixed(3)}s</div>
                                                <div>Median: {median.toFixed(3)}s</div>
                                                <div>Q3: {q3.toFixed(3)}s</div>
                                                <div>Max: {max.toFixed(3)}s</div>
                                            </div>,
                                            ''
                                        ];
                                    }
                                    return [null, null];
                                }}
                            />
                            <Legend
                                payload={[
                                    { value: 'Interquartile Range (Q1-Q3)', type: 'rect', color: '#3b82f6' },
                                    { value: 'Median', type: 'circle', color: '#ef4444' },
                                    { value: 'Whiskers (Min/Max)', type: 'line', color: '#9ca3af' }
                                ]}
                            />
                            <Bar dataKey="q1" stackId="a" fill="transparent" />
                            <Bar
                                dataKey={(d: any) => d.q3 - d.q1}
                                name="IQR"
                                stackId="a"
                                fill="#3b82f6"
                                opacity={0.6}
                                barSize={20}
                            />
                            <Scatter name="Median" dataKey="median" fill="#ef4444" shape="circle">
                                <ErrorBar
                                    dataKey="whiskerRange"
                                    width={4}
                                    strokeWidth={2}
                                    stroke="#9ca3af"
                                    direction="x"
                                />
                            </Scatter>
                        </ComposedChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
};