"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { BookOpen, Moon, Book } from "lucide-react";

import { useQuranRepetition, Ayah } from "@/hooks/use-quran-repetition";
import { QURAN_SURAHS, SurahMeta } from "@/lib/quran-surahs";
import { Loader2, RotateCcw, Minus } from "lucide-react";

// --- Components ---
function CircularProgress({
    current,
    target,
}: { current: number; target: number }) {
    const progress = target > 0 ? Math.min(current / target, 1) : 0;
    const radius = 60;
    const stroke = 6;
    const normalizedRadius = radius - stroke;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - progress * circumference;

    return (
        <svg
            height={radius * 2}
            width={radius * 2}
            className="transform -rotate-90 pointer-events-none"
        >
            <circle
                stroke="hsl(var(--border))"
                fill="transparent"
                strokeWidth={stroke}
                r={normalizedRadius}
                cx={radius}
                cy={radius}
            />
            <circle
                stroke="hsl(var(--primary))"
                fill="transparent"
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={`${circumference} ${circumference}`}
                style={{
                    strokeDashoffset,
                    transition: "stroke-dashoffset 0.3s ease",
                }}
                r={normalizedRadius}
                cx={radius}
                cy={radius}
            />
        </svg>
    );
}

function SurahFilter({
    surahs,
    selectedSurahId,
    onSelectSurah,
}: {
    surahs: SurahMeta[];
    selectedSurahId: number;
    onSelectSurah: (id: number) => void;
}) {
    return (
        <div className="flex gap-2 overflow-x-auto px-4 py-1.5 scrollbar-hide snap-x mt-4">
            {surahs.map((surah) => {
                const isSelected = selectedSurahId === surah.id;
                return (
                    <button
                        key={surah.id}
                        onClick={() => onSelectSurah(surah.id)}
                        className={`px-3 h-[19px] rounded-[9px] text-[11px] font-medium transition-all whitespace-nowrap flex items-center justify-center min-w-fit gap-1 ${isSelected
                            ? "bg-[#A72703] text-[#FFFFFF] neu-sm-flat"
                            : "bg-[#F0F0F0] text-[#6F6F6F] neu-sm-flat"
                            }`}
                    >
                        <span>{surah.name_arabic}</span>
                    </button>
                );
            })}
        </div>
    );
}

