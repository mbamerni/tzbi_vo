import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { startOfDay, subDays, format, isSameDay, differenceInCalendarDays, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';
import { calculateStreaks, prepareHeatmapData, calculateDailyCompletion, HeatmapItem } from '@/lib/analytics';

export interface DailyActivity {
    date: string;
    count: number;
    dayName: string; // for chart x-axis
}

export interface TopDhikr {
    id: string;
    text: string;
    count: number;
    target: number;
    daysActive: number;
    adherence: number;
}

export interface StatsData {
    totalCount: number;
    todayCount: number;
    todayCompletion: number;
    streak: number;
    longestStreak: number;
    dailyActivity: DailyActivity[];
    heatmapData: HeatmapItem[];
    topAdhkar: TopDhikr[];
}

export function useStats() {
    const [stats, setStats] = useState<StatsData>({
        totalCount: 0,
        todayCount: 0,
        todayCompletion: 0,
        streak: 0,
        longestStreak: 0,
        dailyActivity: [],
        heatmapData: [],
        topAdhkar: [],
    });
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    const fetchStats = useCallback(async () => {
        try {
            setLoading(true);

            // Get current user (session should be established by useAdhkarData or root layout)
            const { data: { session } } = await supabase.auth.getSession();
            const userId = session?.user?.id;

            if (!userId) {
                // If not logged in, we can't show stats yet.
                setLoading(false);
                return;
            }

            const { data: logs, error } = await supabase
                .from('daily_logs')
                .select(`
                    count,
                    log_date,
                    dhikr_id,
                    adhkar (
                        text,
                        target_count
                    )
                `);

            if (error) throw error;

            if (!logs) {
                setLoading(false);
                return;
            }

            // Process Data
            let total = 0;
            let today = 0;
            let todayTarget = 0; // rough estimate sum of targets for adhkar done today
            const todayStr = format(new Date(), 'yyyy-MM-dd');

            const countsByDay: Record<string, number> = {};
            const countsByDhikr: Record<string, { text: string; count: number; target: number; days: Set<string> }> = {};

            const uniqueDays = new Set<string>();

            // We need a map of adhkar targets to calculate "Total Target of Today" accurately
            // even if not performed today? 
            // The prompt says "Completion Rate (Actual / Target)". 
            // Usually this means "Of the adhkar I *should* do today, how many did I do?".
            // But we don't know "what I should do" unless we fetch all active adhkar.
            // Currently we only fetch logs.
            // Let's rely on logs for "Active Adhkar". 
            // Or better: Use the sum of targets of adhkar *logged today* as a baseline? 
            // Or just fetch all adhkar? 
            // Fetching all adhkar is cleaner to know the TRUE target.
            // Let's fetch all active adhkar for the user to get the denominator.

            const { data: allAdhkar } = await supabase
                .from('adhkar')
                .select('target_count')
                .eq('user_id', userId)
                .eq('is_active', true);

            const dailyTotalTarget = allAdhkar?.reduce((sum, d) => sum + (d.target_count || 0), 0) || 1;

            logs.forEach((log: any) => {
                // Filter out if adhkar is null (deleted?)
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

                // Top Adhkar (Adherence Calculation)
                const dhikrId = log.dhikr_id;
                if (!countsByDhikr[dhikrId]) {
                    countsByDhikr[dhikrId] = {
                        text: log.adhkar.text,
                        count: 0,
                        target: log.adhkar.target_count || 1,
                        days: new Set()
                    };
                }
                countsByDhikr[dhikrId].count += count;
                countsByDhikr[dhikrId].days.add(date);
            });

            // --- Streak Calculation ---
            const { currentStreak, longestStreak } = calculateStreaks(Array.from(uniqueDays));

            // --- Today Completion ---
            const todayCompletion = calculateDailyCompletion(today, dailyTotalTarget);

            // --- Heatmap Data ---
            const heatmapData = prepareHeatmapData(logs);

            // --- Last 7 Days ---
            const last7Days: DailyActivity[] = [];
            for (let i = 6; i >= 0; i--) {
                const d = subDays(new Date(), i);
                const dStr = format(d, 'yyyy-MM-dd');
                const dayName = format(d, 'EEEE');
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

            // --- Top Adhkar (Adherence) ---
            const topList = Object.entries(countsByDhikr)
                .map(([id, val]) => {
                    const daysActive = val.days.size;
                    // Total Target = Target * Days Active
                    const totalTarget = val.target * daysActive;

                    // Adherence = (Total Count / Total Target) * 100
                    let adherence = 0;
                    if (totalTarget > 0) {
                        adherence = (val.count / totalTarget) * 100;
                    }

                    return {
                        id,
                        text: val.text,
                        count: val.count,
                        target: val.target,
                        daysActive,
                        adherence
                    };
                })
                .sort((a, b) => b.adherence - a.adherence) // Sort by adherence %
                .slice(0, 3); // Top 3 as requested

            setStats({
                totalCount: total,
                todayCount: today,
                todayCompletion,
                streak: currentStreak,
                longestStreak: longestStreak,
                dailyActivity: last7Days,
                heatmapData,
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
