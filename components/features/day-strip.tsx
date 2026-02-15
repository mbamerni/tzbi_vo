import React, { useState, useEffect, useRef, useCallback } from "react";
import { format, addDays, isSameDay } from "date-fns";
import { ar } from "date-fns/locale";
import { createClient } from "@/lib/supabase/client";
import { DhikrGroup } from "@/lib/athkari-data";
import { MiniCircularProgress } from "@/components/ui/mini-circular-progress";

interface DayStripProps {
    selectedDate: Date;
    onSelectDate: (date: Date) => void;
    groups: DhikrGroup[];
    liveCounters?: Record<string, number>;
    dailySummaries?: Record<string, number>;
}

export function DayStrip({
    selectedDate,
    onSelectDate,
    groups,
    liveCounters,
    dailySummaries
}: DayStripProps) {
    const supabase = createClient();
    const [pastDays, setPastDays] = useState(14);
    const [futureDays, setFutureDays] = useState(14);
    const scrollRef = useRef<HTMLDivElement>(null);
    const loadingRef = useRef(false);

    // Daily Stats Map: "YYYY-MM-DD" -> Completion % (0-1)
    const [dailyStats, setDailyStats] = useState<Record<string, number>>({});

    // Generate days
    const days = React.useMemo(() => {
        const arr = [];
        // RTL logic note: The list renders LTR in DOM, usually styles handle RTL direction.
        // We just supply chronological list here.
        for (let i = -pastDays; i <= futureDays; i++) {
            arr.push(addDays(new Date(), i));
        }
        return arr;
    }, [pastDays, futureDays]);

    // Active targets helper
    const allAdhkar = React.useMemo(() => groups.flatMap(g => g.adhkar), [groups]);

    // Fetch Stats for Days Range
    useEffect(() => {
        const fetchRangeStats = async () => {
            if (!days.length) return;

            // Define Range
            const start = format(days[0], 'yyyy-MM-dd');
            const end = format(days[days.length - 1], 'yyyy-MM-dd');

            if (allAdhkar.length === 0) return;

            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) return;

            // Fetch logs
            const { data: logs } = await supabase
                .from('daily_logs')
                .select('log_date, dhikr_id, count')
                .gte('log_date', start)
                .lte('log_date', end)
                .eq('user_id', session.user.id);

            if (!logs) return;

            // Process logs into daily scores
            const stats: Record<string, number> = {};
            const logsByDate: Record<string, Record<string, number>> = {};

            logs.forEach((l: any) => {
                if (!logsByDate[l.log_date]) logsByDate[l.log_date] = {};
                logsByDate[l.log_date][l.dhikr_id] = l.count;
            });

            Object.keys(logsByDate).forEach(dateStr => {
                const dayLogs = logsByDate[dateStr];
                let sumPct = 0;
                allAdhkar.forEach(d => {
                    const count = dayLogs[d.id] || 0;
                    sumPct += Math.min(count / d.target, 1);
                });
                const avg = sumPct / allAdhkar.length; // 0 to 1
                stats[dateStr] = avg;
            });

            setDailyStats(prev => ({ ...prev, ...stats }));
        };

        if (allAdhkar.length > 0) {
            fetchRangeStats();
        }
    }, [days, allAdhkar, supabase]);

    // --- Optimistic Local Update ---
    useEffect(() => {
        if (!liveCounters) return;

        // We only update the stats for the currently selected date based on live counters
        const dateStr = format(selectedDate, 'yyyy-MM-dd');

        if (allAdhkar.length === 0) return;

        let sumPct = 0;
        allAdhkar.forEach(d => {
            const count = liveCounters[d.id] || 0;
            sumPct += Math.min(count / d.target, 1);
        });
        const avg = sumPct / allAdhkar.length;

        setDailyStats(prev => ({
            ...prev,
            [dateStr]: avg
        }));

    }, [liveCounters, selectedDate, allAdhkar]);

    // Initial scroll
    useEffect(() => {
        if (scrollRef.current && !loadingRef.current) {
            const todayEl = scrollRef.current.querySelector('[data-today="true"]');
            if (todayEl) {
                todayEl.scrollIntoView({ behavior: "auto", inline: "center", block: "nearest" });
            }
        }
    }, []);

    const handleScroll = useCallback(() => {
        const el = scrollRef.current;
        if (!el || loadingRef.current) return;

        const { scrollLeft, scrollWidth, clientWidth } = el;
        const scrollX = Math.abs(scrollLeft);
        const maxScroll = scrollWidth - clientWidth;

        if (Math.abs(scrollX - maxScroll) < 50) {
            loadingRef.current = true;
            setFutureDays(prev => prev + 15);
            setTimeout(() => { loadingRef.current = false; }, 300);
        }

        if (scrollX < 50) {
            loadingRef.current = true;
            setPastDays(prev => {
                const newVal = prev + 15;
                setTimeout(() => { loadingRef.current = false; }, 0);
                return newVal;
            });
        }
    }, []);

    return (
        <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex gap-4 overflow-x-auto px-4 py-2 scrollbar-hide snap-x relative items-center"
        >
            {days.map((date) => {
                const dateStr = format(date, 'yyyy-MM-dd');
                const isSelected = isSameDay(date, selectedDate);
                const isToday = isSameDay(date, new Date());

                let progress = dailySummaries?.[dateStr] ?? dailyStats[dateStr] ?? 0;

                return (
                    <button
                        key={date.toISOString()}
                        data-today={isToday ? "true" : undefined}
                        onClick={() => onSelectDate(date)}
                        className={`flex flex-col items-center justify-center min-w-[36px] h-[68px] rounded-[24px] snap-center transition-all duration-300 ${isSelected
                            ? "bg-background neu-flat" // Active
                            : "bg-transparent opacity-70" // Inactive
                            }`}
                    >
                        {/* Top Text (Day Name) */}
                        <span className={`text-[10px] font-medium mb-2 font-['SF_Pro'] tracking-tight ${isSelected ? "text-primary font-bold" : "text-[#6f6f6f]"}`}>
                            {format(date, "EEE", { locale: ar })}
                        </span>

                        {/* Circle with Progress */}
                        <MiniCircularProgress progress={progress} size={26} strokeWidth={2}>
                            <span className={`text-[11px] font-medium font-['SF_Pro'] tracking-tight leading-none pt-[1px] ${isSelected ? "text-primary" : "text-[#6f6f6f]"}`}>
                                {format(date, "d")}
                            </span>
                        </MiniCircularProgress>

                    </button>
                );
            })}
        </div>
    );
}
