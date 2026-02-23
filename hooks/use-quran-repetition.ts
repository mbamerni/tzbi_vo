import { useState, useEffect, useCallback } from 'react';

export interface Ayah {
    number: number;
    text: string;
    numberInSurah: number;
    juz: number;
    manzil: number;
    page: number;
    ruku: number;
    hizbQuarter: number;
    sajda: boolean | object;
}

export interface SurahData {
    number: number;
    name: string;
    englishName: string;
    englishNameTranslation: string;
    revelationType: string;
    numberOfAyahs: number;
    ayahs: Ayah[];
}

export function useQuranRepetition() {
    const [surahCache, setSurahCache] = useState<Record<number, SurahData>>({});
    const [progress, setProgress] = useState<Record<string, number>>({});
    const [loadingSurahs, setLoadingSurahs] = useState<Record<number, boolean>>({});

    // Load progress from localStorage on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            try {
                const saved = localStorage.getItem('quran_repetition_progress');
                if (saved) {
                    setProgress(JSON.parse(saved));
                }
            } catch (e) {
                console.error("Failed to load quran repetition progress", e);
            }
        }
    }, []);

    // Save progress to localStorage whenever it changes
    const saveProgress = useCallback((updater: (prev: Record<string, number>) => Record<string, number>) => {
        setProgress(prev => {
            const newProgress = updater(prev);
            if (typeof window !== 'undefined') {
                localStorage.setItem('quran_repetition_progress', JSON.stringify(newProgress));
            }
            return newProgress;
        });
    }, []);

    const loadSurah = useCallback(async (surahId: number) => {
        // 1. Check Memory Cache (already loaded in this session)
        if (surahCache[surahId]) {
            return surahCache[surahId];
        }

        const cacheKey = `quran_surah_${surahId}`;

        // 2. Check localStorage Cache (offline first)
        if (typeof window !== 'undefined') {
            try {
                const cachedSurahStr = localStorage.getItem(cacheKey);
                if (cachedSurahStr) {
                    const parsedSurah = JSON.parse(cachedSurahStr) as SurahData;
                    setSurahCache(prev => ({ ...prev, [surahId]: parsedSurah }));
                    return parsedSurah;
                }
            } catch (e) {
                console.warn("Failed to parse cached surah", e);
            }
        }

        // 3. Fetch from API if not cached
        setLoadingSurahs(prev => ({ ...prev, [surahId]: true }));
        try {
            const response = await fetch(`https://api.alquran.cloud/v1/surah/${surahId}/quran-uthmani`);
            if (!response.ok) {
                throw new Error(`Failed to fetch surah ${surahId}`);
            }

            const json = await response.json();
            const surahData = json.data as SurahData;

            // Cache in memory
            setSurahCache(prev => ({ ...prev, [surahId]: surahData }));

            // Cache in localStorage
            if (typeof window !== 'undefined') {
                try {
                    localStorage.setItem(cacheKey, JSON.stringify(surahData));
                } catch (e) {
                    console.warn("Failed to save surah to localStorage (Quota exceeded?)", e);
                }
            }

            return surahData;
        } catch (error) {
            console.error("Error loading surah:", error);
            // In a real app, you might want to show a toast or error state here
            return null;
        } finally {
            setLoadingSurahs(prev => ({ ...prev, [surahId]: false }));
        }
    }, [surahCache]);

    const incrementVerse = useCallback((surahId: number, verseNumberInSurah: number) => {
        const key = `${surahId}_${verseNumberInSurah}`;
        saveProgress((prev) => {
            const current = prev[key] || 0;
            return { ...prev, [key]: current + 1 };
        });
    }, [saveProgress]);

    const decrementVerse = useCallback((surahId: number, verseNumberInSurah: number) => {
        const key = `${surahId}_${verseNumberInSurah}`;
        saveProgress((prev) => {
            const current = prev[key] || 0;
            if (current === 0) return prev;
            return { ...prev, [key]: current - 1 };
        });
    }, [saveProgress]);

    const saveSession = useCallback((surahId: number, startVerse: number, endVerse: number, sessionCount: number) => {
        if (sessionCount <= 0 || startVerse > endVerse) return false;

        saveProgress((prev) => {
            const next = { ...prev };
            for (let v = startVerse; v <= endVerse; v++) {
                const key = `${surahId}_${v}`;
                const current = next[key] || 0;
                next[key] = current + sessionCount;
            }
            return next;
        });
        return true;
    }, [saveProgress]);

    const getVerseProgress = useCallback((surahId: number, verseNumberInSurah: number) => {
        const key = `${surahId}_${verseNumberInSurah}`;
        return progress[key] || 0;
    }, [progress]);

    return {
        loadSurah,
        progress,
        loadingSurahs,
        surahCache,
        incrementVerse,
        decrementVerse,
        getVerseProgress,
        saveSession
    };
}
