"use client";

import React, { useState, useEffect, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface QuranViewerScreenProps {
    initialPage: number;
    onBack: () => void;
}

export default function QuranViewerScreen({ initialPage, onBack }: QuranViewerScreenProps) {
    const [emblaRef, emblaApi] = useEmblaCarousel({
        direction: 'rtl',
        startIndex: initialPage - 1,
        dragFree: false,
    });
    const [currentPage, setCurrentPage] = useState(initialPage);
    const [controlsVisible, setControlsVisible] = useState(false);

    const onSelect = useCallback(() => {
        if (!emblaApi) return;
        setCurrentPage(emblaApi.selectedScrollSnap() + 1);
    }, [emblaApi, setCurrentPage]);

    useEffect(() => {
        if (!emblaApi) return;
        emblaApi.on('select', onSelect);
        emblaApi.on('reInit', onSelect);
    }, [emblaApi, onSelect]);

    const pages = Array.from({ length: 604 }, (_, i) => i + 1);

    return (
        <div className="flex flex-col h-full bg-[#F5F1E8] dark:bg-[#0A0A0A] relative overflow-hidden">
            {/* Main Carousel Area */}
            <div
                className="flex-1 w-full h-full relative"
                onClick={() => setControlsVisible(!controlsVisible)}
            >
                <div className="overflow-hidden h-full w-full" ref={emblaRef} dir="rtl">
                    <div className="flex h-full w-full">
                        {pages.map((pageNum) => {
                            // Only render images for pages close to the current page to save memory and DOM nodes
                            const isClose = Math.abs(pageNum - currentPage) <= 3;

                            return (
                                <div className="flex-[0_0_100%] min-w-0 h-full w-full relative" key={pageNum}>
                                    <div className="absolute inset-0 flex items-center justify-center p-0">
                                        {isClose ? (
                                            <img
                                                src={`https://raw.githubusercontent.com/GovarJabbar/Quran-PNG/master/${pageNum.toString().padStart(3, '0')}.png`}
                                                alt={`Page ${pageNum}`}
                                                className="w-full h-full object-contain dark:invert hue-rotate-[345deg] saturate-[1022%] brightness-[92%] contrast-[85%] sepia-[21%] invert-[21%] dark:!hue-rotate-0 dark:!saturate-100 dark:!brightness-100 dark:!contrast-100 dark:!sepia-0 dark:!invert"
                                                loading="lazy"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Overlays */}
            <AnimatePresence>
                {controlsVisible && (
                    <>
                        {/* Top Bar */}
                        <motion.div
                            initial={{ y: -100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -100, opacity: 0 }}
                            className="absolute top-0 left-0 right-0 bg-background/80 backdrop-blur-md px-4 pt-10 pb-4 flex items-center justify-between z-10 border-b border-border shadow-sm"
                        >
                            <button
                                onClick={(e) => { e.stopPropagation(); onBack(); }}
                                className="p-2.5 rounded-xl text-muted-foreground min-h-[44px] min-w-[44px] flex items-center justify-center neu-flat active:neu-pressed transition-all bg-background"
                            >
                                <ChevronRight size={20} />
                            </button>

                            <div className="text-center font-bold text-foreground text-lg">
                                صفحة {currentPage}
                            </div>

                            <div className="w-[44px]"></div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
