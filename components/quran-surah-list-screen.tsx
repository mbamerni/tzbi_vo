"use client";

import React, { useState } from "react";
import { ChevronRight, Search, BookOpen, Crown } from "lucide-react";
import { QURAN_SURAHS, SurahMeta } from "@/lib/quran-surahs";
import { motion } from "framer-motion";

interface SurahListScreenProps {
    onBack: () => void;
    onSelectSurah: (surah: SurahMeta) => void;
    surahProgress: Record<number, number>; // Surah ID -> Percentage (0-100)
}

export default function SurahListScreen({ onBack, onSelectSurah, surahProgress }: SurahListScreenProps) {
    const [searchQuery, setSearchQuery] = useState("");

    const filteredSurahs = QURAN_SURAHS.filter(s =>
        s.name_arabic.includes(searchQuery) ||
        s.name_simple.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex flex-col h-full bg-background relative overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 pt-5 pb-3">
                <button
                    onClick={onBack}
                    className="p-2.5 rounded-xl text-muted-foreground min-h-[44px] min-w-[44px] flex items-center justify-center neu-flat active:neu-pressed transition-all"
                >
                    <ChevronRight size={20} />
                </button>
                <div className="flex-1">
                    <h2 className="font-semibold text-foreground text-lg flex items-center gap-2">
                        <BookOpen size={18} className="text-primary" />
                        حفظ القرآن الكريم
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        الفهرس
                    </p>
                </div>
            </div>

            {/* Search Bar */}
            <div className="px-4 py-2">
                <div className="relative">
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <Search className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="ابحث عن اسم السورة..."
                        className="w-full pl-3 pr-10 py-3 rounded-2xl bg-transparent border-none focus:outline-none focus:ring-0 text-foreground text-sm neu-pressed"
                        dir="rtl"
                    />
                </div>
            </div>

            {/* Surah List */}
            <div className="flex-1 overflow-y-auto px-4 pb-12 pt-2">
                <div className="space-y-3">
                    {filteredSurahs.map((surah) => {
                        const progress = surahProgress[surah.id] || 0;
                        const isFullyMemorized = progress === 100;

                        return (
                            <button
                                key={surah.id}
                                onClick={() => onSelectSurah(surah)}
                                className={`w-full flex flex-col p-4 rounded-2xl transition-all duration-300 ${isFullyMemorized ? "neu-pressed bg-primary/5" : "neu-flat hover:neu-pressed"
                                    }`}
                            >
                                <div className="flex items-center justify-between w-full mb-3">
                                    <div className="flex items-center gap-3">
                                        {/* Surah Number Icon */}
                                        <div className={`w-10 h-10 flex items-center justify-center rounded-xl font-bold text-sm ${isFullyMemorized ? "bg-primary text-primary-foreground neu-pressed" : "text-muted-foreground neu-pressed"
                                            }`}>
                                            {isFullyMemorized ? <Crown size={16} /> : surah.id}
                                        </div>
                                        <div className="text-right">
                                            <h3 className="font-bold text-foreground font-['Scheherazade_New',_serif] text-xl leading-none">
                                                {surah.name_arabic}
                                            </h3>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {surah.revelation_place === 'makkah' ? 'مكية' : 'مدنية'} • {surah.verses_count} آية
                                            </p>
                                        </div>
                                    </div>

                                    <div className="text-left">
                                        <p className="text-[10px] text-muted-foreground font-mono">
                                            صفحة {surah.pages[0]}
                                        </p>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="w-full">
                                    <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                                        <span>نسبة الحفظ</span>
                                        <span className="font-bold text-primary">{progress}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progress}%` }}
                                        />
                                    </div>
                                </div>
                            </button>
                        );
                    })}

                    {filteredSurahs.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                            <Search size={40} className="mb-3 opacity-30" />
                            <p>لم يتم العثور على أي سورة بهذا الاسم</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
