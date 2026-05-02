import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import axios from 'axios';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, ScatterChart, Scatter, CartesianGrid, ReferenceLine } from 'recharts';
import { formatTime } from '../../utils';

interface LapRef { driver: string; lapNumber: number; color: string; }
interface Props { year: number; gp: string; session: string; laps: LapRef[]; driverColorMap: Record<string, string>; onClose: () => void; }

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const ChartTooltip = ({ active, payload, unit = '' }: any) => {
    if (!active || !payload || !payload.length) return null;
    return (
        <div className="bg-[#161825]/95 backdrop-blur-md border border-[#2a2d3d] px-3 py-2 rounded-lg shadow-2xl">
            {payload.map((p: any) => (
                <div key={p.dataKey} style={{ color: p.color }} className="flex justify-between gap-4 text-[11px] font-mono font-semibold">
                    <span>{p.name}</span>
                    <span>{Number(p.value).toFixed(2)}{unit}</span>
                </div>
            ))}
        </div>
    );
};

const TelemetryChart = ({ title, metric, domain, height = 170, data, laps, unit = '' }: any) => (
    <div className="f1-surface border border-[#2a2d3d] rounded-lg p-2 sm:p-3 relative flex flex-col justify-center" style={{ height: `${height}px` }}>
        <span className="absolute top-2 left-2 sm:left-3 text-[8px] sm:text-[9px] font-black text-red-500/60 uppercase z-10 tracking-[0.2em]">{title}</span>
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} syncId="telemetry" margin={{ top: 18, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1c1e2d" />
                <XAxis dataKey="Distance" type="number" hide />
                <YAxis domain={domain} hide />
                <Tooltip content={<ChartTooltip unit={unit} />} cursor={{ stroke: '#e10600', strokeWidth: 1, opacity: 0.3 }} />
                {laps.map((l: any) => (
                    <Line
                        key={`${metric}_${l.driver}_${l.lapNumber}`}
                        type="monotone"
                        dataKey={`${metric}_${l.driver}_${l.lapNumber}`}
                        name={`${l.driver} L${l.lapNumber}`}
                        stroke={l.color}
                        strokeWidth={metric === 'Delta' ? 2.5 : 1.5}
                        dot={false}
                        connectNulls={true}
                        isAnimationActive={false}
                    />
                ))}
                {metric === 'Delta' && <ReferenceLine y={0} stroke="#333" strokeDasharray="4 4" />}
            </LineChart>
        </ResponsiveContainer>
    </div>
);

const DominanceMap = ({ dominance, laps, driverColorMap }: { dominance: any[]; laps: LapRef[]; driverColorMap: Record<string, string> }) => {
    const getColor = useCallback((driverCode: string) => {
        const lap = laps.find(l => l.driver === driverCode);
        return lap?.color || driverColorMap[driverCode] || '#333';
    }, [laps, driverColorMap]);

    const driverStats = useMemo(() => {
        const counts: Record<string, number> = {};
        dominance.forEach(d => {
            counts[d.FastestDriver] = (counts[d.FastestDriver] || 0) + 1;
        });
        const total = dominance.length;
        return laps.map(l => ({
            driver: l.driver,
            color: l.color,
            pct: total > 0 ? ((counts[l.driver] || 0) / total * 100) : 0
        })).sort((a, b) => b.pct - a.pct);
    }, [dominance, laps]);

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center gap-2 mb-3 justify-center">
                <div className="w-4 h-[2px] bg-red-600" />
                <h3 className="text-neutral-500 font-black text-center uppercase tracking-[0.2em] text-[9px]">Track Dominance</h3>
                <div className="w-4 h-[2px] bg-red-600" />
            </div>

            <div style={{ height: '250px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                        <XAxis type="number" dataKey="X" hide domain={['dataMin', 'dataMax']} />
                        <YAxis type="number" dataKey="Y" hide domain={['dataMin', 'dataMax']} />
                        <Tooltip cursor={false} content={() => null} />
                        <Scatter
                            data={dominance}
                            isAnimationActive={false}
                            shape={(props: any) => {
                                const color = getColor(props.payload?.FastestDriver);
                                return <circle cx={props.cx} cy={props.cy} r={2.5} fill={color} opacity={0.7} />;
                            }}
                        />
                    </ScatterChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-3 space-y-2 pt-3 border-t border-[#2a2d3d]">
                {driverStats.map(s => (
                    <div key={s.driver} className="flex items-center gap-2 text-[10px]">
                        <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: s.color }} />
                        <span className="text-neutral-400 font-bold flex-1 tracking-wide">{s.driver}</span>
                        <div className="flex-1 h-1.5 bg-[#111320] rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${s.pct}%`, backgroundColor: s.color }} />
                        </div>
                        <span className="text-neutral-500 font-mono font-bold w-10 text-right">{s.pct.toFixed(0)}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const TelemetryOverlay: React.FC<Props> = ({ year, gp, session, laps, driverColorMap, onClose }) => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const fetchId = useRef(0);

    const lapsKey = useMemo(() =>
        laps.map(l => `${l.driver}_${l.lapNumber}`).sort().join('|'),
    [laps]);

    useEffect(() => {
        const currentFetchId = ++fetchId.current;
        const fetchData = async () => {
            setLoading(true);
            try {
                const result = await axios.post(`${API_BASE_URL}/api/telemetry/compare`, {
                    year, gp, session, laps: laps.map(l => ({ driver: l.driver, lapNumber: l.lapNumber }))
                });
                if (currentFetchId !== fetchId.current) return;
                setData(result.data.data);
            } catch (e) {
                if (currentFetchId !== fetchId.current) return;
                console.error(e);
            } finally {
                if (currentFetchId === fetchId.current) setLoading(false);
            }
        };
        fetchData();
    }, [year, gp, session, lapsKey]);

    if (loading) return (
        <div className="mt-5 p-8 sm:p-12 flex flex-col items-center justify-center gap-3 f1-surface border border-[#2a2d3d] rounded-lg">
            <div className="w-8 h-8 border-2 border-[#2a2d3d] border-t-red-600 rounded-full" style={{ animation: 'spin-slow 0.7s linear infinite' }} />
            <span className="text-xs text-neutral-600 font-bold tracking-widest uppercase">Loading telemetry</span>
        </div>
    );
    if (!data) return null;

    return (
        <div className="flex flex-col gap-3 sm:gap-4 animate-fade-in f1-surface border border-[#2a2d3d] p-3 sm:p-5 rounded-lg">
            <div className="flex flex-col sm:flex-row sm:flex-wrap justify-between items-start sm:items-center gap-3">
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    {data.summary.map((s: any) => {
                        const lapInfo = laps.find(l => l.driver === s.driver && l.lapNumber === s.lap);
                        const color = lapInfo?.color || '#fff';
                        const isFastest = s.diff === 0;
                        return (
                            <div key={`${s.driver}-${s.lap}`} className="flex items-center gap-2 bg-[#111320] px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-md border border-[#2a2d3d] flex-1 sm:flex-initial min-w-0">
                                <div className="w-1 h-5 sm:h-6 rounded-sm flex-shrink-0" style={{ backgroundColor: color }} />
                                <div className="min-w-0">
                                    <div className="text-[9px] sm:text-[10px] font-black text-neutral-500 tracking-wider">{s.driver} <span className="text-neutral-700">L{s.lap}</span></div>
                                    <div className="text-[11px] sm:text-xs font-mono font-bold text-white flex items-center gap-1.5">
                                        {formatTime(s.time)}
                                        {!isFastest && <span className="text-red-400 text-[9px] sm:text-[10px] font-bold">+{s.diff.toFixed(3)}</span>}
                                        {isFastest && <span className="text-emerald-400 text-[9px] sm:text-[10px] font-black tracking-wider">P1</span>}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <button onClick={onClose} className="text-[10px] text-neutral-600 hover:text-red-500 font-black uppercase tracking-[0.2em] px-3 py-1.5 border border-[#2a2d3d] rounded-md hover:border-red-600/30 transition-all w-full sm:w-auto text-center">
                    Close
                </button>
            </div>

            <div className="flex flex-col lg:grid lg:grid-cols-4 gap-3">
                <div className="lg:col-span-3 flex flex-col gap-2 sm:gap-3">
                    <TelemetryChart title="Delta" metric="Delta" domain={['auto', 'auto']} data={data.telemetry} laps={laps} unit="s" />
                    <TelemetryChart title="Speed" metric="Speed" domain={['auto', 'auto']} data={data.telemetry} laps={laps} unit=" km/h" />
                    <TelemetryChart title="RPM" metric="RPM" domain={['auto', 'auto']} height={130} data={data.telemetry} laps={laps} />

                    <div className="f1-surface border border-[#2a2d3d] rounded-lg p-2 sm:p-3 relative h-[140px] sm:h-[150px]">
                        <span className="absolute top-2 left-2 sm:left-3 text-[8px] sm:text-[9px] font-black text-red-500/60 uppercase z-10 tracking-[0.2em]">Throttle / Brake</span>
                        <ResponsiveContainer>
                            <LineChart data={data.telemetry} syncId="telemetry" margin={{ top: 18, right: 4, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1c1e2d" />
                                <XAxis dataKey="Distance" type="number" hide />
                                <YAxis domain={[0, 105]} hide />
                                <Tooltip content={<ChartTooltip unit="%" />} cursor={{ stroke: '#e10600', strokeWidth: 1, opacity: 0.3 }} />
                                {laps.map((l) => (
                                    <React.Fragment key={`${l.driver}_${l.lapNumber}_inputs`}>
                                        <Line type="monotone" name={`${l.driver} Thr`} dataKey={`Throttle_${l.driver}_${l.lapNumber}`} stroke={l.color} strokeWidth={1.5} dot={false} connectNulls isAnimationActive={false} />
                                        <Line type="monotone" name={`${l.driver} Brk`} dataKey={`Brake_${l.driver}_${l.lapNumber}`} stroke={l.color} strokeWidth={1.5} strokeDasharray="4 3" dot={false} connectNulls isAnimationActive={false} />
                                    </React.Fragment>
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="f1-surface border border-[#2a2d3d] rounded-lg p-2 sm:p-3 relative h-[110px] sm:h-[120px]">
                        <span className="absolute top-2 left-2 sm:left-3 text-[8px] sm:text-[9px] font-black text-red-500/60 uppercase z-10 tracking-[0.2em]">Gear</span>
                        <ResponsiveContainer>
                            <LineChart data={data.telemetry} syncId="telemetry" margin={{ top: 18, right: 4, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1c1e2d" />
                                <XAxis dataKey="Distance" type="number" tick={{ fontSize: 9, fill: '#3a3d4d' }} tickFormatter={(v) => `${(v/1000).toFixed(1)}km`} axisLine={false} tickLine={false} />
                                <YAxis domain={[0, 9]} hide />
                                <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#e10600', strokeWidth: 1, opacity: 0.3 }} />
                                {laps.map((l) => (
                                    <Line key={`${l.driver}_gear`} name={`${l.driver} Gear`} type="stepAfter" dataKey={`nGear_${l.driver}_${l.lapNumber}`} stroke={l.color} strokeWidth={1.5} dot={false} connectNulls isAnimationActive={false} />
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="lg:col-span-1 f1-surface border border-[#2a2d3d] rounded-lg p-3 sm:p-4" style={{ minHeight: '400px' }}>
                    <DominanceMap dominance={data.dominance} laps={laps} driverColorMap={driverColorMap} />
                </div>
            </div>
        </div>
    );
};