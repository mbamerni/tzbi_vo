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
    target: number;
    daysActive: number;
    adherence: number;
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
            const todayStr = format(new Date(), 'yyyy-MM-dd');

            const countsByDay: Record<string, number> = {};
            const countsByDhikr: Record<string, { text: string; count: number; target: number; days: Set<string> }> = {};

            const uniqueDays = new Set<string>();

            logs.forEach((log: any) => {
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
            const sortedDays = Array.from(uniqueDays).sort().reverse();
            let currentStreak = 0;
            if (sortedDays.length > 0) {
                const lastActive = parseISO(sortedDays[0]);
                const todayDate = new Date();
                const pToday = parseISO(format(todayDate, 'yyyy-MM-dd'));
                const diffToLast = differenceInCalendarDays(pToday, lastActive);

                if (diffToLast <= 1) {
                    currentStreak = 1;
                    for (let i = 0; i < sortedDays.length - 1; i++) {
                        const curr = parseISO(sortedDays[i]);
                        const prev = parseISO(sortedDays[i + 1]);
                        const diff = differenceInCalendarDays(curr, prev);
                        if (diff === 1) currentStreak++;
                        else break;
                    }
                } else {
                    currentStreak = 0;
                }
            }

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
                .slice(0, 5);

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
