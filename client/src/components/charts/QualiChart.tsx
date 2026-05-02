import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { formatTime } from '../../utils';

interface Props { data: any[]; }

const SECTOR_COLORS = ['#ef4444', '#f59e0b', '#3b82f6'];
const SECTOR_NAMES = ['Sector 1', 'Sector 2', 'Sector 3'];

const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const d = payload[0]?.payload;
    if (!d) return null;
    return (
        <div className="bg-[#161825]/95 backdrop-blur-md border border-[#2a2d3d] px-4 py-3 rounded-lg shadow-2xl">
            <div className="text-white font-bold text-sm mb-2 pb-1.5 border-b border-[#2a2d3d]">{d.name}</div>
            <div className="space-y-1">
                {['s1', 's2', 's3'].map((key, i) => (
                    <div key={key} className="flex justify-between gap-6 text-xs">
                        <span style={{ color: SECTOR_COLORS[i] }} className="font-semibold">{SECTOR_NAMES[i]}</span>
                        <span className="text-white font-mono font-medium">{formatTime(d[key])}</span>
                    </div>
                ))}
                <div className="flex justify-between gap-6 text-xs pt-1.5 mt-1.5 border-t border-[#2a2d3d]">
                    <span className="text-neutral-400 font-semibold">Total</span>
                    <span className="text-white font-mono font-bold">{formatTime(d.total)}</span>
                </div>
                {d.gap !== undefined && d.gap > 0 && (
                    <div className="flex justify-between gap-6 text-xs">
                        <span className="text-neutral-500">Gap</span>
                        <span className="text-red-400 font-mono">+{d.gap.toFixed(3)}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export const QualiChart: React.FC<Props> = ({ data }) => {
    const enrichedData = data.map((d, i) => ({
        ...d,
        gap: i === 0 ? 0 : d.total - data[0].total,
    }));

    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={enrichedData} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }} barSize={18}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#1c1e2d" />
                <YAxis type="category" dataKey="name" stroke="transparent" tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 600 }} width={55} interval={0} axisLine={false} tickLine={false} />
                <XAxis type="number" domain={['dataMin - 0.5', 'dataMax + 0.5']} hide />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                <Legend wrapperStyle={{ paddingTop: '16px' }} iconType="circle" iconSize={8}
                    formatter={(value: string) => <span className="text-xs text-neutral-400 font-medium">{value}</span>}
                />
                <Bar dataKey="s1" name="S1" stackId="a" fill={SECTOR_COLORS[0]} radius={[4, 0, 0, 4]} />
                <Bar dataKey="s2" name="S2" stackId="a" fill={SECTOR_COLORS[1]} />
                <Bar dataKey="s3" name="S3" stackId="a" fill={SECTOR_COLORS[2]} radius={[0, 4, 4, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
};