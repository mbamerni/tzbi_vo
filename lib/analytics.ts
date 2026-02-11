import { differenceInCalendarDays, parseISO, format, startOfDay, subMonths, eachDayOfInterval, isSameDay } from 'date-fns';
import { ar } from 'date-fns/locale';

export interface StreakResult {
    currentStreak: number;
    longestStreak: number;
}

export interface HeatmapItem {
    date: string;
    count: number;
    level: 0 | 1 | 2 | 3 | 4; // Contribution level
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

export function calculateDailyCompletion(todayCount: number, dailyTarget: number): number {
    if (dailyTarget === 0) return 0;
    return Math.min(Math.round((todayCount / dailyTarget) * 100), 100);
}

export function prepareHeatmapData(logs: any[]): HeatmapItem[] {
    const today = new Date();
    const threeMonthsAgo = subMonths(today, 3);
    const dateRange = eachDayOfInterval({ start: threeMonthsAgo, end: today });

    const countsByDay: Record<string, number> = {};
    logs.forEach(log => {
        const date = log.log_date;
        countsByDay[date] = (countsByDay[date] || 0) + (log.count || 0);
    });

    return dateRange.map(date => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const count = countsByDay[dateStr] || 0;

        let level: 0 | 1 | 2 | 3 | 4 = 0;
        if (count > 0) level = 1;
        if (count >= 10) level = 2;
        if (count >= 50) level = 3;
        if (count >= 100) level = 4;

        return {
            date: dateStr,
            count,
            level
        };
    });
}
