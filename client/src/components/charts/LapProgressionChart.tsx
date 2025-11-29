import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

interface Props { 
    data: any[]; 
    selectedDrivers: string[];
    showOutliers: boolean;
}

const DRIVER_COLORS = [
    '#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', 
    '#EC4899', '#6366F1', '#14B8A6', '#F97316', '#06B6D4'
];

export const LapProgressionChart: React.FC<Props> = ({ data, selectedDrivers, showOutliers }) => {
    if (!selectedDrivers || selectedDrivers.length === 0) {
        return <div className="flex items-center justify-center h-full text-neutral-500">Select drivers to view progression.</div>;
    }

    const filteredData = data.filter(d => 
        selectedDrivers.includes(d.Driver) && 
        (showOutliers ? true : d.IsAccurate)
    );

    if (filteredData.length === 0) {
        return <div className="flex items-center justify-center h-full text-neutral-500">No lap data matches the criteria.</div>;
    }

    const chartDataMap = new Map();
    let minTime = Infinity;
    let maxTime = -Infinity;

    filteredData.forEach(d => {
        const lap = Number(d.LapNumber);
        if (!chartDataMap.has(lap)) {
            chartDataMap.set(lap, { lap });
        }
        const entry = chartDataMap.get(lap);
        
        let time = 0;
        if (typeof d.LapTime === 'number') {
            time = d.LapTime;
        } else if (typeof d.LapTime === 'string') {
            if (d.LapTime.includes(':')) {
                const parts = d.LapTime.split(':');
                if (parts.length === 2) {
                    time = parseFloat(parts[0]) * 60 + parseFloat(parts[1]); 
                } else if (parts.length === 3) {
                    time = parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]); 
                }
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

    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 0, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#333" opacity={0.4} />
                <XAxis 
                    dataKey="lap" 
                    type="number" 
                    domain={['dataMin', 'dataMax']} 
                    stroke="#525252"
                    tick={{ fill: '#737373', fontSize: 11 }}
                    tickCount={10}
                    allowDecimals={false}
                    axisLine={{ stroke: '#404040' }}
                    tickLine={false}
                />
                <YAxis 
                    domain={yDomain as any} 
                    stroke="#9ca3af"
                    tick={{ fill: '#9ca3af', fontSize: 11 }} 
                    width={50}
                    tickFormatter={(val) => val.toFixed(1)}
                    axisLine={false}
                    tickLine={false}
                />
                <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(23, 23, 23, 0.95)', backdropFilter: 'blur(8px)', borderColor: '#333', color: '#fff', borderRadius: '12px' }}
                    labelFormatter={(label) => `Lap ${label}`}
                    formatter={(value: number) => [`${value.toFixed(3)}s`]}
                />
                <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '20px' }}/>
                {selectedDrivers.map((driver, index) => (
                    <Line 
                        key={driver}
                        type="monotone"
                        dataKey={driver}
                        stroke={DRIVER_COLORS[index % DRIVER_COLORS.length]}
                        strokeWidth={2}
                        dot={{ r: 2 }}
                        activeDot={{ r: 5 }}
                        connectNulls={true} 
                    />
                ))}
            </LineChart>
        </ResponsiveContainer>
    );
};