import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export function useAuth() {
    const [userId, setUserId] = useState<string | null>(null);
    const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
    const [loading, setLoading] = useState(true);
    const [supabase] = useState(() => createClient());

    const signInAnonymously = useCallback(async () => {
        try {
            setLoading(true);
            const { data: { session } } = await supabase.auth.getSession();

            if (session?.user?.id) {
                setUserId(session.user.id);
                setIsAnonymous(session.user.is_anonymous === true);
                return session.user.id;
            }

            console.log('Signing in anonymously...');
            const { data: authData, error: authError } = await supabase.auth.signInAnonymously();

            if (authError) throw authError;

            const newUserId = authData.user?.id;
            if (newUserId) {
                setUserId(newUserId);
                setIsAnonymous(authData.user?.is_anonymous === true);
                return newUserId;
            }
        } catch (error) {
            console.error('Auth error:', error);
        } finally {
            setLoading(false);
        }
        return null;
    }, [supabase]);

    const linkWithGoogle = useCallback(async () => {
        try {
            const { data, error } = await supabase.auth.linkIdentity({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`
                }
            });

            if (error) throw error;

            // Note: The page will likely redirect before this is reached.
            return data;
        } catch (error: any) {
            console.error('Error linking account:', error);
            toast.error(error.message || 'حدث خطأ أثناء محاولة ربط الحساب');
            return null;
        }
    }, [supabase]);

    useEffect(() => {
        signInAnonymously();
    }, [signInAnonymously]);

    return { userId, isAnonymous, loading, signInAnonymously, linkWithGoogle };
}
