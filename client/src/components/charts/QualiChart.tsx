import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

interface Props { data: any[]; }

export const QualiChart: React.FC<Props> = ({ data }) => (
    <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }} barSize={24}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#333" opacity={0.4} />
            <YAxis type="category" dataKey="name" stroke="#9ca3af" tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 600 }} width={60} interval={0} axisLine={false} tickLine={false} />
            <XAxis type="number" domain={['dataMin - 1', 'dataMax + 1']} hide />
            <Tooltip 
                cursor={{fill: '#ffffff', opacity: 0.05}}
                contentStyle={{ backgroundColor: 'rgba(23, 23, 23, 0.9)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} 
                itemStyle={{ color: '#e5e5e5' }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
            <Bar dataKey="s1" name="Sector 1" stackId="a" fill="#ef4444" radius={[4, 0, 0, 4]} />
            <Bar dataKey="s2" name="Sector 2" stackId="a" fill="#f59e0b" />
            <Bar dataKey="s3" name="Sector 3" stackId="a" fill="#3b82f6" radius={[0, 4, 4, 0]} />
        </BarChart>
    </ResponsiveContainer>
);