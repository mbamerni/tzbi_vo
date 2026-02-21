import { useState, useEffect, useCallback } from 'react';
import {
    QuranAyah,
    initializeQuranData,
    getAyahsByPage,
    getQuranProgress,
    toggleAyahMemorized
} from '@/lib/quran-data';

export type QuranLoadingState = 'idle' | 'loading' | 'success' | 'error';

export function useQuran() {
    const [initStatus, setInitStatus] = useState<QuranLoadingState>('idle');
    const [initMessage, setInitMessage] = useState<string>('');

    const [currentPage, setCurrentPage] = useState<number>(1);
    const [ayahs, setAyahs] = useState<QuranAyah[]>([]);
    const [loadingPage, setLoadingPage] = useState(false);

    const [progress, setProgress] = useState<Record<string, boolean>>({});

    // Initialization
    const initialize = useCallback(async () => {
        setInitStatus('loading');
        setInitMessage('جارٍ فحص البيانات...');
        try {
            // Small delay to allow UI loading to render
            await new Promise(res => setTimeout(res, 100));

            const isInitialized = localStorage.getItem('quran_initialized') === 'true';

            if (!isInitialized) {
                let msg = '';
                await initializeQuranData((m) => {
                    msg = m;
                    setInitMessage(m);
                });
            }

            setInitStatus('success');
            loadProgress();

            // Load last page or default to 1
            const lastPage = localStorage.getItem('quran_last_page');
            const pageToLoad = lastPage ? parseInt(lastPage, 10) : 1;

            if (pageToLoad >= 1 && pageToLoad <= 604) {
                setCurrentPage(pageToLoad);
            } else {
                setCurrentPage(1);
            }

        } catch (e) {
            console.error(e);
            setInitStatus('error');
            setInitMessage('فشل تهيئة البيانات. يرجى المحاولة لاحقاً أو التحقق من الاتصال.');
        }
    }, []);

    // Fetch Ayahs for a given page
    const fetchPage = useCallback(async (page: number) => {
        if (page < 1 || page > 604) return;

        setLoadingPage(true);
        try {
            const pageAyahs = await getAyahsByPage(page);
            setAyahs(pageAyahs);

            localStorage.setItem('quran_last_page', page.toString());
        } catch (e) {
            console.error("Failed to load page", e);
        } finally {
            setLoadingPage(false);
        }
    }, []);

    const loadProgress = useCallback(async () => {
        try {
            const p = await getQuranProgress();
            setProgress(p);
        } catch (e) {
            console.error("Failed to load progress", e);
        }
    }, []);

    // Go to a specific page
    const setPage = useCallback((page: number) => {
        if (page >= 1 && page <= 604) {
            setCurrentPage(page);
        }
    }, []);

    // Toggle single ayah progress
    const toggleMemorized = useCallback(async (verseKey: string) => {
        const currentState = !!progress[verseKey];
        const newState = !currentState;

        // Optimistic UI update
        setProgress(prev => ({
            ...prev,
            [verseKey]: newState
        }));

        try {
            await toggleAyahMemorized(verseKey, newState);
        } catch (error) {
            console.error("Failed to toggle memory state", error);
            // Revert on error
            setProgress(prev => ({
                ...prev,
                [verseKey]: currentState
            }));
        }
    }, [progress]);

    // When currentPage changes, load ayahs
    useEffect(() => {
        if (initStatus === 'success') {
            fetchPage(currentPage);
        }
    }, [currentPage, initStatus, fetchPage]);

    // Auto initialize on mount
    useEffect(() => {
        initialize();
    }, [initialize]);


    return {
        initStatus,
        initMessage,
        currentPage,
        ayahs,
        progress,
        loadingPage,
        setPage,
        toggleMemorized,
        retryInit: initialize
    };
}
