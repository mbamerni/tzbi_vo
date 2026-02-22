"use client";

import React, { useState } from "react";
import QuranIndexScreen from "./quran-index-screen";
import QuranViewerScreen from "./quran-viewer-screen";

export default function QuranScreen() {
    const [currentPage, setCurrentPage] = useState<number>(0);

    return (
        <div className="flex flex-col h-full w-full bg-background relative overflow-hidden">
            {currentPage === 0 ? (
                <div className="absolute inset-0 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-[85px] overflow-y-auto">
                    <QuranIndexScreen onSelectPage={setCurrentPage} />
                </div>
            ) : (
                <div className="absolute inset-0 z-50 animate-in fade-in slide-in-from-right duration-300">
                    <QuranViewerScreen
                        initialPage={currentPage}
                        onBack={() => setCurrentPage(0)}
                    />
                </div>
            )}
        </div>
    );
}
