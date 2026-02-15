import React from "react";

interface CircularProgressProps {
    current: number;
    target: number;
}

export function CircularProgress({ current, target }: CircularProgressProps) {
    const progress = Math.min(current / target, 1);
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
