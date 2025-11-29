import React from 'react';
import { ComposedChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Scatter, ErrorBar } from 'recharts';
import { formatTime } from '../../utils';

interface Props { data: any[]; domain: [number, number] | ['auto', 'auto']; }

export const RacePaceChart: React.FC<Props> = ({ data, domain }) => (
    <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
            key={Array.isArray(domain) ? domain.join('-') : 'auto'}
            data={data}
            layout="vertical"
            margin={{ top: 0, right: 30, left: 20, bottom: 20 }}
            barSize={12} 
        >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#333" opacity={0.4} />
            <YAxis type="category" dataKey="name" stroke="#9ca3af" tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 600 }} width={60} interval={0} axisLine={false} tickLine={false} />
            
            <XAxis 
                type="number" 
                domain={domain} 
                stroke="#525252" 
                tick={{ fill: '#737373', fontSize: 11 }} 
                tickFormatter={(val) => formatTime(val)}
                allowDataOverflow={true} 
                axisLine={{ stroke: '#404040' }} 
                tickLine={false} 
            />
            
            <Tooltip 
                cursor={{fill: '#ffffff', opacity: 0.05}}
                contentStyle={{ backgroundColor: 'rgba(23, 23, 23, 0.95)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', padding: '12px' }}
                separator="" 
                formatter={(value: any, name: string, props: any) => {
                    const { min, q1, median, q3, max } = props.payload;
                    if (name === 'Median') {
                        return [
                            <div key="tooltip" className="text-sm space-y-1">
                                <div className="flex justify-between gap-4 text-white"><span className="text-red-400">Min:</span> <span className="font-mono">{formatTime(min)}</span></div>
                                <div className="flex justify-between gap-4 text-white"><span className="text-red-400">Q1:</span> <span className="font-mono">{formatTime(q1)}</span></div>
                                <div className="flex justify-between gap-4 font-bold text-white"><span className="text-red-400">Median:</span> <span className="font-mono">{formatTime(median)}</span></div>
                                <div className="flex justify-between gap-4 text-white"><span className="text-red-400">Q3:</span> <span className="font-mono">{formatTime(q3)}</span></div>
                                <div className="flex justify-between gap-4 text-white"><span className="text-red-400">Max:</span> <span className="font-mono">{formatTime(max)}</span></div>
                            </div>
                        ];
                    }
                    return [];
                }}
            />
            
            <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '20px', paddingRight: '20px' }}
                payload={[
                    { value: 'IQR (Consistency)', type: 'rect', color: '#3b82f6' },
                    { value: 'Median Pace', type: 'circle', color: '#ef4444' },
                    { value: 'Range (Min/Max)', type: 'line', color: '#6b7280' }
                ]}
            />
            
            <Bar dataKey="q1" stackId="a" fill="transparent" />
            <Bar dataKey={(d: any) => d.q3 - d.q1} name="IQR" stackId="a" fill="#3b82f6" opacity={0.8} radius={[4, 4, 4, 4]} />
            <Scatter name="Median" dataKey="median" fill="#ef4444" shape="circle" r={4}>
                <ErrorBar dataKey="whiskerRange" width={2} strokeWidth={2} stroke="#6b7280" direction="x" />
            </Scatter>
        </ComposedChart>
    </ResponsiveContainer>
);