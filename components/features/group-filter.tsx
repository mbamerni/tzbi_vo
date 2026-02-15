import React from 'react';
import { DhikrGroup } from '@/lib/athkari-data';

export function GroupFilter({
    groups,
    selectedGroupId,
    onSelectGroup,
}: {
    groups: DhikrGroup[];
    selectedGroupId: string | "all";
    onSelectGroup: (id: string | "all") => void;
}) {
    return (
        <div className="flex gap-2 overflow-x-auto px-4 py-1.5 scrollbar-hide snap-x">
            <button
                onClick={() => onSelectGroup("all")}
                className={`px-3 h-[19px] rounded-[9px] text-[11px] font-medium transition-all whitespace-nowrap min-w-fit flex items-center justify-center ${selectedGroupId === "all"
                    ? "bg-[#A72703] text-[#FFFFFF] neu-sm-flat" // Active: Red + White
                    : "bg-[#F0F0F0] text-[#6F6F6F] neu-sm-flat" // Inactive: Gray + Flat
                    }`}
            >
                الكل
            </button>
            {groups.map((group) => {
                const isSelected = selectedGroupId === group.id;
                return (
                    <button
                        key={group.id}
                        onClick={() => onSelectGroup(group.id)}
                        className={`px-3 h-[19px] rounded-[9px] text-[11px] font-medium transition-all whitespace-nowrap flex items-center justify-center min-w-fit ${isSelected
                            ? "bg-[#A72703] text-[#FFFFFF] neu-sm-flat"
                            : "bg-[#F0F0F0] text-[#6F6F6F] neu-sm-flat"
                            }`}
                    >
                        {group.name}
                    </button>
                );
            })}
        </div>
    );
}
