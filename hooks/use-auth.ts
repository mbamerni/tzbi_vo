import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useAuth() {
    const [userId, setUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [supabase] = useState(() => createClient());

    const signInAnonymously = useCallback(async () => {
        try {
            setLoading(true);
            const { data: { session } } = await supabase.auth.getSession();

            if (session?.user?.id) {
                setUserId(session.user.id);
                return session.user.id;
            }

            console.log('Signing in anonymously...');
            const { data: authData, error: authError } = await supabase.auth.signInAnonymously();

            if (authError) throw authError;

            const newUserId = authData.user?.id;
            if (newUserId) {
                setUserId(newUserId);
                return newUserId;
            }
        } catch (error) {
            console.error('Auth error:', error);
        } finally {
            setLoading(false);
        }
        return null;
    }, [supabase]);

    useEffect(() => {
        signInAnonymously();
    }, [signInAnonymously]);

    return { userId, loading, signInAnonymously };
}
