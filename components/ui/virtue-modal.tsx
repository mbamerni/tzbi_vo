import React from "react";
import { Lightbulb } from "lucide-react";
import { Dhikr } from "@/lib/athkari-data";

interface VirtueModalProps {
    dhikr: Dhikr;
    onClose: () => void;
}

export function VirtueModal({ dhikr, onClose }: VirtueModalProps) {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="bg-card rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center gap-2 mb-4">
                    <Lightbulb size={20} className="text-primary" />
                    <h3 className="font-semibold text-card-foreground">فضل الذكر</h3>
                </div>
                <div className="bg-secondary/50 p-4 rounded-xl mb-4">
                    <p className="font-serif text-card-foreground leading-relaxed text-base text-center">
                        {dhikr.text}
                    </p>
                </div>

                <p className="text-muted-foreground text-sm leading-relaxed">
                    {dhikr.virtue || " "}
                </p>
                <button
                    type="button"
                    onClick={onClose}
                    className="mt-6 w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity"
                >
                    إغلاق
                </button>
            </div>
        </div>
    );
}
