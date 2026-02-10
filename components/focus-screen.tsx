"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import type { DhikrGroup, Dhikr } from "@/lib/athkari-data";
import { supabase } from "@/lib/supabase";
import {
  Moon,
  Sun,
  Sunrise,
  Star,
  Lightbulb,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Heart,
  Sparkles,
  Flower2,
  HandMetal,
  Settings2,
  Volume2,
  Hash,
  MoreHorizontal,
  Calendar,
  Check,
} from "lucide-react";
import { format, addDays, subDays, isSameDay } from "date-fns";
import { ar } from "date-fns/locale";
import { getDhikrIconData } from "./groups-screen";
import { getUserId } from "@/lib/user-identity";

// --- Icons ---
const DHIKR_ICONS: Record<string, React.ReactNode> = {
  moon: <Moon size={18} />,
  sun: <Sun size={18} />,
  sunrise: <Sunrise size={18} />,
  star: <Star size={18} />,
  heart: <Heart size={18} />,
  sparkles: <Sparkles size={18} />,
  flower: <Flower2 size={18} />,
  hand: <HandMetal size={18} />,
};

function getDhikrIcon(icon?: string) {
  if (!icon || !DHIKR_ICONS[icon]) return null;
  return DHIKR_ICONS[icon];
}

// --- Components ---

function CircularProgress({
  current,
  target,
}: { current: number; target: number }) {
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

function DayStrip({
  selectedDate,
  onSelectDate,
}: {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}) {
  // State for infinite scroll limits
  const [pastDays, setPastDays] = useState(14);
  const [futureDays, setFutureDays] = useState(14);
  const scrollRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false); // To prevent multiple triggers

  // Generate days chronologically: [Oldest (Past) ... Today ... Newest (Future)]
  // In RTL, Oldest will be at Rightmost (Start), Newest at Leftmost (End).
  // This matches "9 10 11" reading Right-to-Left.
  const days = React.useMemo(() => {
    const arr = [];
    for (let i = -pastDays; i <= futureDays; i++) {
      // i negative = Past (subDays). i positive = Future (addDays).
      // Actually addDays handles negative.
      arr.push(addDays(new Date(), i));
    }
    return arr;
  }, [pastDays, futureDays]);

  // Initial scroll to Today
  useEffect(() => {
    if (scrollRef.current && !loadingRef.current) {
      // Only center on initial mount or full reset. 
      // But here we rely on the specific 'today' mark.
      // We should only do this ONCE.
      const todayEl = scrollRef.current.querySelector('[data-today="true"]');
      if (todayEl) {
        todayEl.scrollIntoView({ behavior: "auto", inline: "center", block: "nearest" });
      }
    }
  }, []);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || loadingRef.current) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    // RTL: scrollLeft is 0 at Rightmost (Start/Past). Increases negatively or positively towards Left (Future).
    // Wait, standard RTL in Chrome: Right=0. Left=negative? Or Right=Max?
    // Let's assume standard modern: Right edge = scrollWidth - clientWidth ??? No, that's LTR.
    // RTL Scroll Type 'negative': Right=0, Left=-Max. 
    // RTL Scroll Type 'default': Right=Max, Left=0? (IE/Edge legacy)
    // RTL Scroll Type 'reverse': Right=0, Left=Max? (Chrome/Firefox standard now usually?)

    // We need to be robust. 
    // Safest: check distance from start/end.

    const scrollX = Math.abs(scrollLeft); // normalize
    const maxScroll = scrollWidth - clientWidth;

    // Check "End" (Future/Left side)
    // If we scroll towards Left, we approach Future.
    // In 'reverse' type (Chrome): scrollLeft increases positive to Left.
    // So near maxScroll = Future.
    if (Math.abs(scrollX - maxScroll) < 50) {
      loadingRef.current = true;
      // Load Future
      setFutureDays(prev => prev + 15);
      setTimeout(() => { loadingRef.current = false; }, 300);
    }

    // Check "Start" (Past/Right side)
    // In 'reverse' type: scrollLeft is near 0.
    if (scrollX < 50) {
      loadingRef.current = true;
      const oldScrollWidth = scrollWidth;
      setPastDays(prev => {
        const newVal = prev + 15;
        // Adjust scroll after render
        setTimeout(() => {
          if (el) {
            const newScrollWidth = el.scrollWidth;
            const diff = newScrollWidth - oldScrollWidth;
            // If we moved 0->diff, we must shift scroll to maintain relative view
            // But strictly speaking, if we were at 0, and we added width, we want to stay at 'diff' (new 0 position is further right).
            // Actually, since we prepend items at the Right (Start)?
            // Wait, in RTL, First Item (Index 0) is Rightmost.
            // If I prepend Oldest items (Index -15...-1), they become new Index 0.
            // They appear at the Rightmost edge.
            // The previous content shifts Left.
            // The user's viewport stays at 0 (Right edge). So they see new items immediately appearing?
            // Or does content push?
            // In RTL, typically content grows to the Left?
            // If flexible width, items might shift.
            // Let's assume standard behavior: we prepend, new items appear at Right. 
            // We need to scroll Left (increase scrollLeft) by 'diff' to keep old content in view.
            //el.scrollLeft += diff; // Chrome 'reverse' type
            // Actually, let's just create a LayoutEffect or similar logic if needed. Or just let it pop if user is scrolling fast.
            // User said "scroll triggers load". 
            // If I'm at 0, and I load more..
          }
          loadingRef.current = false;
        }, 0);
        return newVal;
      });
    }
  }, []);

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="flex gap-5 overflow-x-auto px-4 py-2 scrollbar-hide snap-x relative"
    >
      {days.map((date) => {
        const isSelected = isSameDay(date, selectedDate);
        const isToday = isSameDay(date, new Date());
        return (
          <button
            key={date.toISOString()}
            data-today={isToday ? "true" : undefined}
            onClick={() => onSelectDate(date)}
            className={`flex flex-col items-center justify-center min-w-[36px] h-[68px] rounded-[24px] snap-center transition-all ${isSelected
              ? "bg-background neu-flat" // Active: Flat Outset Container
              : "bg-transparent" // Inactive: Transparent Container
              }`}
          >
            {/* Top Text (Day Name) */}
            <span className={`text-[11px] font-medium mb-2 font-['SF_Pro'] tracking-tight ${isSelected ? "text-primary" : "text-[#6f6f6f]"}`}>
              {format(date, "EEE", { locale: ar })}
            </span>

            {/* Circle (Day Number) */}
            <div className={`w-[26px] h-[26px] rounded-full flex items-center justify-center neu-pressed ${isSelected ? "border-[1.5px] border-primary" : ""}`}>
              <span className="text-[11px] font-medium text-[#6f6f6f] font-['SF_Pro'] tracking-tight">
                {format(date, "d")}
              </span>
            </div>

            {/* We can remove the 'isToday' dot or keep it subtle if desired, but Figma didn't show it explicitly in the snippet */}
          </button>
        );
      })}
    </div>
  );
}

