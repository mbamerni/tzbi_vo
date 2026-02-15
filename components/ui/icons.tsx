import React from "react";
import {
    Moon,
    Sun,
    Sunrise,
    Star,
    Heart,
    Sparkles,
    Flower2,
    HandMetal,
    CloudRain,
    Zap,
    Award,
    Crown,
    Leaf,
    Droplet,
    Flame,
    BookOpen,
} from "lucide-react";

export const ICON_OPTIONS = [
    { value: "moon", icon: <Moon size={20} />, label: "هلال", color: "#6366f1" },
    { value: "sun", icon: <Sun size={20} />, label: "شمس", color: "#f59e0b" },
    { value: "sunrise", icon: <Sunrise size={20} />, label: "شروق", color: "#f97316" },
    { value: "star", icon: <Star size={20} />, label: "نجمة", color: "#eab308" },
    { value: "heart", icon: <Heart size={20} />, label: "قلب", color: "#ec4899" },
    { value: "sparkles", icon: <Sparkles size={20} />, label: "تألق", color: "#8b5cf6" },
    { value: "flower", icon: <Flower2 size={20} />, label: "زهرة", color: "#d946ef" },
    { value: "hand", icon: <HandMetal size={20} />, label: "يد", color: "#14b8a6" },
    { value: "cloud", icon: <CloudRain size={20} />, label: "سحابة", color: "#3b82f6" },
    { value: "zap", icon: <Zap size={20} />, label: "برق", color: "#facc15" },
    { value: "award", icon: <Award size={20} />, label: "وسام", color: "#f59e0b" },
    { value: "crown", icon: <Crown size={20} />, label: "تاج", color: "#eab308" },
    { value: "leaf", icon: <Leaf size={20} />, label: "ورقة", color: "#22c55e" },
    { value: "droplet", icon: <Droplet size={20} />, label: "قطرة", color: "#0ea5e9" },
    { value: "flame", icon: <Flame size={20} />, label: "شعلة", color: "#ef4444" },
    { value: "book", icon: <BookOpen size={20} />, label: "كتاب", color: "#a855f7" },
];

export function getGroupIcon(icon: string, size = 20) {
    const iconProps = { size };
    switch (icon) {
        case "moon": return <Moon {...iconProps} />;
        case "sunrise": return <Sunrise {...iconProps} />;
        case "sun": return <Sun {...iconProps} />;
        case "star": return <Star {...iconProps} />;
        case "heart": return <Heart {...iconProps} />;
        case "sparkles": return <Sparkles {...iconProps} />;
        case "flower": return <Flower2 {...iconProps} />;
        case "hand": return <HandMetal {...iconProps} />;
        case "cloud": return <CloudRain {...iconProps} />;
        case "zap": return <Zap {...iconProps} />;
        case "award": return <Award {...iconProps} />;
        case "crown": return <Crown {...iconProps} />;
        case "leaf": return <Leaf {...iconProps} />;
        case "droplet": return <Droplet {...iconProps} />;
        case "flame": return <Flame {...iconProps} />;
        case "book": return <BookOpen {...iconProps} />;
        default: return <Moon {...iconProps} />;
    }
}

export function getDhikrIconData(icon?: string) {
    if (!icon) return null;
    return ICON_OPTIONS.find((o) => o.value === icon);
}

export function getDhikrIcon(icon?: string) {
    const data = getDhikrIconData(icon);
    return data ? data.icon : null;
}
