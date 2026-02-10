import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { format, subDays, startOfDay, endOfDay, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';

export interface DailyStat {
    day: string;
    count: number;
    date: string;
}

export interface MostReadItem {
    name: string;
    count: number;
}

export interface StatsSummary {
    totalWeek: number;
    totalAllTime: number;
    streak: number;
    weeklyTarget: number;
}

export function useAnalytics() {
    const [stats, setStats] = useState<DailyStat[]>([]);
    const [mostRead, setMostRead] = useState<MostReadItem[]>([]);
    const [summary, setSummary] = useState<StatsSummary>({ totalWeek: 0, totalAllTime: 0, streak: 0, weeklyTarget: 1000 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Default: Last 7 days
    const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
        start: subDays(new Date(), 6),
        end: new Date()
    });

    const supabase = createClient();

    const fetchStats = useCallback(async () => {
        try {
            setLoading(true);
            const startDateStr = format(dateRange.start, 'yyyy-MM-dd');
            const endDateStr = format(dateRange.end, 'yyyy-MM-dd');

            // 1. Fetch Logs in Range
            // RLS should handle filtering by user_id automatically if set up correctly
            const { data: logs, error: logsError } = await supabase
                .from('daily_logs')
                .select(`
            count, 
            log_date,
            adhkar ( text )
        `)
                .gte('log_date', startDateStr)
                .lte('log_date', endDateStr);

            if (logsError) throw logsError;

            // --- Processing Daily Stats ---
            const groupedByDate: Record<string, number> = {};
            const groupedByDhikr: Record<string, number> = {};
            let totalWeek = 0;

            logs?.forEach((log) => {
                const date = log.log_date;
                groupedByDate[date] = (groupedByDate[date] || 0) + log.count;
                totalWeek += log.count;

                // Dhikr Stats
                // @ts-ignore
                const dhikrName = log.adhkar?.text || 'ذكر محذوف';
                groupedByDhikr[dhikrName] = (groupedByDhikr[dhikrName] || 0) + log.count;
            });

            // Fill missing days
            const dailyStats: DailyStat[] = [];
            let currentDate = new Date(dateRange.start);
            while (currentDate <= dateRange.end) {
                const dateStr = format(currentDate, 'yyyy-MM-dd');
                const dayName = format(currentDate, 'EEEE', { locale: ar });

                dailyStats.push({
                    day: dayName,
                    date: dateStr,
                    count: groupedByDate[dateStr] || 0
                });
                currentDate.setDate(currentDate.getDate() + 1);
            }
            setStats(dailyStats);

            // --- Processing Most Read ---
            const mostReadItems: MostReadItem[] = Object.entries(groupedByDhikr)
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5); // Top 5
            setMostRead(mostReadItems);

            setSummary({
                totalWeek,
                totalAllTime: totalWeek, // Needs separate query for true all-time
                streak: 0,
                weeklyTarget: 2000
            });

        } catch (err: any) {
            console.error('Error fetching analytics:', err);
            if (err?.code === 'PGRST205' || err?.message?.includes('does not exist')) {
                setStats([]);
                setMostRead([]);
                setSummary({ totalWeek: 0, totalAllTime: 0, streak: 0, weeklyTarget: 2000 });
                setError(null);
            } else {
                setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
            }
        } finally {
            setLoading(false);
        }
    }, [dateRange, supabase]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    return { stats, mostRead, summary, loading, error, dateRange, setDateRange, refetch: fetchStats };
}
