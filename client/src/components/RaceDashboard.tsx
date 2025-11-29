import { useState, useEffect, useMemo } from 'react';
import { useRaceSchedule } from '../hooks/useRaceSchedule';
import { useRaceData } from '../hooks/useRaceData';
import { SelectControl } from './controls/SelectControl';
import { QualiChart } from './charts/QualiChart';
import { RacePaceChart } from './charts/RacePaceChart';

const YEARS = [2025, 2024, 2023, 2022, 2021, 2020];

export const RaceChart = () => {
    const [selectedYear, setSelectedYear] = useState(2025);
    const [selectedEventRound, setSelectedEventRound] = useState<number>(1);
    const [selectedSession, setSelectedSession] = useState('Q');

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

    const handleAnalyze = () => {
        if (currentEvent) {
            loadData(selectedYear, currentEvent.EventName, selectedSession);
        }
    };

    const isQuali = selectedSession === 'Q' || selectedSession === 'SS';

    return (
        <div className="w-full max-w-7xl mx-auto p-4 md:p-8 font-sans">
            <div className="mb-8 text-center md:text-left">
                <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-600 mb-2 tracking-tight">
                    F1 Data Vis
                </h1>
                <p className="text-neutral-400 text-lg font-medium">
                    Analyze lap times, sector performance, and race pace distributions.
                </p>
            </div>

            <div className="bg-neutral-900/60 backdrop-blur-md border border-white/10 p-6 rounded-3xl shadow-2xl mb-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                    <SelectControl 
                        label="Season" 
                        value={selectedYear} 
                        onChange={(v) => setSelectedYear(Number(v))} 
                        options={YEARS.map(y => ({ label: y, value: y }))} 
                    />
                    
                    <SelectControl 
                        label="Grand Prix" 
                        value={selectedEventRound} 
                        onChange={(v) => setSelectedEventRound(Number(v))} 
                        options={schedule.map(e => ({ label: e.EventName, value: e.RoundNumber }))}
                        disabled={schedule.length === 0}
                    />

                    <SelectControl 
                        label="Session" 
                        value={selectedSession} 
                        onChange={setSelectedSession} 
                        options={currentEvent?.Sessions.map(s => ({ label: s.name, value: s.value })) || []}
                        disabled={!currentEvent}
                    />

                    <button 
                        onClick={handleAnalyze}
                        disabled={loading || !currentEvent}
                        className={`h-[50px] px-8 rounded-2xl font-bold text-sm uppercase tracking-wide transition-all duration-300 transform active:scale-95 shadow-lg ${
                            loading 
                            ? 'bg-neutral-700 text-neutral-400 cursor-not-allowed' 
                            : 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white shadow-red-900/20'
                        }`}
                    >
                        {loading ? 'Loading...' : 'Analyze Telemetry'}
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
                            {selectedSession === 'Q' ? 'Qualifying' : selectedSession === 'R' ? 'Race' : selectedSession}
                        </p>
                    </div>
                </div>

                {error && (
                    <div className="absolute inset-0 flex items-center justify-center bg-neutral-900/80 backdrop-blur-sm z-20">
                        <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl text-red-400 max-w-md text-center">
                            <p className="font-medium">{error}</p>
                        </div>
                    </div>
                )}

                {!loading && data.length === 0 && !error && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-500">
                        <p className="text-lg font-medium">Ready to analyze. Select parameters above.</p>
                    </div>
                )}

                <div className="w-full h-full pt-24 pb-4 px-4 md:px-8">
                    {data.length > 0 && (
                        isQuali 
                        ? <QualiChart data={data} /> 
                        : <RacePaceChart data={data} domain={domain} />
                    )}
                </div>
            </div>
        </div>
    );
};