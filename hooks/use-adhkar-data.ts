import { useMemo } from 'react';
import { useAuth } from './use-auth';
import { useGroups } from './use-groups';
import { useAdhkar } from './use-adhkar';

export function useAdhkarData() {
    const { userId, loading: authLoading } = useAuth();
    const {
        groups,
        loading: groupsLoading,
        fetchGroups,
        addGroup,
        editGroup,
        deleteGroup,
        reorderGroup,
        toggleGroup
    } = useGroups(userId);

    const {
        addDhikr,
        editDhikr,
        deleteDhikr,
        reorderDhikr,
        toggleDhikr
    } = useAdhkar(userId, groups, fetchGroups);

    const loading = authLoading || groupsLoading;

    // Derived state for backward compatibility (global active state)
    // Note: FocusScreen now uses its own useSchedule for time-travel active state.
    // This is just the "Global Configuration" active state.
    const activeGroups = useMemo(() => {
        return groups
            .filter(g => g.is_active !== false)
            .map(g => ({
                ...g,
                adhkar: g.adhkar.filter(d => d.is_active !== false)
            }));
    }, [groups]);

    return {
        groups,
        activeGroups,
        loading,
        userId,
        refetch: fetchGroups,
        toggleGroup,
        toggleDhikr,
        addGroup,
        editGroup,
        deleteGroup,
        addDhikr,
        editDhikr,
        deleteDhikr,
        reorderGroup,
        reorderDhikr
    };
}
