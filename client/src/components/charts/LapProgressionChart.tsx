import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { formatTime } from '../../utils';

interface Props {
    data: any[];
    selectedDrivers: string[];
    driverColorMap: Record<string, string>;
    showOutliers: boolean;
    onPointClick: (driver: string, lap: number) => void;
}

const FALLBACK_COLORS = [
    '#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6',
    '#EC4899', '#6366F1', '#14B8A6', '#F97316', '#06B6D4',
];

const CustomTooltip = ({ active, payload, label, driverColorMap }: any) => {
    if (!active || !payload || !payload.length) return null;
    return (
        <div className="bg-[#161825]/95 backdrop-blur-md border border-[#2a2d3d] px-4 py-3 rounded-lg shadow-2xl min-w-[140px]">
            <div className="text-neutral-400 text-[10px] font-semibold uppercase tracking-wider mb-2">Lap {label}</div>
            <div className="space-y-1">
                {payload.filter((p: any) => p.value != null).map((p: any) => (
                    <div key={p.dataKey} className="flex justify-between gap-4 text-xs">
                        <span className="font-bold" style={{ color: driverColorMap?.[p.dataKey] || p.color }}>{p.dataKey}</span>
                        <span className="text-white font-mono font-medium">{formatTime(p.value)}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const LapProgressionChart: React.FC<Props> = ({ data, selectedDrivers, driverColorMap, showOutliers, onPointClick }) => {
    if (!selectedDrivers || selectedDrivers.length === 0) {
        return <div className="flex items-center justify-center h-full text-neutral-500 text-sm">Select drivers and click Analyze.</div>;
    }

    const filteredData = data.filter(d =>
        selectedDrivers.includes(d.Driver) &&
        (showOutliers ? true : d.IsAccurate)
    );

    if (filteredData.length === 0) {
        return <div className="flex items-center justify-center h-full text-neutral-600 text-sm">No lap data matches the criteria.</div>;
    }

    const chartDataMap = new Map();
    let minTime = Infinity;
    let maxTime = -Infinity;

    filteredData.forEach(d => {
        const lap = Number(d.LapNumber);
        if (!chartDataMap.has(lap)) chartDataMap.set(lap, { lap });
        const entry = chartDataMap.get(lap);

        let time = 0;
        if (typeof d.LapTime === 'number') {
            time = d.LapTime;
        } else if (typeof d.LapTime === 'string') {
            if (d.LapTime.includes(':')) {
                const parts = d.LapTime.split(':');
                if (parts.length === 2) time = parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
                else if (parts.length === 3) time = parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
            } else {
                time = parseFloat(d.LapTime);
            }
        }

        if (time > 0) {
            entry[d.Driver] = time;
            if (time < minTime) minTime = time;
            if (time > maxTime) maxTime = time;
        }
    });

    const chartData = Array.from(chartDataMap.values()).sort((a, b) => a.lap - b.lap);
    const padding = (maxTime - minTime) * 0.1;
    const yDomain = isFinite(minTime) && isFinite(maxTime)
        ? [Math.max(0, minTime - padding), maxTime + padding]
        : ['auto', 'auto'];

    const getColor = (driver: string, index: number) =>
        driverColorMap[driver] || FALLBACK_COLORS[index % FALLBACK_COLORS.length];

    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 0, right: 20, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#1c1e2d" />
                <XAxis
                    dataKey="lap"
                    type="number"
                    domain={['dataMin', 'dataMax']}
                    stroke="transparent"
                    tick={{ fill: '#6b7280', fontSize: 11 }}
                    tickCount={10}
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                    label={{ value: 'Lap', position: 'bottom', fill: '#404040', fontSize: 10, offset: 5 }}
                />
                <YAxis
                    domain={yDomain as any}
                    stroke="transparent"
                    tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}
                    width={55}
                    tickFormatter={(val) => formatTime(val)}
                    axisLine={false}
                    tickLine={false}
                />
                <Tooltip content={<CustomTooltip driverColorMap={driverColorMap} />} cursor={{ stroke: '#e10600', strokeWidth: 1, opacity: 0.3 }} />
                <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '12px' }}
                    formatter={(value: string) => <span className="text-xs font-semibold" style={{ color: driverColorMap[value] || '#999' }}>{value}</span>}
                />
                {selectedDrivers.map((driver, index) => (
                    <Line
                        key={driver}
                        type="monotone"
                        dataKey={driver}
                        stroke={getColor(driver, index)}
                        strokeWidth={2}
                        dot={{ r: 3, fill: getColor(driver, index), stroke: '#111320', strokeWidth: 1.5 }}
                        activeDot={(props: any) => {
                            const { cx, cy, payload } = props;
                            return (
                                <circle
                                    cx={cx} cy={cy} r={4}
                                    fill={getColor(driver, index)}
                                    stroke="#111320" strokeWidth={2}
                                    onClick={() => { if (payload?.lap != null) onPointClick(driver, payload.lap); }}
                                    style={{ cursor: 'pointer' }}
                                />
                            );
                        }}
                        connectNulls={true}
                    />
                ))}
            </LineChart>
        </ResponsiveContainer>
    );
};