function VersesSlider({
    verses,
    activeVerseNumber,
    onSelectVerse,
    getVerseProgress,
    surahId
}: {
    verses: Ayah[];
    activeVerseNumber: number;
    onSelectVerse: (num: number) => void;
    getVerseProgress: (surahId: number, verseNum: number) => number;
    surahId: number;
}) {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            const nodes = scrollRef.current.querySelectorAll('button');
            let targetNode: Element | null = null;
            nodes.forEach(node => {
                if (node.getAttribute('data-id') === activeVerseNumber.toString()) {
                    targetNode = node;
                }
            });
            if (targetNode) {
                (targetNode as Element).scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
            }
        }
    }, [activeVerseNumber]);

    return (
        <div ref={scrollRef} className="flex gap-3 overflow-x-auto overflow-y-hidden px-4 py-4 scrollbar-hide snap-x touch-pan-x" style={{ touchAction: "pan-x" }}>
            {verses.map((verse) => {
                const isActive = activeVerseNumber === verse.numberInSurah;
                const historicalTarget = getVerseProgress(surahId, verse.numberInSurah);

                return (
                    <button
                        key={verse.numberInSurah}
                        data-id={verse.numberInSurah}
                        onClick={() => onSelectVerse(verse.numberInSurah)}
                        className={`
              flex flex-col items-center justify-center gap-1
              min-w-[154px] w-[154px] h-[65px] px-[15px] py-2 rounded-[24px] transition-all snap-center shrink-0 overflow-hidden
              ${isActive
                                ? "neu-flat border-2 border-[#84994f]"
                                : "neu-flat border-2 border-transparent"
                            }
            `}
                    >
                        <p className="text-[14px] font-medium text-[#6f6f6f] text-right truncate w-full leading-[22px] tracking-tight">
                            {verse.text}
                        </p>
                        <div className="flex items-center justify-between w-full mt-[-2px]">
                            <span className="text-[10px] font-medium text-[#8E8E93]">الآية {verse.numberInSurah}</span>
                            <span className="text-[9px] font-medium text-[#84994f] tracking-tight">الهدف السابق: {historicalTarget}</span>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}

export default function QuranRepetitionScreen() {
    const { loadSurah, progress, loadingSurahs, surahCache, incrementVerse, decrementVerse, getVerseProgress, saveSession } = useQuranRepetition();

    // Default to Al-Fatiha (1) or the first available
    const [selectedSurahId, setSelectedSurahId] = useState<number>(QURAN_SURAHS[0]?.id || 1);
    const [activeVerseNumber, setActiveVerseNumber] = useState<number>(1);
    const [tapAnimation, setTapAnimation] = useState(false);

    // Mode State
    const [mode, setMode] = useState<'single' | 'session'>('single');
    const [sessionStartVerse, setSessionStartVerse] = useState<number>(1);
    const [sessionEndVerse, setSessionEndVerse] = useState<number>(1);
    const [sessionCount, setSessionCount] = useState<number>(0);

    // Load surah when selected changes
    useEffect(() => {
        loadSurah(selectedSurahId).then(data => {
            if (data && data.ayahs && data.ayahs.length > 0) {
                setActiveVerseNumber(1); // Reset to first verse when changing surahs
                setSessionStartVerse(1);
                setSessionEndVerse(data.ayahs.length);
                setSessionCount(0);
            }
        });
    }, [selectedSurahId, loadSurah]);

    const activeSurahData = surahCache[selectedSurahId];
    const verses = activeSurahData?.ayahs || [];
    const activeVerse = verses.find(v => v.numberInSurah === activeVerseNumber);

    const isLoading = loadingSurahs[selectedSurahId];
    const currentCount = activeVerse ? getVerseProgress(selectedSurahId, activeVerse.numberInSurah) : 0;

    // Audio setup
    const audioContextRef = useRef<AudioContext | null>(null);
    const audioBufferRef = useRef<AudioBuffer | null>(null);

    useEffect(() => {
        const initAudio = async () => {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContext) return;
            if (!audioContextRef.current) audioContextRef.current = new AudioContext();
            try {
                const response = await fetch("/sounds/click-light.mp3");
                if (response.ok) {
                    const arrayBuffer = await response.arrayBuffer();
                    if (audioContextRef.current) {
                        audioBufferRef.current = await audioContextRef.current.decodeAudioData(arrayBuffer);
                    }
                }
            } catch (e) {
                console.error("Error loading audio:", e);
            }
        };
        initAudio();
        return () => {
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, []);

    const playSound = useCallback(() => {
        try {
            const ctx = audioContextRef.current;
            if (!ctx || !audioBufferRef.current) return;
            if (ctx.state === 'suspended') ctx.resume();

            const source = ctx.createBufferSource();
            source.buffer = audioBufferRef.current;

            const gainNode = ctx.createGain();
            gainNode.gain.value = 0.6;

            source.connect(gainNode);
            gainNode.connect(ctx.destination);

            source.start(0);
            source.stop(ctx.currentTime + 0.15);
        } catch (e) {
            console.error("Audio playback error", e);
        }
    }, []);

    const handleTap = useCallback(() => {
        if (!activeVerse) return;

        incrementVerse(selectedSurahId, activeVerse.numberInSurah);

        setTapAnimation(true);
        setTimeout(() => setTapAnimation(false), 150);

        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(10);
        }

        playSound();
    }, [activeVerse, selectedSurahId, incrementVerse, playSound]);

    const handleUndo = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        if (!activeVerse) return;
        decrementVerse(selectedSurahId, activeVerse.numberInSurah);
    }, [activeVerse, selectedSurahId, decrementVerse]);

    const handleSessionTap = useCallback(() => {
        setSessionCount(prev => prev + 1);
        setTapAnimation(true);
        setTimeout(() => setTapAnimation(false), 150);
        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
        playSound();
    }, [playSound]);

    const handleSaveSession = useCallback(() => {
        if (sessionStartVerse <= sessionEndVerse && sessionCount > 0) {
            const success = saveSession(selectedSurahId, sessionStartVerse, sessionEndVerse, sessionCount);
            if (success) {
                setSessionCount(0);
                alert("تم حفظ الجلسة بنجاح وتحديث الآيات");
            }
        }
    }, [selectedSurahId, sessionStartVerse, sessionEndVerse, sessionCount, saveSession]);

    if (!activeVerse) return null;

    return (
        <div className="flex flex-col h-full bg-background pt-2">
            {/* 1. Top Header: Surah Filter */}
            <div className="active:pt-0">
                <SurahFilter
                    surahs={QURAN_SURAHS}
                    selectedSurahId={selectedSurahId}
                    onSelectSurah={setSelectedSurahId}
                />
            </div>

            {/* Mode Toggle */}
            <div className="px-4 mt-4 mb-2 flex justify-center">
                <div className="flex bg-[#F0F0F0] p-1 rounded-2xl w-full max-w-sm neu-pressed border-2 border-transparent">
                    <button
                        onClick={() => setMode('single')}
                        className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all ${mode === 'single' ? 'bg-[#A72703] text-white shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        تكرار مفرد
                    </button>
                    <button
                        onClick={() => setMode('session')}
                        className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all ${mode === 'session' ? 'bg-[#A72703] text-white shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        جلسة مراجعة
                    </button>
                </div>
            </div>

            {isLoading && !activeSurahData ? (
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="animate-spin text-primary" size={32} />
                </div>
            ) : (
                <>
                    {mode === 'single' ? (
                        <>
                            {/* 2. Swiper Cards: Verses */}
                            <VersesSlider
                                verses={verses}
                                activeVerseNumber={activeVerseNumber}
                                onSelectVerse={setActiveVerseNumber}
                                getVerseProgress={getVerseProgress}
                                surahId={selectedSurahId}
                            />

                            {/* 3. Main Action Area: Giant Button */}
                            <div className="flex-1 px-4 pb-4 pt-2 flex flex-col justify-end">
                                <button
                                    onClick={handleTap}
                                    className={`w-full relative h-full min-h-[300px] flex-1 rounded-[28px] flex flex-col items-center p-6 transition-all overflow-hidden border-0 bg-[#F0F0F0]
                        ${tapAnimation ? "neu-pressed scale-[0.99]" : "neu-flat hover:neu-flat"} 
                    `}
                                >
                                    {/* Content Container */}
                                    <div className="flex-1 flex flex-col items-center justify-start pt-12 w-full max-w-[90%]">
                                        <h2 className="font-serif text-xl sm:text-2xl text-center leading-loose text-foreground font-medium text-balance mb-4 line-clamp-3 overflow-hidden text-ellipsis px-2">
                                            {activeVerse.text}
                                        </h2>
                                        <p className="text-sm text-primary font-bold text-center mb-8">
                                            الآية {activeVerse.numberInSurah}
                                        </p>
                                    </div>

                                    {/* Progress Circle & Counter */}
                                    <div className="flex-1 flex items-center justify-center pb-8">
                                        <div className={`relative transition-transform duration-100 ${tapAnimation ? "scale-95" : "scale-100"}`}>
                                            <div className="w-[120px] h-[120px] rounded-full border-[6px] border-primary/20 flex items-center justify-center">
                                                <span className="text-4xl font-bold font-mono tracking-tight text-foreground">
                                                    {currentCount}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Bottom Target Indicator */}
                                    <div className="absolute bottom-6 text-sm font-medium text-muted-foreground bg-secondary/50 px-4 py-1.5 rounded-full backdrop-blur-sm">
                                        الهدف السابق: {currentCount}
                                    </div>

                                    {/* Bottom Left Controls: Undo */}
                                    <div className="absolute bottom-6 left-6 flex flex-col gap-3 z-30" onClick={e => e.stopPropagation()}>
                                        <div
                                            role="button"
                                            onClick={handleUndo}
                                            className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-transform active:scale-95"
                                            style={{
                                                background: '#F0F0F0',
                                                boxShadow: '-0.946px 0.946px 1.892px 0 rgba(198, 198, 199, 0.20) inset, 0.946px -0.946px 1.892px 0 rgba(198, 198, 199, 0.20) inset, -0.946px -0.946px 1.892px 0 rgba(255, 255, 255, 0.90) inset, 0.946px 0.946px 2.366px 0 rgba(198, 198, 199, 0.90) inset',
                                                color: '#A72703'
                                            }}
                                        >
                                            <Minus size={18} />
                                        </div>
                                    </div>
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 px-4 pb-[85px] mt-4 flex flex-col justify-start">
                            <div className="neu-flat p-6 pt-5 rounded-[28px] bg-[#F0F0F0] flex flex-col items-center flex-1 h-full min-h-[300px]">
                                <h3 className="font-serif text-lg text-foreground mb-6 font-semibold">تحديد نطاق المراجعة</h3>

                                <div className="flex w-full gap-4 mb-4 justify-center items-center">
                                    <div className="flex flex-col flex-1 max-w-[120px]">
                                        <label className="text-xs text-muted-foreground mb-2 text-center">من آية:</label>
                                        <select
                                            value={sessionStartVerse}
                                            onChange={e => {
                                                const val = Number(e.target.value);
                                                setSessionStartVerse(val);
                                                if (val > sessionEndVerse) setSessionEndVerse(val);
                                            }}
                                            className="bg-transparent border-2 border-primary/20 rounded-xl px-2 py-2 text-center font-mono text-lg focus:outline-none focus:border-primary"
                                        >
                                            {verses.map(v => <option key={`start-${v.numberInSurah}`} value={v.numberInSurah}>{v.numberInSurah}</option>)}
                                        </select>
                                    </div>
                                    <div className="text-muted-foreground mt-6">-</div>
                                    <div className="flex flex-col flex-1 max-w-[120px]">
                                        <label className="text-xs text-muted-foreground mb-2 text-center">إلى آية:</label>
                                        <select
                                            value={sessionEndVerse}
                                            onChange={e => {
                                                const val = Number(e.target.value);
                                                setSessionEndVerse(val);
                                                if (val < sessionStartVerse) setSessionStartVerse(val);
                                            }}
                                            className="bg-transparent border-2 border-primary/20 rounded-xl px-2 py-2 text-center font-mono text-lg focus:outline-none focus:border-primary"
                                        >
                                            {verses.map(v => <option key={`end-${v.numberInSurah}`} value={v.numberInSurah}>{v.numberInSurah}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <button
                                    onClick={handleSessionTap}
                                    className={`relative w-40 h-40 sm:w-48 sm:h-48 rounded-full flex flex-col items-center justify-center p-6 transition-all overflow-hidden border-0 bg-[#F0F0F0] mt-auto sm:mb-6 mb-4
                                        ${tapAnimation ? "neu-pressed scale-[0.98]" : "neu-flat hover:neu-flat"} 
                                    `}
                                >
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-[110px] h-[110px] sm:w-[130px] sm:h-[130px] rounded-full border-[6px] border-[#84994f]/20 flex items-center justify-center">
                                            <span className="text-4xl sm:text-5xl font-bold font-mono tracking-tight text-[#84994f]">
                                                {sessionCount}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="absolute bottom-4 text-xs font-medium text-muted-foreground opacity-70">
                                        الحالي
                                    </div>
                                </button>

                                <button
                                    onClick={handleSaveSession}
                                    disabled={sessionCount === 0}
                                    className={`mt-auto w-full max-w-[200px] py-4 rounded-xl font-medium transition-all ${sessionCount > 0 ? 'bg-primary text-primary-foreground shadow-lg hover:opacity-90 active:scale-95' : 'bg-primary/50 text-primary-foreground/50 opacity-50 cursor-not-allowed'} z-10`}
                                >
                                    حفظ وإنهاء الجلسة
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
