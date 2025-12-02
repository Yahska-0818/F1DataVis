import { parseLapTime } from '../utils';

export const calculateBoxPlotData = (data: any[]) => {
    const driverLaps: { [key: string]: number[] } = {};
    data.forEach(d => {
        const time = parseLapTime(d.LapTime);
        if (time > 0) {
            if (!driverLaps[d.Driver]) driverLaps[d.Driver] = [];
            driverLaps[d.Driver].push(time);
        }
    });

    const boxData = Object.keys(driverLaps).map(driver => {
        const times = driverLaps[driver].sort((a, b) => a - b);
        const q1 = times[Math.floor(times.length * 0.25)];
        const median = times[Math.floor(times.length * 0.5)];
        const q3 = times[Math.floor(times.length * 0.75)];
        const iqr = q3 - q1;
        const lowerFence = q1 - (1 * iqr);
        const upperFence = q3 + (1 * iqr);
        
        const cleanTimes = times.filter(t => t >= lowerFence && t <= upperFence);
        const min = cleanTimes.length > 0 ? cleanTimes[0] : times[0];
        const max = cleanTimes.length > 0 ? cleanTimes[cleanTimes.length - 1] : times[times.length - 1];

        return {
            name: driver,
            min, 
            q1, 
            median, 
            q3, 
            max,
            whiskerRange: [median - min, max - median],
            sortValue: median 
        };
    });
    return boxData.sort((a, b) => a.sortValue - b.sortValue);
};

export const processQualiData = (data: any[]) => {
    const uniqueDrivers = new Map();
    data.forEach((d: any) => {
        const time = parseLapTime(d.LapTime);
        if (!uniqueDrivers.has(d.Driver) || time < uniqueDrivers.get(d.Driver).total) {
            uniqueDrivers.set(d.Driver, {
                name: d.Driver,
                s1: parseLapTime(d.Sector1Time),
                s2: parseLapTime(d.Sector2Time),
                s3: parseLapTime(d.Sector3Time),
                total: time,
            });
        }
    });
    return Array.from(uniqueDrivers.values()).sort((a: any, b: any) => a.total - b.total);
};