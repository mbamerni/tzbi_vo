import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { DhikrGroup, Dhikr } from '../lib/athkari-data';

export function useAdhkarData() {
    const [groups, setGroups] = useState<DhikrGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            // Fetch Groups
            const { data: groupsData, error: groupsError } = await supabase
                .from('groups')
                .select('*')
                .order('sort_order', { ascending: true })
                .order('created_at', { ascending: true });

            if (groupsError) throw groupsError;

            // Fetch Adhkar
            const { data: adhkarData, error: adhkarError } = await supabase
                .from('adhkar')
                .select('*')
                .order('sort_order', { ascending: true })
                .order('created_at', { ascending: true });

            if (adhkarError) throw adhkarError;

            // Transform and combine
            const combinedGroups: DhikrGroup[] = groupsData.map((group) => {
                const groupAdhkar = adhkarData
                    .filter((adhkar) => adhkar.group_id === group.id)
                    .map((adhkar) => ({
                        id: adhkar.id,
                        text: adhkar.text,
                        target: adhkar.target_count,
                        current: 0, // Initial local state
                        virtue: adhkar.virtue,
                        icon: adhkar.icon || group.icon, // Use specific icon if available, else inherit
                        group_id: group.id,
                        is_active: adhkar.is_active,
                        sort_order: adhkar.sort_order
                    }));

                return {
                    id: group.id,
                    name: group.name,
                    icon: group.icon,
                    adhkar: groupAdhkar,
                    is_active: group.is_active,
                    sort_order: group.sort_order
                };
            });

            setGroups(combinedGroups);
        } catch (err: any) {
            console.error('Error fetching data:', err);
            // If tables don't exist yet, just show empty state instead of infinite loading/error
            if (err?.code === 'PGRST205' || err?.message?.includes('does not exist')) {
                setGroups([]);
                setError(null);
            } else {
                setError(err instanceof Error ? err.message : 'Failed to fetch data');
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Derived state for active groups (for Focus Screen)
    const activeGroups = groups
        .filter(g => g.is_active !== false)
        .map(g => ({
            ...g,
            adhkar: g.adhkar.filter(d => d.is_active !== false)
        }));

    const toggleGroup = useCallback(async (id: string, state: boolean) => {
        // Optimistic update
        setGroups(prev => prev.map(g => g.id === id ? { ...g, is_active: state } : g));

        try {
            await supabase.from('groups').update({ is_active: state }).eq('id', id);
        } catch (err) {
            console.error('Error toggling group:', err);
            // Revert on error
            await fetchData();
        }
    }, [fetchData]);

    const toggleDhikr = useCallback(async (id: string, state: boolean) => {
        // Optimistic update
        setGroups(prev => prev.map(g => ({
            ...g,
            adhkar: g.adhkar.map(d => d.id === id ? { ...d, is_active: state } : d)
        })));

        try {
            await supabase.from('adhkar').update({ is_active: state }).eq('id', id);
        } catch (err) {
            console.error('Error toggling dhikr:', err);
            await fetchData();
        }
    }, [fetchData]);

    const addGroup = useCallback(async (name: string, icon: string) => {
        try {
            const { error } = await supabase.from('groups').insert([{
                name,
                icon,
                slug: `group-${Date.now()}`, // Simple slug generation
                sort_order: groups.length + 1
            }]);
            if (error) throw error;
            await fetchData(); // Refresh data
            return true;
        } catch (err) {
            console.error('Error adding group:', err);
            return false;
        }
    }, [groups.length, fetchData]);

    const editGroup = useCallback(async (id: string, name: string, icon: string) => {
        try {
            const { error } = await supabase.from('groups').update({ name, icon }).eq('id', id);
            if (error) throw error;
            await fetchData();
            return true;
        } catch (err) {
            console.error('Error updating group:', err);
            return false;
        }
    }, [fetchData]);

    const deleteGroup = useCallback(async (id: string) => {
        try {
            const { error } = await supabase.from('groups').delete().eq('id', id);
            if (error) throw error;
            await fetchData();
            return true;
        } catch (err) {
            console.error('Error deleting group:', err);
            return false;
        }
    }, [fetchData]);

    const addDhikr = useCallback(async (groupId: string, text: string, target: number, virtue?: string, icon?: string) => {
        try {
            // Calculate next sort order based on current max in the group
            const group = groups.find(g => g.id === groupId);
            const currentMaxSort = group?.adhkar.reduce((max, d) => Math.max(max, d.sort_order || 0), 0) || 0;
            const nextSort = currentMaxSort + 1;

            const { error } = await supabase.from('adhkar').insert([{
                group_id: groupId,
                text,
                target_count: target,
                virtue,
                icon,
                sort_order: nextSort
            }]);
            if (error) throw error;
            await fetchData();
            return true;
        } catch (err) {
            console.error('Error adding dhikr:', err);
            return false;
        }
    }, [groups, fetchData]);

    const editDhikr = useCallback(async (id: string, text: string, target: number, virtue?: string, icon?: string) => {
        try {
            const { error } = await supabase.from('adhkar').update({
                text,
                target_count: target,
                virtue,
                icon
            }).eq('id', id);
            if (error) throw error;
            await fetchData();
            return true;
        } catch (err) {
            console.error('Error updating dhikr:', err);
            return false;
        }
    }, [fetchData]);

    const deleteDhikr = useCallback(async (id: string) => {
        try {
            const { error } = await supabase.from('adhkar').delete().eq('id', id);
            if (error) throw error;
            await fetchData();
            return true;
        } catch (err) {
            console.error('Error deleting dhikr:', err);
            return false;
        }
    }, [fetchData]);

    const reorderGroup = useCallback(async (id: string, direction: 'up' | 'down') => {
        const currentIndex = groups.findIndex(g => g.id === id);
        if (currentIndex === -1) return;

        const neighborIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        if (neighborIndex < 0 || neighborIndex >= groups.length) return;

        const currentGroup = groups[currentIndex];
        const neighborGroup = groups[neighborIndex];

        // Swap sort orders
        // Use index-based sort order if actual sort_order is missing or duplicate
        // But best to rely on current array position as truth
        const currentSort = currentGroup.sort_order ?? currentIndex + 1;
        const neighborSort = neighborGroup.sort_order ?? neighborIndex + 1;

        // Optimistic update
        const newGroups = [...groups];
        // Swap positions in array
        newGroups[currentIndex] = neighborGroup;
        newGroups[neighborIndex] = currentGroup;
        // Update sort_order properties in local state to reflect swap (though DB update matters more)
        // Actually, we just swapped them in the array, so their order is visually correct.
        // We should update the DB with swapped values.

        setGroups(newGroups);

        try {
            await Promise.all([
                supabase.from('groups').update({ sort_order: neighborSort }).eq('id', currentGroup.id),
                supabase.from('groups').update({ sort_order: currentSort }).eq('id', neighborGroup.id)
            ]);
        } catch (err) {
            console.error('Error reordering groups:', err);
            await fetchData();
        }
    }, [groups, fetchData]);

    const reorderDhikr = useCallback(async (id: string, direction: 'up' | 'down') => {
        // Find group and dhikr
        let groupIndex = -1;
        let dhikrIndex = -1;

        for (let i = 0; i < groups.length; i++) {
            const dIndex = groups[i].adhkar.findIndex(d => d.id === id);
            if (dIndex !== -1) {
                groupIndex = i;
                dhikrIndex = dIndex;
                break;
            }
        }

        if (groupIndex === -1 || dhikrIndex === -1) return;

        const group = groups[groupIndex];
        const adhkarList = group.adhkar;
        const neighborIndex = direction === 'up' ? dhikrIndex - 1 : dhikrIndex + 1;

        if (neighborIndex < 0 || neighborIndex >= adhkarList.length) return;

        const currentDhikr = adhkarList[dhikrIndex];
        const neighborDhikr = adhkarList[neighborIndex];

        const currentSort = currentDhikr.sort_order ?? dhikrIndex + 1;
        const neighborSort = neighborDhikr.sort_order ?? neighborIndex + 1;

        // Optimistic
        const newGroups = [...groups];
        const newAdhkar = [...adhkarList];
        newAdhkar[dhikrIndex] = neighborDhikr;
        newAdhkar[neighborIndex] = currentDhikr;
        newGroups[groupIndex] = { ...group, adhkar: newAdhkar };

        setGroups(newGroups);

        try {
            await Promise.all([
                supabase.from('adhkar').update({ sort_order: neighborSort }).eq('id', currentDhikr.id),
                supabase.from('adhkar').update({ sort_order: currentSort }).eq('id', neighborDhikr.id)
            ]);
        } catch (err) {
            console.error('Error reordering dhikr:', err);
            await fetchData();
        }
    }, [groups, fetchData]);


    return {
        groups,
        activeGroups,
        loading,
        error,
        refetch: fetchData,
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
