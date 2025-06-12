// timeHelper.js
import dayjs from 'dayjs';

// Use ES module export for compatibility with named import in TS/JS
function calculateSessionDuration(startTime, endTime) {
    if (!startTime || !endTime) {
        return {
            seconds: 0,
            readable: '00:00'
        };
    }
    const durationSeconds = dayjs(endTime).diff(dayjs(startTime), 'second');
    const formatted = formatDuration(durationSeconds);
    return {
        seconds: durationSeconds,
        readable: formatted
    };
}

function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

export { calculateSessionDuration };

