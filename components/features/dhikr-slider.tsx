import React, { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Star, Moon } from "lucide-react";
import { Dhikr } from "@/lib/athkari-data";
import { getDhikrIconData } from "@/components/ui/icons";

interface DhikrCardsSliderProps {
    adhkar: Dhikr[];
    activeDhikrId: string;
    counters: Record<string, number>;
    onSelectDhikr: (id: string) => void;
}

export function DhikrCardsSlider({
    adhkar,
    activeDhikrId,
    counters,
    onSelectDhikr,
}: DhikrCardsSliderProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to active dhikr
    useEffect(() => {
        if (scrollRef.current) {
            // Find element by data-id
            const nodes = scrollRef.current.querySelectorAll('button');
            let targetNode: Element | null = null;
            nodes.forEach(node => {
                if (node.getAttribute('data-id') === activeDhikrId) {
                    targetNode = node;
                }
            });

            if (targetNode) {
                (targetNode as Element).scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
            }
        }
    }, [activeDhikrId]);

    return (
        <div ref={scrollRef} className="flex gap-3 overflow-x-auto overflow-y-hidden px-4 py-4 scrollbar-hide snap-x touch-pan-x" style={{ touchAction: "pan-x" }}>
            {adhkar.map((dhikr) => {
                const isActive = activeDhikrId === dhikr.id;
                const current = counters[dhikr.id] || 0;
                const isComplete = current >= dhikr.target;

                const iconData = getDhikrIconData(dhikr.icon);
                // Default to a subtle gray/primary if no specific color found, or use the data color
                const iconColor = iconData?.color || "hsl(var(--primary))";

                return (
                    <button
                        key={dhikr.id}
                        data-id={dhikr.id}
                        onClick={() => onSelectDhikr(dhikr.id)}
                        className={`
              flex flex-row items-center justify-start gap-[10px]
              min-w-[154px] w-[154px] h-[65px] px-[15px] py-2 rounded-[24px] transition-all snap-center shrink-0 overflow-hidden
              ${isActive
                                ? "neu-flat border-2 border-[#84994f]"
                                : "neu-flat border-2 border-transparent"
                            }
            `}
                    >
                        {/* Icon Box */}
                        <div
                            className={`w-[32px] h-[32px] min-w-[32px] rounded-[8px] neu-pressed flex items-center justify-center`}
                            style={{ color: iconColor }}
                        >
                            {iconData ? (
                                React.cloneElement(iconData.icon as any, { size: 20, strokeWidth: 2 })
                            ) : (
                                <Moon size={20} strokeWidth={2} />
                            )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 flex flex-col justify-center h-full">
                            {/* Dhikr Name */}
                            <p className="text-[14px] font-medium text-[#6f6f6f] text-right truncate w-full leading-[22px] tracking-tight">
                                {dhikr.text}
                            </p>

                            {/* Count */}
                            <div className="flex items-center justify-end gap-1 leading-none mt-[-2px]">
                                <span className="text-[9px] font-medium text-[#8E8E93] tracking-tight">{dhikr.target} / </span>
                                <motion.span
                                    key={current}
                                    initial={{ scale: 1.2, color: "hsl(var(--primary))" }}
                                    animate={{ scale: 1, color: "#84994f" }}
                                    transition={{ duration: 0.2 }}
                                    className="text-[14px] font-medium text-[#84994f] tracking-tight"
                                >
                                    {current}
                                </motion.span>
                            </div>
                        </div>

                        {isComplete && (
                            <div className="absolute top-2 left-2">
                                <Star size={10} className="text-yellow-500 fill-yellow-500" />
                            </div>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
