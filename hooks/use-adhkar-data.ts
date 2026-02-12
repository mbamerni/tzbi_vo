import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client'; // Use browser client
import { DhikrGroup, Dhikr, DEFAULT_GROUPS } from '@/lib/athkari-data';

export function useAdhkarData() {
    const [groups, setGroups] = useState<DhikrGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);

    const supabase = createClient();

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);

            // 1. Auth Check (Anonymous)
            const { data: { session } } = await supabase.auth.getSession();
            let currentUserId = session?.user?.id;

            if (!currentUserId) {
                console.log('Signing in anonymously...');
                const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
                if (authError) throw authError;
                currentUserId = authData.user?.id;
            }

            if (!currentUserId) throw new Error('Failed to authenticate');
            setUserId(currentUserId);

            // 2. Fetch Groups
            const { count, error: countError } = await supabase
                .from('groups')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', currentUserId);

            if (countError) throw countError;

            // 3. Seeding if empty
            if (count === 0) {
                console.log('Seeding data for new user:', currentUserId);
                for (let i = 0; i < DEFAULT_GROUPS.length; i++) {
                    const dGroup = DEFAULT_GROUPS[i];
                    const { data: newGroup, error: gError } = await supabase
                        .from('groups')
                        .insert({
                            name: dGroup.name,
                            icon: dGroup.icon,
                            slug: `group-${Date.now()}-${i}`,
                            sort_order: i + 1,
                            user_id: currentUserId,
                            is_active: true
                        })
                        .select()
                        .single();

                    if (gError) throw gError;

                    if (newGroup) {
                        const adhkarPayload = dGroup.adhkar.map((d, idx) => ({
                            group_id: newGroup.id,
                            text: d.text,
                            target_count: d.target,
                            virtue: d.virtue,
                            user_id: currentUserId,
                            sort_order: idx + 1,
                            icon: d.icon || undefined,
                            is_active: true
                        }));
                        const { error: aError } = await supabase.from('adhkar').insert(adhkarPayload);
                        if (aError) throw aError;
                    }
                }
            }

            // 4. Fetch Groups & Adhkar
            const { data: groupsData, error: groupsError } = await supabase
                .from('groups')
                .select('*')
                .eq('user_id', currentUserId)
                .order('sort_order', { ascending: true })
                .order('created_at', { ascending: true })
                .order('id', { ascending: true });

            if (groupsError) throw groupsError;

            const { data: adhkarData, error: adhkarError } = await supabase
                .from('adhkar')
                .select('*')
                .eq('user_id', currentUserId)
                .order('sort_order', { ascending: true })
                .order('created_at', { ascending: true })
                .order('id', { ascending: true });

            if (adhkarError) throw adhkarError;

            // 5. Transform
            const combinedGroups: DhikrGroup[] = groupsData.map((group) => {
                const groupAdhkar = adhkarData
                    .filter((adhkar) => adhkar.group_id === group.id)
                    .map((adhkar) => ({
                        id: adhkar.id,
                        text: adhkar.text,
                        target: adhkar.target_count,
                        current: 0,
                        virtue: adhkar.virtue,
                        icon: adhkar.icon || group.icon,
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
            if (err?.code === 'PGRST205' || err?.message?.includes('does not exist')) {
                setGroups([]);
                setError(null);
            } else {
                setError(err instanceof Error ? err.message : 'Failed to fetch data');
            }
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Derived state
    const activeGroups = groups
        .filter(g => g.is_active !== false)
        .map(g => ({
            ...g,
            adhkar: g.adhkar.filter(d => d.is_active !== false)
        }));

    const toggleGroup = useCallback(async (id: string, state: boolean) => {
        setGroups(prev => prev.map(g => g.id === id ? { ...g, is_active: state } : g));
        try {
            await supabase.from('groups').update({ is_active: state }).eq('id', id);
        } catch (err) {
            console.error('Error toggling group:', err);
            await fetchData();
        }
    }, [fetchData, supabase]);

    const toggleDhikr = useCallback(async (id: string, state: boolean) => {
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
    }, [fetchData, supabase]);

    const addGroup = useCallback(async (name: string, icon: string) => {
        if (!userId) return false;
        try {
            const { error } = await supabase.from('groups').insert([{
                name,
                icon,
                slug: `group-${Date.now()}`,
                sort_order: groups.length + 1,
                user_id: userId,
                is_active: true
            }]);
            if (error) throw error;
            await fetchData();
            return true;
        } catch (err) {
            console.error('Error adding group:', err);
            return false;
        }
    }, [groups.length, fetchData, userId, supabase]);

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
    }, [fetchData, supabase]);

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
    }, [fetchData, supabase]);

    const addDhikr = useCallback(async (groupId: string, text: string, target: number, virtue?: string, icon?: string) => {
        if (!userId) return false;
        try {
            const group = groups.find(g => g.id === groupId);
            const currentAdhkar = group?.adhkar || [];

            // Check for missing sort orders which cause "Jumping to Top" issues (Postgres NULLS LAST)
            const hasMissingSort = currentAdhkar.some(d => !d.sort_order);

            if (hasMissingSort) {
                // Lazy Migration: Fix sort orders for this group before adding
                console.log('Fixing sort_order for group', groupId);
                await Promise.all(currentAdhkar.map((d, idx) =>
                    supabase.from('adhkar').update({ sort_order: idx + 1 }).eq('id', d.id)
                ));
            }

            // Calculate next sort safely. 
            // If we just fixed them, max is length. available gaps?
            const currentMaxSort = currentAdhkar.reduce((max, d) => Math.max(max, d.sort_order || 0), 0);
            // If we implicitly fixed them to 1..N, max is N.
            // If we didn't fix (no nulls), max is Max.
            // But if existing Max < Length (duplicates?), safer to use Length? 
            // Better: use Max.

            // If we just ran fix, the local state 'currentAdhkar' still has old nulls!
            // But we know we just updated them to 1..Length.
            // So effective max is currentAdhkar.length.

            const effectiveMax = hasMissingSort ? currentAdhkar.length : currentMaxSort;
            const nextSort = effectiveMax + 1;

            const { error } = await supabase.from('adhkar').insert([{
                group_id: groupId,
                text,
                target_count: target,
                virtue,
                icon,
                sort_order: nextSort,
                user_id: userId,
                is_active: true
            }]);
            if (error) throw error;
            await fetchData();
            return true;
        } catch (err) {
            console.error('Error adding dhikr:', err);
            return false;
        }
    }, [groups, fetchData, userId, supabase]);

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
    }, [fetchData, supabase]);

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
    }, [fetchData, supabase]);

    const reorderGroup = useCallback(async (id: string, direction: 'up' | 'down') => {
        const currentIndex = groups.findIndex(g => g.id === id);
        if (currentIndex === -1) return;

        const neighborIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        if (neighborIndex < 0 || neighborIndex >= groups.length) return;

        const currentGroup = groups[currentIndex];
        const neighborGroup = groups[neighborIndex];

        const currentSort = currentGroup.sort_order ?? currentIndex + 1;
        const neighborSort = neighborGroup.sort_order ?? neighborIndex + 1;

        const newGroups = [...groups];
        newGroups[currentIndex] = neighborGroup;
        newGroups[neighborIndex] = currentGroup;

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
    }, [groups, fetchData, supabase]);

    const reorderDhikr = useCallback(async (id: string, direction: 'up' | 'down') => {
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
    }, [groups, fetchData, supabase]);

    return {
        groups,
        activeGroups,
        loading,
        error,
        userId,
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
