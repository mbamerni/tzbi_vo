import { useState, useEffect, useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import { DhikrGroup } from '@/lib/athkari-data';

interface ScheduleConfig {
    activeGroupIds: string[];
    activeDhikrIds: string[];
}

interface ScheduleConfigs {
    [date: string]: ScheduleConfig;
}

export function useSchedule(groups: DhikrGroup[], selectedDate: Date) {
    const [scheduleConfigs, setScheduleConfigs] = useState<ScheduleConfigs>({});

    // Load from local storage on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            try {
                const saved = localStorage.getItem('user_schedule_configs');
                if (saved) setScheduleConfigs(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to load schedule", e);
            }
        }
    }, []);

    // Sync Global Changes to Today's Schedule
    useEffect(() => {
        const todayStr = format(new Date(), 'yyyy-MM-dd');

        const globalActiveGroupIds = groups
            .filter(g => g.is_active !== false)
            .map(g => g.id);

        const globalActiveDhikrIds = groups
            .flatMap(g => g.adhkar)
            .filter(d => d.is_active !== false)
            .map(d => d.id);

        setScheduleConfigs(prev => {
            const currentTodayConfig = prev[todayStr];

            const isSameGroups = currentTodayConfig
                && currentTodayConfig.activeGroupIds.length === globalActiveGroupIds.length
                && currentTodayConfig.activeGroupIds.every(id => globalActiveGroupIds.includes(id));

            const isSameDhikrs = currentTodayConfig
                && currentTodayConfig.activeDhikrIds.length === globalActiveDhikrIds.length
                && currentTodayConfig.activeDhikrIds.every(id => globalActiveDhikrIds.includes(id));

            if (isSameGroups && isSameDhikrs) return prev;

            const next = {
                ...prev,
                [todayStr]: {
                    activeGroupIds: globalActiveGroupIds,
                    activeDhikrIds: globalActiveDhikrIds
                }
            };
            localStorage.setItem('user_schedule_configs', JSON.stringify(next));
            return next;
        });
    }, [groups]);

    // Determine Effective Configuration for Selected Date
    const currentConfig = useMemo(() => {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');

        // 1. Explicit config
        if (scheduleConfigs[dateStr]) {
            return scheduleConfigs[dateStr];
        }

        // 2. Latest config before this date
        const sortedDates = Object.keys(scheduleConfigs).sort().reverse();
        const latestDate = sortedDates.find(d => d <= dateStr);

        if (latestDate) {
            return scheduleConfigs[latestDate];
        }

        // 3. Fallback: Default state filtered by creation date
        const limitDate = new Date(selectedDate);
        limitDate.setHours(23, 59, 59, 999);

        return {
            activeGroupIds: groups
                .filter(g => g.is_active !== false)
                .filter(g => !g.created_at || new Date(g.created_at) <= limitDate)
                .map(g => g.id),
            activeDhikrIds: groups
                .flatMap(g => g.adhkar)
                .filter(d => d.is_active !== false)
                .filter(d => !d.created_at || new Date(d.created_at) <= limitDate)
                .map(d => d.id)
        };
    }, [selectedDate, scheduleConfigs, groups]);

    // Derived Groups based on Config
    const displayedGroups = useMemo(() => {
        if (!currentConfig) return groups;

        return groups
            .filter(g => currentConfig.activeGroupIds.includes(g.id))
            .map(g => ({
                ...g,
                adhkar: g.adhkar.filter(d => currentConfig.activeDhikrIds.includes(d.id))
            }));
    }, [groups, currentConfig]);

    // Update Schedule (Toggle logic for Focus Mode overrides)
    const updateSchedule = useCallback((newActiveGroupIds: string[], newActiveDhikrIds: string[]) => {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');

        setScheduleConfigs(prev => {
            const next = {
                ...prev,
                [dateStr]: {
                    activeGroupIds: newActiveGroupIds,
                    activeDhikrIds: newActiveDhikrIds
                }
            };
            localStorage.setItem('user_schedule_configs', JSON.stringify(next));
            return next;
        });
    }, [selectedDate]);

    return {
        currentConfig,
        displayedGroups,
        updateSchedule
    };
}
