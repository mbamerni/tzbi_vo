import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { startOfDay, subDays, format, isSameDay, differenceInCalendarDays, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';
import { calculateStreaks, prepareHeatmapData, calculateDailyCompletion, HeatmapItem } from '@/lib/analytics';

export interface DailyActivity {
    date: string;
    score: number; // 0-100%
    dayName: string;
}

export interface TopDhikr {
    id: string;
    text: string;
    avgCompletion: number; // Average daily completion %
    daysActive: number;
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

export type DateRange = 'week' | 'month' | '3months';

export function useStats(range: DateRange = 'week') {
    const [stats, setStats] = useState<StatsData>({
        totalCount: 0,
        todayCount: 0,
        todayCompletion: 0,
        streak: 0,
        longestStreak: 0,
        dailyActivity: [], // Now stores percentage scores
        heatmapData: [],
        topAdhkar: [],
    });
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    const fetchStats = useCallback(async () => {
        try {
            setLoading(true);

            const { data: { session } } = await supabase.auth.getSession();
            const userId = session?.user?.id;

            if (!userId) {
                setLoading(false);
                return;
            }

            // 1. Fetch Active Adhkar (to know targets)
            // We need this to calculate "Unweighted Average Completion"
            const { data: allAdhkar } = await supabase
                .from('adhkar')
                .select('id, text, target_count')
                .eq('user_id', userId)
                .eq('is_active', true);

            const activeAdhkarMap = new Map<string, { text: string, target: number }>();
            allAdhkar?.forEach(a => activeAdhkarMap.set(a.id, { text: a.text, target: a.target_count || 1 }));
            const totalActiveAdhkarCount = activeAdhkarMap.size || 1;

            // 2. Fetch Logs (Filtered by user!)
            // We might need a date filter for efficiency, but for streaks/heatmap we need history.
            // Let's fetch last 3 months for charts/heatmap, and ALL for streaks?
            // "Streaks" usually implies looking back until a break. 
            // "Lifetime Total" needs all. 
            // supabase.rpc for total count? 
            // For now, let's just fetch all logs. If it gets slow, we optimize.

            let query = supabase
                .from('daily_logs')
                .select(`
                    count,
                    log_date,
                    dhikr_id
                `)
                .eq('user_id', userId); // SECURITY FIX: Filter by user_id

            const { data: logs, error } = await query;

            if (error) throw error;
            if (!logs) {
                setLoading(false);
                return;
            }

            // --- Process Data ---
            let total = 0;
            let todayCount = 0;
            const todayStr = format(new Date(), 'yyyy-MM-dd');
            const uniqueDays = new Set<string>();

            // Map: Date -> { dhikrId: count }
            const logsByDay: Record<string, Record<string, number>> = {};

            logs.forEach((log: any) => {
                const count = log.count || 0;
                const date = log.log_date;
                const dhikrId = log.dhikr_id;

                total += count;
                uniqueDays.add(date);

                if (date === todayStr) {
                    todayCount += count;
                }

                if (!logsByDay[date]) logsByDay[date] = {};
                logsByDay[date][dhikrId] = (logsByDay[date][dhikrId] || 0) + count;
            });

            // 3. Calculate Daily Percentage Scores (Unweighted)
            // For each day, Score = Sum(min(count/target, 1)) / NumActiveAdhkar * 100
            const getDailyScore = (dateLogs: Record<string, number>) => {
                let sumPercentages = 0;
                // We iterate over ACTIVE adhkar to see what was done vs target
                // If a dhikr was logged but is no longer active, should we count it? 
                // Usually yes, but for "current progress" maybe no?
                // Let's stick to "Current Active Adhkar" as the standard.
                // If I did a deleted dhikr, it doesn't count towards my "Current Goal".

                activeAdhkarMap.forEach((meta, id) => {
                    const count = dateLogs[id] || 0;
                    const completion = Math.min(count / meta.target, 1);
                    sumPercentages += completion;
                });

                return Math.round((sumPercentages / totalActiveAdhkarCount) * 100);
            };

            const todayCompletion = getDailyScore(logsByDay[todayStr] || {});

            // 4. Streaks
            const { currentStreak, longestStreak } = calculateStreaks(Array.from(uniqueDays));

            // 5. Heatmap (Last 3 Months)
            const heatmapData = prepareHeatmapData(logs);
            // Note: Heatmap usually shows "Intensity" (Count) or "Completion"?
            // GitHub shows "Contribution Count".
            // User asked for "Darker = More Adhkar". "عدد الأذكار".
            // So Heatmap stays based on Count (prepareHeatmapData default).

            // 6. Chart Data (Based on Range Filter)
            const chartDays: DailyActivity[] = [];
            let daysToLookBack = 7;
            if (range === 'month') daysToLookBack = 30;
            if (range === '3months') daysToLookBack = 90;

            for (let i = daysToLookBack - 1; i >= 0; i--) {
                const d = subDays(new Date(), i);
                const dStr = format(d, 'yyyy-MM-dd');
                const dayName = format(d, 'EEEE'); // or short date
                const arDays: Record<string, string> = {
                    'Sunday': 'أحد', 'Monday': 'إثنين', 'Tuesday': 'ثلاثاء',
                    'Wednesday': 'أربعاء', 'Thursday': 'خميس', 'Friday': 'جمعة', 'Saturday': 'سبت'
                };

                // Chart Y-Axis: Percentage Score
                const score = getDailyScore(logsByDay[dStr] || {});

                chartDays.push({
                    date: dStr,
                    score: score,
                    dayName: range === 'week' ? (arDays[dayName] || dayName) : format(d, 'M/d')
                });
            }

            // 7. Top Adhkar (Most Committed)
            // "Calculates the dhikr I am most committed to, not just count"
            // Logic: Average Daily Completion % for days it was active?
            // Or simple: Sum of (Daily %) / Total Days in Range?
            // Let's do "All Time" for "Top Adhkar".

            const dhikrScores: Record<string, { sumPct: number, daysWithLog: number }> = {};

            // Iterate all days that have logs
            Object.entries(logsByDay).forEach(([date, dayLogs]) => {
                Object.entries(dayLogs).forEach(([id, count]) => {
                    if (activeAdhkarMap.has(id)) {
                        const target = activeAdhkarMap.get(id)!.target;
                        const pct = Math.min(count / target, 1);

                        if (!dhikrScores[id]) dhikrScores[id] = { sumPct: 0, daysWithLog: 0 };
                        dhikrScores[id].sumPct += pct;
                        dhikrScores[id].daysWithLog += 1; // Count days where at least 1 was done?
                        // Or should we divide by "Total Days since created"? Too complex.
                        // Let's divide by "Days where it was logged" implies consistency when active?
                        // User says "Most Committed".
                        // If I did it 100 times (100 days) at 100%, I am very committed.
                        // If I did it 1 time (1 day) at 100%, I am 100% committed?
                        // We need to weight by frequency.
                        // Let's just sum the "Completion Percentages".
                        // Score = Sum(DailyCompletion). 
                        // High score = Many days of high completion.
                    }
                });
            });

            const topList = Array.from(activeAdhkarMap.entries())
                .map(([id, meta]) => {
                    const stats = dhikrScores[id] || { sumPct: 0, daysWithLog: 0 };
                    // We can normalize this score to look like a percentage if needed, 
                    // but "Most Committed" is best ranked by "Sum of Daily Completions".
                    // But to display a "Percentage" in the UI (as requested 85%), we need an average.
                    // Let's show Average Completion on days it was done? 
                    // Or Average Comletion over last 30 days?

                    // User Example: "Final Percentage 85%".
                    // Let's just return the raw stats and decide UI.
                    // Actually UI shows "85%". 
                    // Let's calculate: (Total Count / Total Target across all time) * 100?
                    // No, that was the old logic (skewed by over-performance).
                    // New logic: Average of Daily Completions.

                    const avg = stats.daysWithLog > 0 ? (stats.sumPct / stats.daysWithLog) * 100 : 0;

                    return {
                        id,
                        text: meta.text,
                        avgCompletion: avg,
                        daysActive: stats.daysWithLog
                    };
                })
                .sort((a, b) => {
                    // Sort by "Total Commitment" (Sum Pct) -> daysActive * avgCompletion
                    const scoreA = a.daysActive * a.avgCompletion;
                    const scoreB = b.daysActive * b.avgCompletion;
                    return scoreB - scoreA;
                })
                .slice(0, 3);


            setStats({
                totalCount: total,
                todayCount: todayCount,
                todayCompletion,
                streak: currentStreak,
                longestStreak: longestStreak,
                dailyActivity: chartDays,
                heatmapData,
                topAdhkar: topList
            });

        } catch (err) {
            console.error('Error fetching stats:', err);
        } finally {
            setLoading(false);
        }
    }, [supabase, range]); // Re-fetch when range changes

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    return { stats, loading, refetch: fetchStats };
}
