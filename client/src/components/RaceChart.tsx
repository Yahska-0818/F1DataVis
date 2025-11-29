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
        <div className="w-full max-w-7xl mx-auto p-4 md:p-8 font-sans">
            
            <div className="mb-8 text-center md:text-left">
                <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-600 mb-2 tracking-tight">
                    F1 Telemetry Bridge
                </h1>
                <p className="text-neutral-400 text-lg font-medium">
                    Analyze lap times, sector performance, and race pace distributions.
                </p>
            </div>

            <div className="bg-neutral-900/60 backdrop-blur-md border border-white/10 p-6 rounded-3xl shadow-2xl mb-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                    
                    <div className="space-y-2">
                        <label className="text-neutral-400 text-xs font-bold uppercase tracking-wider ml-1">Season</label>
                        <div className="relative">
                            <select 
                                className="w-full appearance-none bg-neutral-800 text-white px-4 py-3 rounded-2xl border border-neutral-700 hover:border-neutral-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all duration-200 cursor-pointer font-medium"
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(Number(e.target.value))}
                            >
                                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-neutral-400">
                                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-neutral-400 text-xs font-bold uppercase tracking-wider ml-1">Grand Prix</label>
                        <div className="relative">
                            <select 
                                className="w-full appearance-none bg-neutral-800 text-white px-4 py-3 rounded-2xl border border-neutral-700 hover:border-neutral-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all duration-200 cursor-pointer font-medium"
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
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-neutral-400">
                                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-neutral-400 text-xs font-bold uppercase tracking-wider ml-1">Session</label>
                        <div className="relative">
                            <select 
                                className="w-full appearance-none bg-neutral-800 text-white px-4 py-3 rounded-2xl border border-neutral-700 hover:border-neutral-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all duration-200 cursor-pointer font-medium"
                                value={selectedSession}
                                onChange={(e) => setSelectedSession(e.target.value)}
                                disabled={!currentEvent}
                            >
                                {currentEvent?.Sessions.map((s, idx) => (
                                    <option key={`${s.name}-${idx}`} value={s.value}>{s.name}</option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-neutral-400">
                                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={fetchData} 
                        disabled={loading || !currentEvent}
                        className={`h-[50px] px-8 rounded-2xl font-bold text-sm uppercase tracking-wide transition-all duration-300 transform active:scale-95 shadow-lg ${
                            loading 
                            ? 'bg-neutral-700 text-neutral-400 cursor-not-allowed' 
                            : 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white shadow-red-900/20'
                        }`}
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Loading
                            </span>
                        ) : 'Analyze Telemetry'}
                    </button>
                </div>
            </div>

            <div className="relative bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden" style={{ height: '750px' }}>
                
                <div className="absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-neutral-900 to-transparent z-10 flex justify-between items-start pointer-events-none">
                     <div>
                        <h2 className="text-white text-3xl font-bold tracking-tight">
                            {currentEvent ? currentEvent.EventName : 'Select Event'}
                        </h2>
                        <p className="text-red-500 font-medium text-lg mt-1">
                            {selectedSession === 'Q' ? 'Qualifying' : selectedSession === 'R' ? 'Race' : selectedSession === 'SS' ? 'Sprint Quali' : selectedSession}
                        </p>
                     </div>
                </div>

                {error && (
                    <div className="absolute inset-0 flex items-center justify-center bg-neutral-900/80 backdrop-blur-sm z-20">
                        <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl text-red-400 max-w-md text-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto mb-3 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <p className="font-medium">{error}</p>
                        </div>
                    </div>
                )}
                
                {!loading && barData.length === 0 && boxData.length === 0 && !error && (
                     <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-500">
                        <div className="w-16 h-16 mb-4 rounded-full bg-neutral-800 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <p className="text-lg font-medium">Ready to analyze. Select parameters above.</p>
                     </div>
                )}

                <div className="w-full h-full pt-24 pb-4 px-4 md:px-8">
                    {isQuali && barData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={barData}
                                layout="vertical"
                                margin={{ top: 0, right: 30, left: 20, bottom: 0 }}
                                barSize={24}
                            >
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#333" opacity={0.4} />
                                <YAxis
                                    type="category"
                                    dataKey="name"
                                    stroke="#9ca3af"
                                    tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 600 }}
                                    width={60}
                                    interval={0}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <XAxis
                                    type="number"
                                    domain={['dataMin - 1', 'dataMax + 1']}
                                    hide
                                />
                                <Tooltip 
                                    cursor={{fill: '#ffffff', opacity: 0.05}}
                                    contentStyle={{ 
                                        backgroundColor: 'rgba(23, 23, 23, 0.9)', 
                                        backdropFilter: 'blur(8px)',
                                        border: '1px solid rgba(255,255,255,0.1)', 
                                        borderRadius: '12px',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                                    }} 
                                    itemStyle={{ color: '#e5e5e5' }}
                                />
                                <Legend 
                                    wrapperStyle={{ paddingTop: '20px' }} 
                                    iconType="circle"
                                />
                                <Bar dataKey="s1" name="Sector 1" stackId="a" fill="#ef4444" radius={[4, 0, 0, 4]} />
                                <Bar dataKey="s2" name="Sector 2" stackId="a" fill="#f59e0b" />
                                <Bar dataKey="s3" name="Sector 3" stackId="a" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : boxData.length > 0 && (
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart
                                key={Array.isArray(domain) ? domain.join('-') : 'auto'}
                                data={boxData}
                                layout="vertical"
                                margin={{ top: 0, right: 30, left: 20, bottom: 20 }}
                                barSize={12} 
                            >
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#333" opacity={0.4} />
                                <YAxis
                                    type="category"
                                    dataKey="name"
                                    stroke="#9ca3af"
                                    tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 600 }}
                                    width={60}
                                    interval={0}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <XAxis
                                    type="number"
                                    domain={domain as [number, number]}
                                    stroke="#525252"
                                    tick={{ fill: '#737373', fontSize: 11 }}
                                    tickFormatter={(val) => `${val.toFixed(1)}s`}
                                    allowDataOverflow={true}
                                    axisLine={{ stroke: '#404040' }}
                                    tickLine={false}
                                />
                                <Tooltip 
                                    cursor={{fill: '#ffffff', opacity: 0.05}}
                                    contentStyle={{ 
                                        backgroundColor: 'rgba(23, 23, 23, 0.95)', 
                                        backdropFilter: 'blur(8px)',
                                        border: '1px solid rgba(255,255,255,0.1)', 
                                        borderRadius: '12px',
                                        color: '#fff',
                                        padding: '12px'
                                    }}
                                    separator="" 
                                    formatter={(value: any, name: string, props: any) => {
                                        const { min, q1, median, q3, max } = props.payload;
                                        if (name === 'Median') {
                                            return [
                                                <div key="tooltip" className="text-sm space-y-1">
                                                    <div className="flex justify-between gap-4 text-white"><span className="text-red-400">Min:</span> <span className="font-mono">{min.toFixed(3)}s</span></div>
                                                    <div className="flex justify-between gap-4 text-white"><span className="text-red-400">Q1:</span> <span className="font-mono">{q1.toFixed(3)}s</span></div>
                                                    <div className="flex justify-between gap-4 font-bold text-white"><span className="text-red-400">Median:</span> <span className="font-mono">{median.toFixed(3)}s</span></div>
                                                    <div className="flex justify-between gap-4 text-white"><span className="text-red-400">Q3:</span> <span className="font-mono">{q3.toFixed(3)}s</span></div>
                                                    <div className="flex justify-between gap-4 text-white"><span className="text-red-400">Max:</span> <span className="font-mono">{max.toFixed(3)}s</span></div>
                                                </div>
                                            ];
                                        }
                                        return [];
                                    }}
                                />
                                <Legend
                                    verticalAlign="top"
                                    align="right"
                                    wrapperStyle={{ paddingBottom: '20px', paddingRight: '20px' }}
                                    payload={[
                                        { value: 'IQR (Consistency)', type: 'rect', color: '#3b82f6' },
                                        { value: 'Median Pace', type: 'circle', color: '#ef4444' },
                                        { value: 'Range (Min/Max)', type: 'line', color: '#6b7280' }
                                    ]}
                                />
                                <Bar dataKey="q1" stackId="a" fill="transparent" />
                                <Bar
                                    dataKey={(d: any) => d.q3 - d.q1}
                                    name="IQR"
                                    stackId="a"
                                    fill="#3b82f6"
                                    opacity={0.8}
                                    radius={[4, 4, 4, 4]} 
                                />
                                <Scatter name="Median" dataKey="median" fill="#ef4444" shape="circle" r={4}>
                                    <ErrorBar
                                        dataKey="whiskerRange"
                                        width={2}
                                        strokeWidth={2}
                                        stroke="#6b7280" 
                                        direction="x"
                                    />
                                </Scatter>
                            </ComposedChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>
        </div>
    );
};