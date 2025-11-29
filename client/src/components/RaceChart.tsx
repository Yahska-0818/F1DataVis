import{ useEffect, useState } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { parseLapTime } from '../utils';

interface LapData {
    Driver: string;
    LapTime: string;
}

export const RaceChart = () => {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get('http://127.0.0.1:8000/api/race/2023/Monaco/Q')
            .then(res => {
                const rawData = res.data.data;
                const chartData = rawData.map((d: LapData) => ({
                    name: d.Driver,
                    seconds: parseLapTime(d.LapTime),
                    rawTime: d.LapTime
                }));

                setData(chartData);
                setLoading(false);
            })
            .catch(err => console.error("Error fetching race data:", err));
    }, []);

    if (loading) return <div className="p-10 text-xl">Loading Telemetry (First load takes ~10s)...</div>;

    return (
        <div className="h-96 w-full p-4 bg-gray-900 rounded-xl shadow-lg">
            <h2 className="text-white text-2xl mb-4 font-bold">Qualifying Pace (Monaco 2023)</h2>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                    <XAxis dataKey="name" stroke="#8884d8" />
                    <YAxis domain={['dataMin - 1', 'dataMax + 1']} hide /> 
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#1f2937', border: 'none', color: '#fff' }}
                        formatter={(value: number) => [`${value.toFixed(3)}s`, 'Time']}
                    />
                    <Bar dataKey="seconds" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                          {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index === 0 ? '#ef4444' : '#3b82f6'} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};