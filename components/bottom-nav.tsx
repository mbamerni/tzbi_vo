import React from "react";

// --- SVGs as Components ---
const FocusIcon = ({ active }: { active: boolean }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 25 25" fill="none">
        <g clipPath="url(#clip0_29_67)">
            <path
                d="M12.5 8.33331V16.6666M8.33333 12.5H16.6667M22.9167 12.5C22.9167 18.2529 18.253 22.9166 12.5 22.9166C6.74703 22.9166 2.08333 18.2529 2.08333 12.5C2.08333 6.74701 6.74703 2.08331 12.5 2.08331C18.253 2.08331 22.9167 6.74701 22.9167 12.5Z"
                stroke={active ? "#84994F" : "#6F6F6F"}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </g>
        <defs>
            <clipPath id="clip0_29_67">
                <rect width="25" height="25" fill="white" />
            </clipPath>
        </defs>
    </svg>
);

const GroupsIcon = ({ active }: { active: boolean }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" fill="none">
        <path
            d="M10.6667 8H28M10.6667 16H28M10.6667 24H28M4 8H4.01333M4 16H4.01333M4 24H4.01333"
            stroke={active ? "#84994F" : "#6F6F6F"}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

const StatsIcon = ({ active }: { active: boolean }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="23" height="23" viewBox="0 0 23 23" fill="none">
        <path
            d="M15.3333 1.91669V5.75002M7.66667 1.91669V5.75002M2.875 9.58335H20.125M4.79167 3.83335H18.2083C19.2669 3.83335 20.125 4.69147 20.125 5.75002V19.1667C20.125 20.2252 19.2669 21.0834 18.2083 21.0834H4.79167C3.73312 21.0834 2.875 20.2252 2.875 19.1667V5.75002C2.875 4.69147 3.73312 3.83335 4.79167 3.83335Z"
            stroke={active ? "#84994F" : "#6F6F6F"}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

const ExtraIcon = ({ active }: { active: boolean }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path
            d="M17.4167 19.25L11 14.6667L4.58334 19.25V4.58333C4.58334 4.0971 4.7765 3.63079 5.12031 3.28697C5.46413 2.94315 5.93045 2.75 6.41668 2.75H15.5833C16.0696 2.75 16.5359 2.94315 16.8797 3.28697C17.2235 3.63079 17.4167 4.0971 17.4167 4.58333V19.25Z"
            stroke={active ? "#84994F" : "#6F6F6F"}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

interface BottomNavProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
    const tabs = [
        { id: "focus", Icon: FocusIcon },
        { id: "groups", Icon: GroupsIcon },
        { id: "stats", Icon: StatsIcon },
        { id: "extra", Icon: ExtraIcon },
    ];

    return (
        <div
            className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center justify-between px-2 w-[361px] h-[57px] rounded-[28.5px] bg-[#F0F0F0] backdrop-blur-md z-50 transition-all duration-300"
            style={{
                boxShadow: `-1px 1px 2px 0 rgba(198, 198, 199, 0.20), 1px -1px 2px 0 rgba(198, 198, 199, 0.20), -1px -1px 2px 0 rgba(255, 255, 255, 0.90), 1px 1px 3px 0 rgba(198, 198, 199, 0.90)`
            }}
        >
            {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={`
              flex items-center justify-center transition-all duration-300
              ${isActive
                                ? "w-[77px] h-[52px] rounded-[26px] bg-[#F0F0F0]"
                                : "w-[50px] h-[50px] bg-transparent" // Adjust width for inactive items
                            }
            `}
                        style={isActive ? {
                            boxShadow: `-1px 1px 2px 0 rgba(198, 198, 199, 0.20) inset, 1px -1px 2px 0 rgba(198, 198, 199, 0.20) inset, -1px -1px 2px 0 rgba(255, 255, 255, 0.90) inset, 1px 1px 3px 0 rgba(198, 198, 199, 0.90) inset`
                        } : {}}
                    >
                        <tab.Icon active={isActive} />
                    </button>
                );
            })}
        </div>
    );
}
