import { differenceInCalendarDays, parseISO, format } from 'date-fns';

export interface StreakResult {
    currentStreak: number;
    longestStreak: number;
}

export function calculateStreaks(dates: string[]): StreakResult {
    if (!dates.length) return { currentStreak: 0, longestStreak: 0 };

    // Sort dates descending (newest first) unique
    const uniqueDates = Array.from(new Set(dates)).sort((a, b) => b.localeCompare(a));

    // 1. Calculate Current Streak
    let currentStreak = 0;
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const lastActive = uniqueDates[0]; // Newest date

    // Check if streak is alive (active today or yesterday)
    const diffToLast = differenceInCalendarDays(parseISO(todayStr), parseISO(lastActive));

    if (diffToLast <= 1) {
        currentStreak = 1;
        for (let i = 0; i < uniqueDates.length - 1; i++) {
            const curr = parseISO(uniqueDates[i]);
            const prev = parseISO(uniqueDates[i + 1]);
            const diff = differenceInCalendarDays(curr, prev);
            if (diff === 1) {
                currentStreak++;
            } else {
                break;
            }
        }
    }

    // 2. Calculate Longest Streak
    let longestStreak = 0;
    let tempStreak = 1;

    // Scan through all dates to find max consecutive sequence
    // We can just iterate linearly
    if (uniqueDates.length > 0) {
        longestStreak = 1; // At least 1 day if we have dates
        for (let i = 0; i < uniqueDates.length - 1; i++) {
            const curr = parseISO(uniqueDates[i]);
            const prev = parseISO(uniqueDates[i + 1]);
            const diff = differenceInCalendarDays(curr, prev);

            if (diff === 1) {
                tempStreak++;
            } else {
                // Streak broken
                tempStreak = 1;
            }
            if (tempStreak > longestStreak) {
                longestStreak = tempStreak;
            }
        }
    }

    return { currentStreak, longestStreak };
}
