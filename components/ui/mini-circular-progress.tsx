import React from "react";

interface MiniCircularProgressProps {
    progress: number;
    size?: number;
    strokeWidth?: number;
    children?: React.ReactNode;
}

export function MiniCircularProgress({
    progress, // 0 to 1
    size = 26,
    strokeWidth = 2,
    children
}: MiniCircularProgressProps) {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - Math.min(progress, 1) * circumference;

    return (
        <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: size, height: size }}>
            <svg
                height={size}
                width={size}
                className="absolute inset-0 transform -rotate-90 pointer-events-none"
            >
                {/* Background Ring */}
                <circle
                    stroke="hsl(var(--secondary))"
                    strokeOpacity={0.8}
                    fill="transparent"
                    strokeWidth={strokeWidth}
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                />
                {/* Progress Ring */}
                <circle
                    stroke="hsl(var(--primary))"
                    fill="transparent"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={`${circumference} ${circumference}`}
                    style={{
                        strokeDashoffset,
                        transition: "stroke-dashoffset 0.5s ease",
                    }}
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                />
            </svg>
            {/* Content (Day Number) - Centered */}
            <div className="relative z-10 flex items-center justify-center w-full h-full">
                {children}
            </div>
        </div>
    );
}
