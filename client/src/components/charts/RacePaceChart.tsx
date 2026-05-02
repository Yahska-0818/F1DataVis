import React from 'react';
import { ComposedChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Scatter, ErrorBar } from 'recharts';
import { formatTime } from '../../utils';

interface Props { data: any[]; domain: [number, number] | ['auto', 'auto']; }

const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const d = payload[0]?.payload;
    if (!d) return null;
    return (
        <div className="bg-[#161825]/95 backdrop-blur-md border border-[#2a2d3d] px-4 py-3 rounded-lg shadow-2xl">
            <div className="text-white font-bold text-sm mb-2 pb-1.5 border-b border-[#2a2d3d]">{d.name}</div>
            <div className="space-y-1 text-xs">
                <div className="flex justify-between gap-6"><span className="text-emerald-400 font-semibold">Min</span><span className="text-white font-mono">{formatTime(d.min)}</span></div>
                <div className="flex justify-between gap-6"><span className="text-blue-400 font-semibold">Q1</span><span className="text-white font-mono">{formatTime(d.q1)}</span></div>
                <div className="flex justify-between gap-6 font-bold"><span className="text-red-400">Median</span><span className="text-white font-mono">{formatTime(d.median)}</span></div>
                <div className="flex justify-between gap-6"><span className="text-blue-400 font-semibold">Q3</span><span className="text-white font-mono">{formatTime(d.q3)}</span></div>
                <div className="flex justify-between gap-6"><span className="text-orange-400 font-semibold">Max</span><span className="text-white font-mono">{formatTime(d.max)}</span></div>
            </div>
        </div>
    );
};

export const RacePaceChart: React.FC<Props> = ({ data, domain }) => (
    <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
            key={Array.isArray(domain) ? domain.join('-') : 'auto'}
            data={data}
            layout="vertical"
            margin={{ top: 0, right: 30, left: 10, bottom: 20 }}
            barSize={14}
        >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#1c1e2d" />
            <YAxis type="category" dataKey="name" stroke="transparent" tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 600 }} width={55} interval={0} axisLine={false} tickLine={false} />
            <XAxis type="number" domain={domain} stroke="transparent" tick={{ fill: '#4a4d5d', fontSize: 10 }} tickFormatter={(val) => `${val.toFixed(1)}s`} allowDataOverflow={true} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
            <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '16px', paddingRight: '10px' }}
                {...({
                    payload: [
                        { value: 'IQR', type: 'rect', color: '#3b82f6' },
                        { value: 'Median', type: 'circle', color: '#ef4444' },
                        { value: 'Range', type: 'line', color: '#4a4d5d' }
                    ]
                } as any)}
                formatter={(value: string) => <span className="text-xs text-neutral-400 font-medium">{value}</span>}
            />
            <Bar dataKey="q1" stackId="a" fill="transparent" />
            <Bar dataKey={(d: any) => d.q3 - d.q1} name="IQR" stackId="a" fill="#3b82f6" opacity={0.7} radius={[4, 4, 4, 4]} />
            <Scatter name="Median" dataKey="median" fill="#ef4444" shape="circle" r={5}>
                <ErrorBar dataKey="whiskerRange" width={2} strokeWidth={1.5} stroke="#4a4d5d" direction="x" />
            </Scatter>
        </ComposedChart>
    </ResponsiveContainer>
);