export const parseLapTime = (timeStr: string | number): number => {
    if (typeof timeStr === 'number') return timeStr;
    if (!timeStr) return 0;
    const cleanTime = timeStr.replace("0 days ", "").trim();
    if (cleanTime.includes(':')) {
        const parts = cleanTime.split(':');
        if (parts.length === 3) {
            return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseFloat(parts[2]);
        }
        if (parts.length === 2) {
            return parseInt(parts[0]) * 60 + parseFloat(parts[1]);
        }
    }
    return parseFloat(cleanTime);
};

export const formatTime = (seconds: number): string => {
    if (!Number.isFinite(seconds)) return "0:00.000";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = (seconds % 60).toFixed(3);
    const secondsStr = parseFloat(remainingSeconds) < 10 ? `0${remainingSeconds}` : remainingSeconds;
    return `${minutes}:${secondsStr}`;
};