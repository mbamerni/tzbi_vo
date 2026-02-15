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
                adhkar: adhkarData.filter(a => a.group_id === g.id)
            }));

            setGroups(combined);

        } catch (error) {
            console.error('Error fetching groups:', error);
        } finally {
            setLoading(false);
        }
    }, [userId, supabase]);

    // Automatically fetch groups when userId changes
    useEffect(() => {
        if (userId) {
            fetchGroups();
        } else {
            // If userId becomes null (logout?), clear groups?
            // setGroups([]);
            // setLoading(false);
        }
    }, [userId, fetchGroups]);

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
