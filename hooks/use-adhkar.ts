import { useCallback, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { DhikrGroup, Dhikr } from '@/lib/athkari-data';
import { toast } from 'sonner';

export function useAdhkar(
    userId: string | null,
    groups: DhikrGroup[],
    setGroups: React.Dispatch<React.SetStateAction<DhikrGroup[]>>,
    onUpdate: () => Promise<void | DhikrGroup[]> | void
) {
    const [supabase] = useState(() => createClient());

    // Add Dhikr
    const addDhikr = useCallback(async (groupId: string, text: string, target: number, virtue?: string, icon?: string) => {
        if (!userId) return false;
        try {
            const { error } = await supabase.from('adhkar').insert([{
                group_id: groupId,
                text,
                target_count: target,
                virtue,
                user_id: userId,
                is_active: true
            }]);

            if (error) throw error;
            await onUpdate();
            toast.success('تم إضافة الذكر بنجاح');
            return true;
        } catch (err: any) {
            console.error('Error adding dhikr:', err);
            toast.error(err.message || 'حدث خطأ أثناء إضافة الذكر');
            return false;
        }
    }, [userId, onUpdate, supabase]);

    // Edit Dhikr
    const editDhikr = useCallback(async (id: string, text: string, target: number, virtue?: string, icon?: string) => {
        try {
            const { error } = await supabase.from('adhkar').update({
                text,
                target_count: target,
                virtue
            }).eq('id', id);

            if (error) throw error;
            await onUpdate();
            toast.success('تم تعديل الذكر بنجاح');
            return true;
        } catch (err: any) {
            console.error('Error updating dhikr:', err);
            toast.error(err.message || 'حدث خطأ أثناء تعديل الذكر');
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
        } catch (err: any) {
            console.error('Error deleting dhikr:', err);
            toast.error(err.message || 'حدث خطأ أثناء حذف الذكر');
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
        const neighborIndex = direction === 'up' ? dhikrIndex - 1 : dhikrIndex + 1;

        if (neighborIndex < 0 || neighborIndex >= group.adhkar.length) return;

        // --- Optimistic Update ---
        const previousGroups = [...groups]; // Backup for rollback

        setGroups(prev => {
            const newGroups = [...prev];
            const newAdhkarList = [...newGroups[groupIndex].adhkar];

            const currentDhikr = newAdhkarList[dhikrIndex];
            newAdhkarList[dhikrIndex] = newAdhkarList[neighborIndex];
            newAdhkarList[neighborIndex] = currentDhikr;

            newGroups[groupIndex] = { ...newGroups[groupIndex], adhkar: newAdhkarList };
            return newGroups;
        });

        // --- Database Update ---
        try {
            // Find the state AFTER our optimistic logic via index directly from the backup layout to safely upload sorted keys
            const { adhkar: backupAdhkar } = previousGroups[groupIndex];
            const dbList = [...backupAdhkar];
            const temp = dbList[dhikrIndex];
            dbList[dhikrIndex] = dbList[neighborIndex];
            dbList[neighborIndex] = temp;

            const updates = dbList.map((d, index) => {
                const expectedSort = index + 1;
                if (d.sort_order !== expectedSort) {
                    return supabase
                        .from('adhkar')
                        .update({ sort_order: expectedSort })
                        .eq('id', d.id);
                }
                return null;
            }).filter(Boolean);

            if (updates.length > 0) {
                await Promise.all(updates);
            }

            // Sync other clients optionally without blocking user
            onUpdate();
        } catch (err: any) {
            console.error('Error reordering dhikr:', err);
            toast.error(err.message || 'حدث خطأ أثناء إعادة ترتيب الأذكار');
            setGroups(previousGroups); // Rollback
        }
    }, [groups, onUpdate, setGroups, supabase]);

    // Toggle Dhikr Active
    const toggleDhikr = useCallback(async (id: string, state: boolean) => {
        const previousGroups = [...groups]; // Backup for rollback

        // Optimistic UI Update
        setGroups(prevGroups => prevGroups.map(group => ({
            ...group,
            adhkar: group.adhkar.map(dhikr =>
                dhikr.id === id ? { ...dhikr, is_active: state } : dhikr
            )
        })));

        // Background Database Mutation
        try {
            const { error } = await supabase.from('adhkar').update({ is_active: state }).eq('id', id);
            if (error) throw error;
            onUpdate(); // Optional silent sync
        } catch (err: any) {
            console.error('Error toggling dhikr:', err);
            toast.error(err.message || 'حدث خطأ أثناء تغيير حالة الذكر');
            setGroups(previousGroups); // Rolback
        }
    }, [groups, onUpdate, setGroups, supabase]);

    return {
        addDhikr,
        editDhikr,
        deleteDhikr,
        reorderDhikr,
        toggleDhikr
    };
}
