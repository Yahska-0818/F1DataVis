import { useState, useEffect, useMemo } from 'react';
import { useRaceSchedule } from '../hooks/useRaceSchedule';
import { useRaceData } from '../hooks/useRaceData';
import { SelectControl } from './controls/SelectControl';
import { ToggleControl } from './controls/ToggleControl';
import { MultiSelectControl } from './controls/MultiSelectControl';
import { QualiChart } from './charts/QualiChart';
import { RacePaceChart } from './charts/RacePaceChart';
import { LapProgressionChart } from './charts/LapProgressionChart';
import { TelemetryOverlay } from './charts/TelemetryOverlay';
import { fetchDrivers } from '../services/api';

const YEARS = [2025, 2024, 2023, 2022, 2021, 2020];
const getRandomColor = () => {
    const hslToHex = (h: number, s: number, l: number) => {
        l /= 100;
        const a = s * Math.min(l, 1 - l) / 100;
        const f = (n: number) => {
            const k = (n + h / 30) % 12;
            const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
            return Math.round(255 * color).toString(16).padStart(2, '0');
        };
        return `#${f(0)}${f(8)}${f(4)}`;
    };
    return hslToHex(Math.floor(Math.random() * 360), 80, 60);
};

export const RaceDashboard = () => {
    const [selectedYear, setSelectedYear] = useState(2025);
    const [selectedEventRound, setSelectedEventRound] = useState<number>(1);
    const [selectedSession, setSelectedSession] = useState('Q');
    
    const [viewMode, setViewMode] = useState<'distribution' | 'progression'>('distribution');
    const [showOutliers, setShowOutliers] = useState(false);
    
    const [availableDrivers, setAvailableDrivers] = useState<string[]>([]);
    const [selectedDrivers, setSelectedDrivers] = useState<string[]>([]);
    const [driversLoading, setDriversLoading] = useState(false);

    const [comparisonLaps, setComparisonLaps] = useState<{ driver: string; lapNumber: number; color: string }[]>([]);

    const schedule = useRaceSchedule(selectedYear);
    const { data, loading, error, domain, loadData } = useRaceData();

    useEffect(() => {
        if (schedule.length > 0) {
            setSelectedEventRound(schedule[0].RoundNumber);
            const defaultSession = schedule[0].Sessions.find(s => s.value === 'Q' || s.value === 'R') || schedule[0].Sessions[0];
            setSelectedSession(defaultSession.value);
        }
    }, [schedule]);

    const currentEvent = useMemo(() => 
        schedule.find(e => e.RoundNumber === selectedEventRound), 
    [schedule, selectedEventRound]);

    useEffect(() => {
        setViewMode('distribution');
        setComparisonLaps([]);
    }, [selectedSession]);

    useEffect(() => {
        if (!currentEvent) return;
        
        const loadDrivers = async () => {
            setDriversLoading(true);
            try {
                const drivers = await fetchDrivers(selectedYear, currentEvent.EventName, selectedSession);
                setAvailableDrivers(drivers);
                setSelectedDrivers(drivers.slice(0, 5));
            } catch (err) {
                console.error(err);
            } finally {
                setDriversLoading(false);
            }
        };
        loadDrivers();
    }, [selectedYear, currentEvent, selectedSession]);

    const handleAnalyze = () => {
        if (currentEvent) {
            loadData(selectedYear, currentEvent.EventName, selectedSession, viewMode, selectedDrivers);
            setComparisonLaps([]);
        }
    };
    const handlePointClick = (driver: string, lap: number) => {
        setComparisonLaps(prev => {
            if (prev.some(p => p.driver === driver && p.lapNumber === lap)) return prev;
            return [...prev, { driver, lapNumber: lap, color: getRandomColor() }];
        });
    };

    const isQuali = selectedSession === 'Q' || selectedSession === 'SS';

    return (
        <div className="w-full max-w-7xl mx-auto p-4 md:p-8 font-sans">
            <div className="mb-8 text-center md:text-left">
                <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-600 mb-2 tracking-tight">
                    F1 Data Vis
                </h1>
            </div>

            <div className="bg-neutral-900/60 backdrop-blur-md border border-white/10 p-6 rounded-3xl shadow-2xl mb-8 flex flex-col gap-6">
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                    <SelectControl 
                        label="Season" value={selectedYear} onChange={(v) => setSelectedYear(Number(v))} 
                        options={YEARS.map(y => ({ label: y, value: y }))} 
                    />
                    <SelectControl 
                        label="Grand Prix" value={selectedEventRound} onChange={(v) => setSelectedEventRound(Number(v))} 
                        options={schedule.map(e => ({ label: e.EventName, value: e.RoundNumber }))}
                        disabled={schedule.length === 0}
                    />
                    <SelectControl 
                        label="Session" value={selectedSession} onChange={setSelectedSession} 
                        options={currentEvent?.Sessions.map(s => ({ label: s.name, value: s.value })) || []}
                        disabled={!currentEvent}
                    />
                    <div className="bg-neutral-800 p-1 rounded-2xl flex h-[50px] border border-neutral-700">
                        <button 
                            onClick={() => setViewMode('distribution')}
                            className={`flex-1 rounded-xl text-xs font-bold transition-all ${viewMode === 'distribution' ? 'bg-neutral-600 text-white shadow' : 'text-neutral-400 hover:text-white'}`}
                        >
                            Distribution
                        </button>
                        <button 
                            onClick={() => setViewMode('progression')}
                            className={`flex-1 rounded-xl text-xs font-bold transition-all ${viewMode === 'progression' ? 'bg-neutral-600 text-white shadow' : 'text-neutral-400 hover:text-white'}`}
                        >
                            Progression
                        </button>
                    </div>
                </div>

                {viewMode === 'progression' && (
                    <div className="flex flex-col gap-4 animate-fade-in-down border-t border-white/5 pt-6">
                        <div className="w-full">
                            {driversLoading ? (
                                <div className="text-sm text-neutral-500 italic p-2">Fetching driver list...</div>
                            ) : (
                                <MultiSelectControl 
                                    options={availableDrivers}
                                    selected={selectedDrivers}
                                    onChange={setSelectedDrivers}
                                />
                            )}
                        </div>
                        
                        <div className="w-full sm:w-auto self-start">
                            <ToggleControl label="Show Outliers" checked={showOutliers} onChange={setShowOutliers} />
                        </div>
                    </div>
                )}

                <div>
                    <button 
                        onClick={handleAnalyze} 
                        disabled={loading || !currentEvent || driversLoading}
                        className={`w-full h-[50px] rounded-2xl font-bold text-sm uppercase tracking-wide transition-all duration-300 shadow-lg ${
                            loading || driversLoading
                            ? 'bg-neutral-700 text-neutral-400 cursor-not-allowed' 
                            : 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white shadow-red-900/20 active:scale-[0.99]'
                        }`}
                    >
                        {loading ? 'Fetching Telemetry...' : 'Analyze Data'}
                    </button>
                </div>
            </div>

            <div className="relative bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden" style={{ height: '750px' }}>
                <div className="absolute top-0 left-0 right-0 p-6 z-10 pointer-events-none flex justify-between">
                     <div>
                        <h2 className="text-white text-3xl font-bold">{currentEvent?.EventName}</h2>
                        <p className="text-red-500 font-medium">
                            {isQuali ? 'Qualifying Pace' : viewMode === 'distribution' ? 'Race Pace Distribution' : 'Lap Time Progression'}
                        </p>
                        {viewMode === 'progression' && <p className="text-neutral-500 text-xs mt-1">Click points to compare laps</p>}
                     </div>
                </div>

                {error && <div className="absolute inset-0 flex items-center justify-center bg-neutral-900/90 z-20 text-red-400 font-medium">{error}</div>}
                {!loading && data.length === 0 && !error && <div className="absolute inset-0 flex items-center justify-center text-neutral-500">Ready to analyze. Select parameters above.</div>}

                <div className="w-full h-full pt-24 pb-4 px-4 md:px-8">
                    {!loading && data.length > 0 && (
                        viewMode === 'progression' 
                            ? <LapProgressionChart 
                                data={data} 
                                selectedDrivers={selectedDrivers} 
                                showOutliers={showOutliers}
                                onPointClick={handlePointClick}
                              />
                            : isQuali 
                                ? <QualiChart data={data} /> 
                                : <RacePaceChart data={data} domain={domain} />
                    )}
                </div>
            </div>

            {comparisonLaps.length > 0 && (
                <TelemetryOverlay 
                    year={selectedYear} 
                    gp={currentEvent?.EventName || ''} 
                    session={selectedSession}
                    laps={comparisonLaps}
                    onClose={() => setComparisonLaps([])}
                />
            )}
        </div>
    );
};