import { differenceInCalendarDays, parseISO, format, startOfDay } from 'date-fns';

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

    // Use local time for "today"
    const today = startOfDay(new Date());
    // The input 'dates' are YYYY-MM-DD strings. 
    // We treat them as local calendar dates.
    const lastActiveStr = uniqueDates[0];
    const lastActive = parseISO(lastActiveStr); // parseISO("2023-01-01") -> Local midnight

    // Check if streak is alive (active today or yesterday)
    // differenceInCalendarDays returns integer difference in days
    const diffToLast = differenceInCalendarDays(today, lastActive);

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

    if (uniqueDates.length > 0) {
        longestStreak = 1;
        for (let i = 0; i < uniqueDates.length - 1; i++) {
            const curr = parseISO(uniqueDates[i]);
            const prev = parseISO(uniqueDates[i + 1]);
            const diff = differenceInCalendarDays(curr, prev);

            if (diff === 1) {
                tempStreak++;
            } else {
                tempStreak = 1;
            }
            if (tempStreak > longestStreak) {
                longestStreak = tempStreak;
            }
        }
    }

    return { currentStreak, longestStreak };
}
