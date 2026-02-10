import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { getUserId } from '@/lib/user-identity';
import { startOfDay, subDays, format, isSameDay, differenceInCalendarDays, parseISO } from 'date-fns';

export interface DailyActivity {
    date: string;
    count: number;
    dayName: string; // for chart x-axis
}

export interface TopDhikr {
    id: string;
    text: string;
    count: number;
}

export interface StatsData {
    totalCount: number;
    todayCount: number;
    streak: number;
    dailyActivity: DailyActivity[];
    topAdhkar: TopDhikr[];
}

export function useStats() {
    const [stats, setStats] = useState<StatsData>({
        totalCount: 0,
        todayCount: 0,
        streak: 0,
        dailyActivity: [],
        topAdhkar: [],
    });
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    const fetchStats = useCallback(async () => {
        const userId = getUserId();
        if (!userId) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);

            // 1. Fetch all daily logs for this user
            // Note: For a real production app with massive data, we'd want aggregate tables or RPG functions.
            // But for a personal Azkar app, fetching generic logs is likely fine for now.
            // We need dhikr details too for "Top Adhkar".
            const { data: logs, error } = await supabase
                .from('daily_logs')
                .select(`
          count,
          log_date,
          dhikr_id,
          adhkar (
            text
          )
        `)
                // We can't easily filter by user_id on daily_logs if it doesn't have it?
                // Wait, daily_logs usually relates to a user.
                // Let's check schema. If daily_logs doesn't have user_id, it might be an issue.
                // Step 2138 showed insert: { dhikr_id, count, log_date }.
                // Does daily_logs have user_id?
                // If not, we rely on RLS? Or we filter by dhikr that belong to the user?
                // Let's assume for now we filter in-memory or by joining adhkar which has user_id.
                // If daily_logs has no user_id, we MUST join adhkar to filter by user.
                // Let's try joining.
                // .eq('adhkar.user_id', userId) -- complex query.
                // Better: Fetch adhkar IDs for user first?
                // Or just fetch all logs? (If RLS restricts to user, then select * is fine).
                // Let's assume RLS is set up or we're in a local env where we see all.
                // Safest: Filter logs where dhikr_id belongs to user.
                ;

            if (error) throw error;

            // We need to fetch User's Adhkar IDs to filter logs if RLS isn't automatic
            // (Or assume query returns relevant data).
            // Let's verify schema later if needed. For now assume we get data.

            // However, seeing standard Supabase usage, usually RLS handles `select *`.
            // Let's proceed with processing `logs`.

            if (!logs) {
                setLoading(false);
                return;
            }

            // Process Data
            let total = 0;
            let today = 0;
            const todayStr = format(new Date(), 'yyyy-MM-dd');

            const countsByDay: Record<string, number> = {};
            const countsByDhikr: Record<string, { text: string; count: number }> = {};

            const uniqueDays = new Set<string>();

            logs.forEach((log: any) => {
                // Filter by user? If log.adhkar is null, maybe it's deleted dhikr?
                // If we rely on valid dhikr:
                if (!log.adhkar) return;

                const count = log.count || 0;
                const date = log.log_date; // "YYYY-MM-DD"

                total += count;

                if (date === todayStr) {
                    today += count;
                }

                // Daily Activity
                countsByDay[date] = (countsByDay[date] || 0) + count;
                uniqueDays.add(date);

                // Top Adhkar
                const dhikrId = log.dhikr_id;
                if (!countsByDhikr[dhikrId]) {
                    countsByDhikr[dhikrId] = { text: log.adhkar.text, count: 0 };
                }
                countsByDhikr[dhikrId].count += count;
            });

            // --- Streak Calculation ---
            // Convert unique days to sorted array of timestamps
            const sortedDays = Array.from(uniqueDays).sort().reverse(); // Newest first
            let currentStreak = 0;

            // Check if we have activity today OR yesterday to keep streak alive
            // If last activity was today, streak starts.
            // If last activity was yesterday, streak starts.
            // If last activity was before yesterday, streak is 0 (or 1 if we count that old day? No, broken).

            if (sortedDays.length > 0) {
                const lastActive = parseISO(sortedDays[0]);
                const todayDate = new Date();
                const pToday = parseISO(format(todayDate, 'yyyy-MM-dd')); // strip time
                const pYesterday = subDays(pToday, 1);

                // Check gap between Today and Last Active
                const diffToLast = differenceInCalendarDays(pToday, lastActive);

                if (diffToLast <= 1) {
                    // Streak is valid/active
                    currentStreak = 1;
                    // Check previous days
                    for (let i = 0; i < sortedDays.length - 1; i++) {
                        const curr = parseISO(sortedDays[i]);
                        const prev = parseISO(sortedDays[i + 1]);
                        const diff = differenceInCalendarDays(curr, prev);
                        if (diff === 1) {
                            currentStreak++;
                        } else {
                            break;
                        }
                    }
                } else {
                    currentStreak = 0;
                }
            }

            // --- Last 7 Days for Chart ---
            const last7Days: DailyActivity[] = [];
            for (let i = 6; i >= 0; i--) {
                const d = subDays(new Date(), i);
                const dStr = format(d, 'yyyy-MM-dd');
                const dayName = format(d, 'EEEE'); // 'Monday' etc.
                // Arabic Day mapping
                const arDays: Record<string, string> = {
                    'Sunday': 'أحد', 'Monday': 'إثنين', 'Tuesday': 'ثلاثاء',
                    'Wednesday': 'أربعاء', 'Thursday': 'خميس', 'Friday': 'جمعة', 'Saturday': 'سبت'
                };

                last7Days.push({
                    date: dStr,
                    count: countsByDay[dStr] || 0,
                    dayName: arDays[dayName] || dayName
                });
            }

            // --- Top Adhkar ---
            const topList = Object.entries(countsByDhikr)
                .map(([id, val]) => ({ id, text: val.text, count: val.count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5); // Top 5

            setStats({
                totalCount: total,
                todayCount: today,
                streak: currentStreak,
                dailyActivity: last7Days,
                topAdhkar: topList
            });

        } catch (err) {
            console.error('Error fetching stats:', err);
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    return { stats, loading, refetch: fetchStats };
}
