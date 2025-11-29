export const parseLapTime = (timeStr: string): number => {
    if (!timeStr) return 0;
    const cleanTime = timeStr.replace("0 days ", "").trim();
    const [hours, minutes, seconds] = cleanTime.split(":");
    return (
        parseInt(hours) * 3600 + 
        parseInt(minutes) * 60 + 
        parseFloat(seconds)
    );
};