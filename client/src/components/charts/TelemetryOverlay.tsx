import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, ScatterChart, Scatter, Cell, CartesianGrid, ReferenceLine } from 'recharts';
import { formatTime } from '../../utils';

interface LapRef { driver: string; lapNumber: number; color: string; }
interface Props { year: number; gp: string; session: string; laps: LapRef[]; onClose: () => void; }

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
const CustomTooltip = ({ active, payload, unit = '' }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-neutral-900/90 border border-neutral-700 p-2 rounded shadow-xl text-xs backdrop-blur-sm">
                {payload.map((p: any) => (
                    <div key={p.dataKey} style={{ color: p.color }} className="flex justify-between gap-4 font-mono font-bold">
                        <span>{p.name}:</span>
                        <span>{Number(p.value).toFixed(3)}{unit}</span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};
const CommonChart = ({ title, metric, domain, height = 200, syncId = "telemetry", data, laps, unit = '' }: any) => (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 relative flex flex-col justify-center" style={{ height: `${height}px` }}>
        <span className="absolute top-2 left-3 text-[10px] font-bold text-neutral-500 uppercase z-10 tracking-wider">{title}</span>
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} syncId={syncId} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" opacity={0.4} />
                <XAxis dataKey="Distance" type="number" hide />
                <YAxis domain={domain} hide />
                <Tooltip content={<CustomTooltip unit={unit} />} cursor={{ stroke: '#fff', strokeWidth: 1, opacity: 0.2 }} />
                {laps.map((l: any) => (
                    <Line 
                        key={`${metric}_${l.driver}_${l.lapNumber}`} 
                        type="monotone" 
                        dataKey={`${metric}_${l.driver}_${l.lapNumber}`} 
                        name={`${l.driver} L${l.lapNumber}`}
                        stroke={l.color} 
                        strokeWidth={metric === 'Delta' ? 2 : 1.5} 
                        dot={false}
                        connectNulls={true}
                        isAnimationActive={false}
                    />
                ))}
                {metric === 'Delta' && <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />}
            </LineChart>
        </ResponsiveContainer>
    </div>
);

export const TelemetryOverlay: React.FC<Props> = ({ year, gp, session, laps, onClose }) => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const result = await axios.post(`${API_BASE_URL}/api/telemetry/compare`, {
                    year, gp, session, laps: laps.map(l => ({ driver: l.driver, lapNumber: l.lapNumber }))
                });
                setData(result.data.data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [year, gp, session, laps]);

    if (loading) return <div className="p-10 text-white text-center animate-pulse">Loading detailed telemetry...</div>;
    if (!data) return null;
    const getDriverColor = (driverCode: string) => {
        return laps.find(l => l.driver === driverCode)?.color || '#555';
    };

    return (
        <div className="flex flex-col gap-4 animate-fade-in p-6 bg-neutral-950 border border-white/10 rounded-3xl mt-8 shadow-2xl mb-20">
            <div className="flex flex-wrap justify-between items-center bg-neutral-900/80 p-4 rounded-2xl border border-white/5 gap-4">
                <div className="flex flex-wrap gap-4">
                    {data.summary.map((s: any) => {
                        const lapInfo = laps.find(l => l.driver === s.driver && l.lapNumber === s.lap);
                        const color = lapInfo ? lapInfo.color : '#fff';
                        const isFastest = s.diff === 0;
                        
                        return (
                            <div key={`${s.driver}-${s.lap}`} className="flex items-center gap-3 bg-neutral-800/50 px-4 py-2 rounded-xl border border-white/5">
                                <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: color }} />
                                <div>
                                    <div className="text-xs font-bold text-neutral-400">{s.driver} L{s.lap}</div>
                                    <div className="text-sm font-mono font-bold text-white flex items-center gap-2">
                                        {formatTime(s.time)}
                                        {!isFastest && <span className="text-red-400 text-xs">+{s.diff.toFixed(3)}</span>}
                                        {isFastest && <span className="text-green-400 text-xs">PURPLE</span>}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <button onClick={onClose} className="text-xs text-red-400 hover:text-red-300 font-bold uppercase tracking-wider px-4 py-2 border border-red-500/30 rounded-lg hover:bg-red-500/10 transition-colors">
                    Close Comparison
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3 flex flex-col gap-4">
                    <CommonChart title="Delta (s)" metric="Delta" domain={['auto', 'auto']} data={data.telemetry} laps={laps} unit="s" />
                    <CommonChart title="Speed (km/h)" metric="Speed" domain={['auto', 'auto']} data={data.telemetry} laps={laps} unit="km/h" />
                    <CommonChart title="RPM" metric="RPM" domain={['auto', 'auto']} height={150} data={data.telemetry} laps={laps} />
                    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 relative h-[180px]">
                        <span className="absolute top-2 left-3 text-[10px] font-bold text-neutral-500 uppercase z-10 tracking-wider">Inputs (Solid: Thr, Dot: Brk)</span>
                        <ResponsiveContainer>
                            <LineChart data={data.telemetry} syncId="telemetry" margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" opacity={0.4} />
                                <XAxis dataKey="Distance" type="number" hide />
                                <YAxis domain={[0, 105]} hide />
                                <Tooltip content={<CustomTooltip unit="%" />} cursor={{ stroke: '#fff', strokeWidth: 1, opacity: 0.2 }} />
                                {laps.map((l) => (
                                    <React.Fragment key={`${l.driver}_${l.lapNumber}`}>
                                        <Line type="monotone" name={`${l.driver} Thr`} dataKey={`Throttle_${l.driver}_${l.lapNumber}`} stroke={l.color} strokeWidth={1.5} dot={false} connectNulls={true} />
                                        <Line type="monotone" name={`${l.driver} Brk`} dataKey={`Brake_${l.driver}_${l.lapNumber}`} stroke={l.color} strokeWidth={1.5} strokeDasharray="3 3" dot={false} connectNulls={true} />
                                    </React.Fragment>
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 relative h-[150px]">
                        <span className="absolute top-2 left-3 text-[10px] font-bold text-neutral-500 uppercase z-10 tracking-wider">Gear & DRS</span>
                        <ResponsiveContainer>
                            <LineChart data={data.telemetry} syncId="telemetry" margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" opacity={0.4} />
                                <XAxis dataKey="Distance" type="number" tick={{ fontSize: 10, fill: '#555' }} tickFormatter={(v) => `${(v/1000).toFixed(1)}km`} />
                                <YAxis domain={[0, 8]} hide />
                                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#fff', strokeWidth: 1, opacity: 0.2 }} />
                                {laps.map((l) => (
                                    <Line key={`${l.driver}_gear`} name={`${l.driver} Gear`} type="stepAfter" dataKey={`nGear_${l.driver}_${l.lapNumber}`} stroke={l.color} strokeWidth={1.5} dot={false} connectNulls={true} />
                                ))}
                                {laps.map((l) => (
                                    <Line key={`${l.driver}_drs`} name={`${l.driver} DRS`} type="stepAfter" dataKey={`DRS_${l.driver}_${l.lapNumber}`} stroke={l.color} strokeWidth={4} strokeOpacity={0.2} dot={false} connectNulls={true} />
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="lg:col-span-1 h-full min-h-[400px] bg-neutral-900/50 border border-neutral-800 rounded-3xl p-4 relative flex flex-col sticky top-4">
                    <h3 className="text-white font-bold mb-4 text-center uppercase tracking-widest text-xs">Dominance Map</h3>
                    <div className="flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                                <XAxis type="number" dataKey="X" hide domain={['dataMin', 'dataMax']} />
                                <YAxis type="number" dataKey="Y" hide domain={['dataMin', 'dataMax']} />
                                <Tooltip cursor={false} content={() => null} />
                                <Scatter data={data.dominance} line={false} shape="circle">
                                    {data.dominance.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={getDriverColor(entry.FastestDriver)} />
                                    ))}
                                </Scatter>
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-4 text-[10px] text-neutral-500 text-center font-mono">
                        Colored by fastest driver in mini-sector
                    </div>
                </div>
            </div>
        </div>
    );
};