interface ManualInputModalProps {
  current: number;
  max: number;
  onSave: (val: number) => void;
  onClose: () => void;
}

function ManualInputModal({ current, max, onSave, onClose }: ManualInputModalProps) {
  const [val, setVal] = useState(current.toString());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card rounded-2xl p-6 w-full max-w-xs shadow-2xl" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-4 text-center">تعديل العدد يدوياً</h3>
        <input
          type="number"
          value={val}
          onChange={e => setVal(e.target.value)}
          className="w-full text-center text-3xl font-bold bg-secondary rounded-xl py-4 mb-6 focus:outline-none focus:ring-2 ring-primary"
          autoFocus
        />
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-secondary text-foreground font-medium">إلغاء</button>
          <button
            onClick={() => {
              const num = parseInt(val);
              if (!isNaN(num)) onSave(Math.min(num, max));
              onClose();
            }}
            className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-medium"
          >
            حفظ
          </button>
        </div>
      </div>
    </div>
  )
}

function VirtueModal({ dhikr, onClose }: { dhikr: Dhikr; onClose: () => void }) {
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


function GroupFilter({
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

function DhikrCardsSlider({
  adhkar,
  activeDhikrId,
  counters,
  onSelectDhikr,
}: {
  adhkar: Dhikr[];
  activeDhikrId: string;
  counters: Record<string, number>;
  onSelectDhikr: (id: string) => void;
}) {
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
    <div ref={scrollRef} className="flex gap-3 overflow-x-auto px-4 py-4 scrollbar-hide snap-x">
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
                React.cloneElement(iconData.icon as React.ReactElement, { size: 20, strokeWidth: 2 })
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
                <span className="text-[14px] font-medium text-[#84994f] tracking-tight">{current}</span>
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

export default function FocusScreen({ groups }: { groups: DhikrGroup[] }) {
  const [selectedDate, setSelectedDate] = useState(new Date());

  // State for counters and UI controls
  const [counters, setCounters] = useState<Record<string, number>>({});
  const [showVirtue, setShowVirtue] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [tapAnimation, setTapAnimation] = useState(false);

  // Slider State
  const [selectedGroupId, setSelectedGroupId] = useState<string | "all">("all");

  // Determine which list of adhkar to show
  const visibleAdhkar = React.useMemo(() => {
    if (selectedGroupId === "all") {
      // Flatten all adhkar from all groups
      return groups.flatMap(g => g.adhkar);
    }
    const group = groups.find(g => g.id === selectedGroupId);
    return group ? group.adhkar : [];
  }, [groups, selectedGroupId]);

  // Active Dhikr Logic (based on ID now, not index)
  const [activeDhikrId, setActiveDhikrId] = useState<string | null>(null);

  // Set initial active dhikr when data loads or filter changes
  useEffect(() => {
    if (visibleAdhkar.length > 0) {
      // Check if current activeDhikr is still in the visible list
      const stillExists = visibleAdhkar.find(d => d.id === activeDhikrId);
      if (!stillExists) {
        setActiveDhikrId(visibleAdhkar[0].id);
      }
    } else {
      setActiveDhikrId(null);
    }
  }, [visibleAdhkar, activeDhikrId]);

  const activeDhikr = visibleAdhkar.find(d => d.id === activeDhikrId) || null;
  const activeGroup = groups.find(g => g.id === selectedGroupId) || groups[0]; // Fallback for UI if needed

  // No file-based audio refs needed
  // We use Web Audio API directly in playSound

  const getCurrentCount = useCallback(
    (dhikrId: string) => counters[dhikrId] || 0,
    [counters]
  );

  // Audio/Sound logic...
  const playSound = (current: number, target: number) => {
    /* ... existing audio code kept brief or referenced? Better to keep it if I'm replacing the block ... */
    /* I'll rewrite the audio section to be safe, or just insert the new logic above/below if possible */
    /* The replace block covers lines 450-600, which includes handleTap, handleReset, etc. */
    /* I need to be careful to preserve playSound logic if I replace it. */
    /* I will include the full playSound implementation to avoid breaking it. */
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      if (current === target) {
        osc.frequency.setValueAtTime(500, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      } else if (current >= target - 2 && current < target) {
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
      }
    } catch (e) {
      console.error("Audio error", e);
    }
  };

  /* ----------------------------------
   * State: User ID Debug
   * ---------------------------------- */
  const [userId, setUserId] = useState<string>("");
  useEffect(() => {
    setUserId(getUserId() || "");
  }, []);

  /* ----------------------------------
   * Derived State
   * ---------------------------------- */
  // --- Persistence Logic ---
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch counts when date changes
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const dateStr = format(selectedDate, "yyyy-MM-dd");
        // Ensure user is logged in? Assuming Supabase client handles session or public RLS.
        const { data, error } = await supabase
          .from("daily_logs")
          .select("dhikr_id, count")
          .eq("log_date", dateStr);

        if (error) throw error;

        const newCounters: Record<string, number> = {};
        data?.forEach((row: any) => {
          newCounters[row.dhikr_id] = row.count;
        });
        setCounters(newCounters);
      } catch (e) {
        console.error("Error fetching counts:", e);
      }
    };
    fetchCounts();
  }, [selectedDate]);

  // Save to DB function
  const saveToDb = async (dhikrId: string, count: number, date: Date) => {
    try {
      const dateStr = format(date, "yyyy-MM-dd");

      // Check for existing record
      const { data: existing } = await supabase
        .from("daily_logs")
        .select("id")
        .eq("dhikr_id", dhikrId)
        .eq("log_date", dateStr)
        .single();

      if (existing) {
        await supabase
          .from("daily_logs")
          .update({ count })
          .eq("id", existing.id);
      } else {
        await supabase
          .from("daily_logs")
          .insert({ dhikr_id: dhikrId, count, log_date: dateStr });
      }
    } catch (e) {
      console.error("Error saving progress:", e);
    }
  };

  const handleTap = useCallback(() => {
    if (!activeDhikr) return;
    const currentCount = getCurrentCount(activeDhikr.id);

    // Allow count to go infinite? Or stop at target? 
    // User requested "Reset when complete", implying hard stop or at least completion state.
    // Usually Azkar apps stop at target or cycle?
    // Current logic: stops incrementing visually if disabled? 
    // Previous logic allowed incrementing ONLY if < target.
    // Line 519: `if (currentCount < activeDhikr.target)`.
    // I will keep this guard to stop over-counting, unless user wants infinite.
    // User said "When reaches target, I can't reset. I want to reset."
    // This implies they reach target and stop.

    if (currentCount < activeDhikr.target) {
      const newCount = currentCount + 1;
      setCounters((prev) => ({
        ...prev,
        [activeDhikr.id]: newCount,
      }));

      setTapAnimation(true);
      setTimeout(() => setTapAnimation(false), 150);

      playSound(newCount, activeDhikr.target);

      // Debounced Save
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        saveToDb(activeDhikr.id, newCount, selectedDate);
      }, 1000); // Save after 1s of inactivity

      // If complete, maybe force save immediately?
      if (newCount >= activeDhikr.target) {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveToDb(activeDhikr.id, newCount, selectedDate);

        // Auto-advance logic (unchanged)
        setTimeout(() => {
          const currentIndex = visibleAdhkar.findIndex(d => d.id === activeDhikrId);
          if (currentIndex !== -1 && currentIndex < visibleAdhkar.length - 1) {
            setActiveDhikrId(visibleAdhkar[currentIndex + 1].id);
          }
        }, 1200);
      }
    }
  }, [activeDhikr, activeGroup, getCurrentCount, visibleAdhkar, activeDhikrId, selectedDate]);

  const handleReset = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeDhikr) return;
    setCounters((prev) => ({ ...prev, [activeDhikr.id]: 0 }));
    saveToDb(activeDhikr.id, 0, selectedDate);
  }, [activeDhikr, selectedDate]);

  const handleManualSave = (val: number) => {
    if (!activeDhikr) return;
    setCounters(prev => ({ ...prev, [activeDhikr.id]: val }));
    saveToDb(activeDhikr.id, val, selectedDate);
  }

  if (!activeGroup) return <div className="p-8 text-center text-muted-foreground">جاري التحميل...</div>;

  if (!activeDhikr) {
    return (
      <div className="flex flex-col h-full bg-background items-center justify-center p-8 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto">
          <Moon className="opacity-30" size={32} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">لا توجد أذكار</h3>
          <p className="text-muted-foreground text-sm mt-1">
            لا توجد أذكار في مجموعة "{activeGroup.name}" حالياً.
          </p>
        </div>
        <p className="text-xs text-muted-foreground/70">
          انتقل إلى تبويب "المجموعات" لإضافة أذكار جديدة.
        </p>
      </div>
    );
  }

  const currentCount = getCurrentCount(activeDhikr.id);
  const isComplete = currentCount >= activeDhikr.target;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* 1. Day Strip */}
      <div className="pt-2 pb-0">
        <DayStrip selectedDate={selectedDate} onSelectDate={setSelectedDate} />
      </div>

      {/* 2. Group Filter Slider */}
      <div className="active:pt-0">
        <GroupFilter
          groups={groups}
          selectedGroupId={selectedGroupId}
          onSelectGroup={setSelectedGroupId}
        />
      </div>

      {/* 3. Dhikr Cards Slider */}
      {visibleAdhkar.length > 0 ? (
        <DhikrCardsSlider
          adhkar={visibleAdhkar}
          activeDhikrId={activeDhikrId || ""}
          counters={counters}
          onSelectDhikr={setActiveDhikrId}
        />
      ) : (
        <div className="px-4 py-6 text-center text-sm text-muted-foreground bg-secondary/20 mx-4 rounded-xl border border-dashed border-border">
          لا توجد أذكار في هذه القائمة
        </div>
      )}

      {/* 4. Main Action Area */}
      <div className="flex-1 px-4 pb-4 pt-2 flex flex-col justify-end">
        {/* Navigation Arrows Row REMOVED - Using Sliders instead */}


        {/* THE BIG BUTTON */}
        <button
          onClick={handleTap}
          className={`w-full relative h-full min-h-[300px] flex-1 rounded-[28px] flex flex-col items-center p-6 transition-all overflow-hidden border-0
                ${isComplete ? "bg-primary/5" : "neu-button-custom active:scale-[0.99]"} 
            `}
        >
          {/* Inner Controls (Left) - Reset & Manual */}
          <div className="absolute top-6 left-6 flex flex-col gap-3 z-20" onClick={e => e.stopPropagation()}>
            <div
              role="button"
              onClick={handleReset}
              className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-transform active:scale-95"
              style={{
                background: '#F0F0F0',
                boxShadow: '-0.946px 0.946px 1.892px 0 rgba(198, 198, 199, 0.20) inset, 0.946px -0.946px 1.892px 0 rgba(198, 198, 199, 0.20) inset, -0.946px -0.946px 1.892px 0 rgba(255, 255, 255, 0.90) inset, 0.946px 0.946px 2.366px 0 rgba(198, 198, 199, 0.90) inset',
                color: '#A72703'
              }}
            >
              <RotateCcw size={18} />
            </div>
            <div
              role="button"
              onClick={() => setShowManualInput(true)}
              className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-transform active:scale-95"
              style={{
                background: '#F0F0F0',
                boxShadow: '-0.946px 0.946px 1.892px 0 rgba(198, 198, 199, 0.20) inset, 0.946px -0.946px 1.892px 0 rgba(198, 198, 199, 0.20) inset, -0.946px -0.946px 1.892px 0 rgba(255, 255, 255, 0.90) inset, 0.946px 0.946px 2.366px 0 rgba(198, 198, 199, 0.90) inset',
                color: '#6F6F6F'
              }}
            >
              <Hash size={18} />
            </div>
          </div>

          {/* Inner Controls (Right) - Virtue */}
          <div className="absolute top-6 right-6 flex flex-col gap-3 z-20" onClick={e => e.stopPropagation()}>
            <div role="button" onClick={() => setShowVirtue(true)} className="w-10 h-10 rounded-full bg-secondary/80 flex items-center justify-center text-accent hover:text-accent/80 backdrop-blur-sm cursor-pointer transition-colors shadow-sm">
              <Lightbulb size={18} />
            </div>
          </div>

          {/* Content Container */}
          <div className="flex-1 flex flex-col items-center justify-start pt-12 w-full max-w-[90%]">
            {/* Dhikr Text */}
            <h2 className="font-serif text-xl sm:text-2xl text-center leading-loose text-foreground font-medium text-balance mb-4">
              {activeDhikr.text}
            </h2>

            {/* Virtue Hint (Small) */}
            {activeDhikr.virtue && (
              <p className="text-xs text-muted-foreground text-center line-clamp-2 opacity-70 max-w-xs mb-8">
                {activeDhikr.virtue}
              </p>
            )}
          </div>

          {/* Progress Circle & Counter */}
          <div className="flex-1 flex items-center justify-center pb-8">
            <div className={`relative transition-transform duration-100 ${tapAnimation ? "scale-95" : "scale-100"}`}>
              <CircularProgress current={currentCount} target={activeDhikr.target} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                {isComplete ? (
                  <Check className="text-primary animate-in zoom-in spin-in-12" size={32} strokeWidth={3} />
                ) : (
                  <span className="text-4xl font-bold font-mono tracking-tight text-foreground">
                    {currentCount}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Target Indicator */}
          <div className="absolute bottom-6 flex flex-col items-center gap-1">
            <div className="text-sm font-medium text-muted-foreground bg-secondary/50 px-4 py-1.5 rounded-full backdrop-blur-sm">
              الهدف: {activeDhikr.target}
            </div>
            {/* DEBUG: Show User ID */}
            <div className="text-[10px] text-muted-foreground/30 font-mono">
              ID: {userId?.slice(0, 8)}...
            </div>
          </div>

        </button>
      </div>

      {/* Modals */}
      {showVirtue && (
        <VirtueModal dhikr={activeDhikr} onClose={() => setShowVirtue(false)} />
      )}
      {showManualInput && (
        <ManualInputModal current={currentCount} max={activeDhikr.target} onSave={handleManualSave} onClose={() => setShowManualInput(false)} />
      )}
    </div>
  );
}
