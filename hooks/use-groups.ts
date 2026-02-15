import { useState, useCallback, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { DhikrGroup } from '@/lib/athkari-data';
import { toast } from 'sonner';

export function useGroups(userId: string | null) {
    const [groups, setGroups] = useState<DhikrGroup[]>([]);
    const [loading, setLoading] = useState(true); // Initial loading state
    const [supabase] = useState(() => createClient());

    // Fetch groups logic
    const fetchGroups = useCallback(async () => {
        if (!userId) {
            setLoading(false); // If no user, we are not loading anymore
            return;
        }

        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('groups')
                .select('*')
                .eq('user_id', userId)
                .order('sort_order', { ascending: true, nullsFirst: true })
                .order('created_at', { ascending: true });

            if (error) throw error;

            const { data: adhkarData, error: adhkarError } = await supabase
                .from('adhkar')
                .select('*')
                .eq('user_id', userId)
                .order('sort_order', { ascending: true, nullsFirst: true });

            if (adhkarError) throw adhkarError;

            const combined: DhikrGroup[] = data.map(g => ({
                ...g,
                adhkar: adhkarData
                    .filter(a => a.group_id === g.id)
                    .map(a => ({
                        ...a,
                        target: a.target_count ?? a.target ?? 33 // Map DB 'target_count' to 'target'
                    }))
            }));

            setGroups(combined);
            return combined;

        } catch (error) {
            console.error('Error fetching groups:', error);
            return [];
        } finally {
            setLoading(false);
        }
    }, [userId, supabase]);

    // Seed Data
    const seedDefaultData = useCallback(async () => {
        if (!userId) return;
        try {
            console.log('Seeding default data for user:', userId);

            for (const group of DEFAULT_GROUPS) {
                // Insert Group
                const { data: groupData, error: groupError } = await supabase
                    .from('groups')
                    .insert([{
                        name: group.name,
                        icon: group.icon,
                        slug: `group-${Date.now()}-${Math.random()}`, // Unique slug
                        sort_order: groups.length + 1, // This might be stale, but okay for initial seed
                        user_id: userId,
                        is_active: true
                    }])
                    .select()
                    .single();

                if (groupError) throw groupError;
                if (!groupData) continue;

                const groupId = groupData.id;

                // Insert Adhkar
                const adhkarToInsert = group.adhkar.map((d, index) => ({
                    group_id: groupId,
                    text: d.text,
                    target_count: d.target, // Map target to target_count
                    virtue: d.virtue,
                    icon: d.icon,
                    sort_order: index + 1,
                    user_id: userId,
                    is_active: true
                }));

                if (adhkarToInsert.length > 0) {
                    const { error: adhkarError } = await supabase
                        .from('adhkar')
                        .insert(adhkarToInsert);

                    if (adhkarError) throw adhkarError;
                }
            }

            await fetchGroups(); // Refresh after seeding
            toast.success('تم تهيئة الأذكار الافتراضية');

        } catch (error) {
            console.error('Error seeding data:', error);
            toast.error('حدث خطأ أثناء تهيئة البيانات');
        }
    }, [userId, supabase, fetchGroups, groups.length]); // groups.length dependency is minor here as it runs on empty

    // Automatically fetch groups when userId changes
    useEffect(() => {
        let mounted = true;

        const init = async () => {
            if (userId) {
                const fetchedGroups = await fetchGroups();
                if (mounted && fetchedGroups && fetchedGroups.length === 0) {
                    await seedDefaultData();
                }
            }
        };

        init();

        return () => { mounted = false; };
    }, [userId, fetchGroups, seedDefaultData]);

    // Add Group
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
            await fetchGroups();
            toast.success('تم إضافة المجموعة بنجاح');
            return true;
        } catch (err) {
            console.error('Error adding group:', err);
            toast.error('حدث خطأ أثناء إضافة المجموعة');
            return false;
        }
    }, [userId, groups.length, fetchGroups, supabase]);

    // Edit Group
    const editGroup = useCallback(async (id: string, name: string, icon: string) => {
        try {
            const { error } = await supabase.from('groups').update({ name, icon }).eq('id', id);
            if (error) throw error;
            await fetchGroups();
            toast.success('تم تحديث المجموعة بنجاح');
            return true;
        } catch (err) {
            console.error('Error updating group:', err);
            toast.error('حدث خطأ أثناء تحديث المجموعة');
            return false;
        }
    }, [fetchGroups, supabase]);

    // Delete Group
    const deleteGroup = useCallback(async (id: string) => {
        try {
            const { error } = await supabase.from('groups').delete().eq('id', id);
            if (error) throw error;
            await fetchGroups();
            toast.success('تم حذف المجموعة بنجاح');
            return true;
        } catch (err) {
            console.error('Error deleting group:', err);
            toast.error('حدث خطأ أثناء حذف المجموعة');
            return false;
        }
    }, [fetchGroups, supabase]);

    // Reorder Group
    const reorderGroup = useCallback(async (id: string, direction: 'up' | 'down') => {
        const currentIndex = groups.findIndex(g => g.id === id);
        if (currentIndex === -1) return;

        const neighborIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        if (neighborIndex < 0 || neighborIndex >= groups.length) return;

        const currentGroup = groups[currentIndex];
        const neighborGroup = groups[neighborIndex];

        // Optimistic UI update
        const newGroups = [...groups];
        newGroups[currentIndex] = neighborGroup;
        newGroups[neighborIndex] = currentGroup;
        setGroups(newGroups);

        // Swap sort orders
        const currentSort = currentGroup.sort_order ?? currentIndex + 1;
        const neighborSort = neighborGroup.sort_order ?? neighborIndex + 1;

        try {
            await Promise.all([
                supabase.from('groups').update({ sort_order: neighborSort }).eq('id', currentGroup.id),
                supabase.from('groups').update({ sort_order: currentSort }).eq('id', neighborGroup.id)
            ]);
        } catch (err) {
            console.error('Error reordering groups:', err);
            await fetchGroups(); // Revert on error
        }
    }, [groups, fetchGroups, supabase]);

    // Toggle Group Active State
    const toggleGroup = useCallback(async (id: string, state: boolean) => {
        setGroups(prev => prev.map(g => g.id === id ? { ...g, is_active: state } : g));
        try {
            await supabase.from('groups').update({ is_active: state }).eq('id', id);
        } catch (err) {
            console.error('Error toggling group:', err);
            await fetchGroups();
        }
    }, [fetchGroups, supabase]);

    return {
        groups,
        loading,
        fetchGroups,
        addGroup,
        editGroup,
        deleteGroup,
        reorderGroup,
        toggleGroup,
        setGroups // Exported for optimistic updates from other hooks if needed
    };
}
