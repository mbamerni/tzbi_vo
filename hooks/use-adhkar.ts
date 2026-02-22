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
        const adhkarList = [...group.adhkar]; // Clone the array for mutation
        const neighborIndex = direction === 'up' ? dhikrIndex - 1 : dhikrIndex + 1;

        if (neighborIndex < 0 || neighborIndex >= adhkarList.length) return;

        // Swap the elements in memory
        const currentDhikr = adhkarList[dhikrIndex];
        adhkarList[dhikrIndex] = adhkarList[neighborIndex];
        adhkarList[neighborIndex] = currentDhikr;

        try {
            // ✅ استخدام Promise.all لرفع التغييرات لأن دالة الـ RPC لم تتوفر في الداتا بيس
            // ولأننا نغير ترتيب عنصرين فقط (العنصر والآخر المجاور له)، فلا يوجد مشكلة N+1 هنا
            const updates = adhkarList.map((d, index) => {
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

            await onUpdate();
        } catch (err: any) {
            console.error('Error reordering dhikr:', err);
            toast.error(err.message || 'حدث خطأ أثناء إعادة ترتيب الأذكار');
        }
    }, [groups, onUpdate, supabase]);

    // Toggle Dhikr Active
    const toggleDhikr = useCallback(async (id: string, state: boolean) => {
        try {
            const { error } = await supabase.from('adhkar').update({ is_active: state }).eq('id', id);
            if (error) throw error;
            await onUpdate();
        } catch (err: any) {
            console.error('Error toggling dhikr:', err);
            toast.error(err.message || 'حدث خطأ أثناء تغيير حالة الذكر');
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
