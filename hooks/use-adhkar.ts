import { useCallback, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { DhikrGroup, Dhikr } from '@/lib/athkari-data';
import { toast } from 'sonner';

export function useAdhkar(
    userId: string | null,
    groups: DhikrGroup[],
    onUpdate: () => Promise<void> | void
) {
    const [supabase] = useState(() => createClient());

    // Add Dhikr
    const addDhikr = useCallback(async (groupId: string, text: string, target: number, virtue?: string, icon?: string) => {
        if (!userId) return false;
        try {
            const group = groups.find(g => g.id === groupId);
            const currentAdhkar = group?.adhkar || [];

            // Calculate next sort safely. Treat null/undefined as 0.
            const currentMaxSort = currentAdhkar.reduce((max, d) => Math.max(max, d.sort_order || 0), 0);
            const nextSort = currentMaxSort + 1;

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
            await onUpdate();
            toast.success('تم إضافة الذكر بنجاح');
            return true;
        } catch (err) {
            console.error('Error adding dhikr:', err);
            toast.error('حدث خطأ أثناء إضافة الذكر');
            return false;
        }
    }, [groups, userId, onUpdate, supabase]);

    // Edit Dhikr
    const editDhikr = useCallback(async (id: string, text: string, target: number, virtue?: string, icon?: string) => {
        try {
            const { error } = await supabase.from('adhkar').update({
                text,
                target_count: target,
                virtue,
                icon
            }).eq('id', id);
            if (error) throw error;
            await onUpdate();
            toast.success('تم تعديل الذكر بنجاح');
            return true;
        } catch (err) {
            console.error('Error updating dhikr:', err);
            toast.error('حدث خطأ أثناء تعديل الذكر');
            return false;
        }
    }, [onUpdate, supabase]);

    // Delete Dhikr
    const deleteDhikr = useCallback(async (id: string) => {
        try {
            const { error } = await supabase.from('adhkar').delete().eq('id', id);
            if (error) throw error;
            await onUpdate();
            toast.success('تم حذف الذكر بنجاح');
            return true;
        } catch (err) {
            console.error('Error deleting dhikr:', err);
            toast.error('حدث خطأ أثناء حذف الذكر');
            return false;
        }
    }, [onUpdate, supabase]);

    // Reorder Dhikr
    const reorderDhikr = useCallback(async (id: string, direction: 'up' | 'down') => {
        let groupIndex = -1;
        let dhikrIndex = -1;

        // Find the dhikr and its group
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
        const adhkarList = [...group.adhkar]; // Clone the array for mutation
        const neighborIndex = direction === 'up' ? dhikrIndex - 1 : dhikrIndex + 1;

        if (neighborIndex < 0 || neighborIndex >= adhkarList.length) return;

        // Swap the elements in memory
        const currentDhikr = adhkarList[dhikrIndex];
        adhkarList[dhikrIndex] = adhkarList[neighborIndex];
        adhkarList[neighborIndex] = currentDhikr;

        try {
            // Self-healing algorithm: 
            // We assign an exact 1-based index to every item in the newly ordered array.
            // If the item's current DB sort_order doesn't match, we add it to the update batch.
            // This natively handles nulls, duplicates, and the swapped items simultaneously.
            const updates = adhkarList.map((d, index) => {
                const expectedSort = index + 1;

                if (d.sort_order !== expectedSort) {
                    return supabase
                        .from('adhkar')
                        .update({ sort_order: expectedSort })
                        .eq('id', d.id);
                }
                return null;
            }).filter(Boolean); // Remove nulls (items that don't need updating)

            if (updates.length > 0) {
                await Promise.all(updates);
            }

            await onUpdate();
        } catch (err) {
            console.error('Error reordering dhikr:', err);
        }
    }, [groups, onUpdate, supabase]);

    // Toggle Dhikr Active
    const toggleDhikr = useCallback(async (id: string, state: boolean) => {
        try {
            await supabase.from('adhkar').update({ is_active: state }).eq('id', id);
            // We can optionally not await fetch here if we want "fire and forget" 
            // but the UI needs to update.
            // In the original code, it updated local state optimistically.
            // Ideally we should pass an optimistic updater.
            await onUpdate();
        } catch (err) {
            console.error('Error toggling dhikr:', err);
        }
    }, [onUpdate, supabase]);

    return {
        addDhikr,
        editDhikr,
        deleteDhikr,
        reorderDhikr,
        toggleDhikr
    };
}
