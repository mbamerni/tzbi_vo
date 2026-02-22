"use client";

import React, { useState } from "react";
import { Search, BookOpen } from "lucide-react";
import { QURAN_SURAHS, SurahMeta } from "@/lib/quran-surahs";

interface QuranIndexScreenProps {
    onSelectPage: (page: number) => void;
}

export default function QuranIndexScreen({ onSelectPage }: QuranIndexScreenProps) {
    const [searchQuery, setSearchQuery] = useState("");

    const filteredSurahs = QURAN_SURAHS.filter(s =>
        s.name_arabic.includes(searchQuery) ||
        s.name_simple.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex flex-col h-full bg-background relative overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 pt-5 pb-3">
                <div className="flex-1">
                    <h2 className="font-semibold text-foreground text-lg flex items-center gap-2">
                        <BookOpen size={18} className="text-primary" />
                        المصحف الشريف
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        فهرس السور
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
                        return (
                            <button
                                key={surah.id}
                                onClick={() => onSelectPage(surah.pages[0])}
                                className="w-full flex flex-col p-4 rounded-2xl transition-all duration-300 neu-flat hover:neu-pressed"
                            >
                                <div className="flex items-center justify-between w-full">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 flex items-center justify-center rounded-xl font-bold text-sm text-muted-foreground neu-pressed">
                                            {surah.id}
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
