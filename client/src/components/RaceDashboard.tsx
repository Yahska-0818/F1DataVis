import { useState, useEffect, useMemo, useRef } from 'react';
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

const currentYear = new Date().getFullYear();
const YEARS = [currentYear, currentYear - 1];

export const RaceDashboard = () => {
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [selectedEventRound, setSelectedEventRound] = useState<number>(1);
    const [selectedSession, setSelectedSession] = useState('Q');

    const [viewMode, setViewMode] = useState<'distribution' | 'progression'>('distribution');
    const [sortBy, setSortBy] = useState<'median' | 'min'>('median');
    const [showOutliers, setShowOutliers] = useState(false);

    const [availableDrivers, setAvailableDrivers] = useState<string[]>([]);
    const [selectedDrivers, setSelectedDrivers] = useState<string[]>([]);
    const [driverColorMap, setDriverColorMap] = useState<Record<string, string>>({});
    const [driversLoading, setDriversLoading] = useState(false);

    const [comparisonLaps, setComparisonLaps] = useState<{ driver: string; lapNumber: number; color: string }[]>([]);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const schedule = useRaceSchedule(selectedYear);
    const { data, loading, error, domain, loadData, clearData } = useRaceData();
    const driverFetchId = useRef(0);

    useEffect(() => {
        if (schedule.length > 0) {
            const now = new Date();
            const pastEvents = schedule.filter(e => new Date(e.EventDate) <= now);
            const defaultEvent = pastEvents.length > 0 ? pastEvents[pastEvents.length - 1] : schedule[0];
            setSelectedEventRound(defaultEvent.RoundNumber);
            const defaultSession = defaultEvent.Sessions.find(s => s.value === 'Q' || s.value === 'R') || defaultEvent.Sessions[0];
            setSelectedSession(defaultSession.value);
        }
        setAvailableDrivers([]);
        setSelectedDrivers([]);
        setDriverColorMap({});
        setComparisonLaps([]);
        clearData();
    }, [schedule]);

    const currentEvent = useMemo(() => schedule.find(e => e.RoundNumber === selectedEventRound), [schedule, selectedEventRound]);

    useEffect(() => {
        setViewMode('distribution');
        setSortBy('median');
        setComparisonLaps([]);
        setSelectedDrivers([]);
        clearData();
    }, [selectedSession, selectedEventRound]);

    useEffect(() => {
        if (!currentEvent) return;
        const fetchId = ++driverFetchId.current;
        const loadDrivers = async () => {
            setDriversLoading(true);
            try {
                const driverInfos = await fetchDrivers(selectedYear, currentEvent.EventName, selectedSession);
                if (fetchId !== driverFetchId.current) return;
                setAvailableDrivers(driverInfos.map((d: any) => d.code));
                setDriverColorMap(Object.fromEntries(driverInfos.map((d: any) => [d.code, d.color])));
                setSelectedDrivers([]);
            } catch {
                if (fetchId !== driverFetchId.current) return;
                setAvailableDrivers([]);
                setDriverColorMap({});
            } finally {
                if (fetchId === driverFetchId.current) setDriversLoading(false);
            }
        };
        loadDrivers();
    }, [selectedYear, currentEvent, selectedSession]);

    const sortedData = useMemo(() => {
        if (!data || data.length === 0) return [];
        const isQuali = selectedSession === 'Q' || selectedSession === 'SS';
        if (isQuali || viewMode === 'progression') return data;
        return [...data].sort((a, b) => (a[sortBy] || 0) - (b[sortBy] || 0));
    }, [data, sortBy, selectedSession, viewMode]);

    const handleAnalyze = () => {
        if (currentEvent) {
            loadData(selectedYear, currentEvent.EventName, selectedSession, viewMode, selectedDrivers);
            setComparisonLaps([]);
            setSidebarOpen(false);
        }
    };

    const handlePointClick = (driver: string, lap: number) => {
        setComparisonLaps(prev => {
            if (prev.some(p => p.driver === driver && p.lapNumber === lap)) return prev;
            return [...prev, { driver, lapNumber: lap, color: driverColorMap[driver] || '#888' }];
        });
    };

    const isQuali = selectedSession === 'Q' || selectedSession === 'SS';
    const sessionLabel = currentEvent?.Sessions.find(s => s.value === selectedSession)?.name || selectedSession;
    const chartTitle = isQuali ? 'QUALIFYING' : viewMode === 'distribution' ? 'RACE PACE DISTRIBUTION' : 'LAP PROGRESSION';

    return (
        <div className="flex flex-1 overflow-hidden relative">
            <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden fixed top-3 left-3 z-50 bg-[#1c1e2d] border border-[#2a2d3d] p-2 rounded-lg"
            >
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={sidebarOpen ? "M6 18L18 6M6 6l12 12" : "M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"} />
                </svg>
            </button>

            {sidebarOpen && <div className="lg:hidden fixed inset-0 bg-black/60 z-30" onClick={() => setSidebarOpen(false)} />}

            <aside className={`
                fixed lg:relative z-40 lg:z-auto
                w-[280px] shrink-0
                bg-[#161825] border-r border-[#2a2d3d]
                flex flex-col
                h-full overflow-y-auto
                transition-transform duration-300 lg:translate-x-0
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="p-5 flex flex-col gap-5 flex-1">
                    <div className="mb-1">
                        <div className="flex items-center gap-2">
                            <span className="text-2xl font-black tracking-tight">
                                <span className="text-red-500 italic">F1</span> <span className="text-white">DATA VIS</span>
                            </span>
                        </div>
                        <p className="text-[9px] text-neutral-500 font-bold tracking-[0.25em] uppercase mt-0.5">Telemetry & Race Analytics</p>
                        {currentEvent && (
                            <p className="text-[10px] text-neutral-600 font-medium mt-1.5">
                                {currentEvent.EventName} · {selectedYear} · <span className="text-red-500">{sessionLabel}</span>
                            </p>
                        )}
                        <div className="flex gap-0.5 mt-2">
                            {[...Array(4)].map((_, i) => <div key={i} className="w-1.5 h-1.5 rounded-full bg-red-600" />)}
                        </div>
                    </div>

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

                    {!isQuali && (
                        <div className="flex gap-1 bg-[#111320] rounded-md p-1 border border-[#2a2d3d]">
                            {(['distribution', 'progression'] as const).map(mode => (
                                <button
                                    key={mode}
                                    onClick={() => setViewMode(mode)}
                                    className={`flex-1 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all ${viewMode === mode ? 'bg-red-600 text-white' : 'text-neutral-500 hover:text-white'}`}
                                >
                                    {mode === 'distribution' ? 'Dist.' : 'Prog.'}
                                </button>
                            ))}
                        </div>
                    )}

                    {!isQuali && viewMode === 'progression' && (
                        <div className="border-t border-[#2a2d3d] pt-4">
                            {driversLoading ? (
                                <div className="text-xs text-neutral-600 italic">Loading drivers...</div>
                            ) : (
                                <MultiSelectControl options={availableDrivers} selected={selectedDrivers} onChange={setSelectedDrivers} colorMap={driverColorMap} />
                            )}
                        </div>
                    )}

                    <div className="border-t border-[#2a2d3d] pt-3 space-y-2">
                        {!isQuali && viewMode === 'progression' && (
                            <ToggleControl label="Show Outliers" checked={showOutliers} onChange={setShowOutliers} />
                        )}
                        {!isQuali && viewMode === 'distribution' && (
                            <ToggleControl label="Sort by Fastest" checked={sortBy === 'min'} onChange={(val) => setSortBy(val ? 'min' : 'median')} />
                        )}
                    </div>
                </div>

                <div className="p-5 pt-0">
                    <button
                        onClick={handleAnalyze}
                        disabled={loading || !currentEvent || driversLoading}
                        className={`w-full py-3 rounded-md font-black text-sm uppercase tracking-[0.2em] transition-all ${
                            loading || driversLoading
                            ? 'bg-neutral-700 text-neutral-500 cursor-not-allowed'
                            : 'bg-red-600 hover:bg-red-500 text-white active:scale-[0.98] shadow-lg shadow-red-900/40'
                        }`}
                    >
                        {loading ? 'Analyzing...' : 'Analyze'}
                    </button>
                </div>
            </aside>

            <main className="flex-1 overflow-y-auto">
                <div className="p-4 lg:p-6 flex flex-col gap-4 lg:gap-5 min-h-full">
                    <div className="f1-surface rounded-lg overflow-hidden flex-1 relative" style={{ minHeight: '450px' }}>
                        <div className="absolute top-0 left-0 right-0 p-4 lg:p-5 z-10 pointer-events-none">
                            <h2 className="text-white text-sm lg:text-base font-black tracking-wider uppercase">
                                {chartTitle}: <span className="text-neutral-400 normal-case">{currentEvent?.EventName || 'Select a Grand Prix'}</span>
                                {viewMode === 'progression' && !isQuali && <span className="text-neutral-600"> — Telemetry Comparison</span>}
                            </h2>
                        </div>

                        {loading && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1c1e2d]/90 z-20 gap-3">
                                <div className="w-10 h-10 border-2 border-[#2a2d3d] border-t-red-600 rounded-full" style={{ animation: 'spin-slow 0.7s linear infinite' }} />
                                <span className="text-xs text-neutral-500 font-bold tracking-widest uppercase">Loading</span>
                            </div>
                        )}
                        {error && <div className="absolute inset-0 flex items-center justify-center bg-[#1c1e2d]/90 z-20 text-red-400 text-sm font-medium px-4 text-center">{error}</div>}
                        {!loading && (!data || data.length === 0) && !error && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                                <div className="w-12 h-12 rounded-full border border-[#2a2d3d] flex items-center justify-center">
                                    <svg className="w-5 h-5 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
                                    </svg>
                                </div>
                                <span className="text-neutral-600 text-xs font-semibold tracking-wider uppercase">Select parameters & analyze</span>
                            </div>
                        )}

                        <div className="absolute top-[60px] lg:top-[70px] bottom-4 left-4 right-4">
                            {!loading && Array.isArray(data) && data.length > 0 && (
                                isQuali
                                ? <QualiChart data={sortedData} />
                                : viewMode === 'distribution'
                                    ? <RacePaceChart data={sortedData} domain={domain} />
                                    : <LapProgressionChart data={data} selectedDrivers={selectedDrivers} driverColorMap={driverColorMap} showOutliers={showOutliers} onPointClick={handlePointClick} />
                            )}
                        </div>
                    </div>

                    {comparisonLaps.length > 0 && (
                        <TelemetryOverlay
                            year={selectedYear}
                            gp={currentEvent?.EventName || ''}
                            session={selectedSession}
                            laps={comparisonLaps}
                            driverColorMap={driverColorMap}
                            onClose={() => setComparisonLaps([])}
                        />
                    )}
                </div>
            </main>
        </div>
    );
};