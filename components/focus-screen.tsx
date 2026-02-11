"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import type { DhikrGroup, Dhikr } from "@/lib/athkari-data";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
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
import { GroupsIcon } from "./bottom-nav";

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

// --- Mini Progress ---
function MiniCircularProgress({
  progress, // 0 to 1
  size = 26,
  strokeWidth = 2,
  children
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  children?: React.ReactNode;
}) {
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

function DayStrip({
  selectedDate,
  onSelectDate,
  groups,
  liveCounters // New Prop
}: {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  groups: DhikrGroup[];
  liveCounters?: Record<string, number>;
}) {
  const supabase = createClient();
  const [pastDays, setPastDays] = useState(14);
  const [futureDays, setFutureDays] = useState(14);
  const scrollRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  // Daily Stats Map: "YYYY-MM-DD" -> Completion % (0-1)
  const [dailyStats, setDailyStats] = useState<Record<string, number>>({});

  // Generate days
  const days = React.useMemo(() => {
    const arr = [];
    for (let i = -pastDays; i <= futureDays; i++) {
      // RTL logic note: The list renders LTR in DOM, usually styles handle RTL direction.
      // We just supply chronological list here.
      arr.push(addDays(new Date(), i));
    }
    return arr;
  }, [pastDays, futureDays]);

  // Active targets helper
  const allAdhkar = React.useMemo(() => groups.flatMap(g => g.adhkar), [groups]);

  // Fetch Stats for Days Range
  useEffect(() => {
    const fetchRangeStats = async () => {
      if (!days.length) return;

      // Define Range
      const start = format(days[0], 'yyyy-MM-dd');
      const end = format(days[days.length - 1], 'yyyy-MM-dd');

      if (allAdhkar.length === 0) return;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      // Fetch logs
      const { data: logs } = await supabase
        .from('daily_logs')
        .select('log_date, dhikr_id, count')
        .gte('log_date', start)
        .lte('log_date', end)
        .eq('user_id', session.user.id);

      if (!logs) return;

      // Process logs into daily scores
      const stats: Record<string, number> = {};
      const logsByDate: Record<string, Record<string, number>> = {};

      logs.forEach((l: any) => {
        if (!logsByDate[l.log_date]) logsByDate[l.log_date] = {};
        logsByDate[l.log_date][l.dhikr_id] = l.count;
      });

      Object.keys(logsByDate).forEach(dateStr => {
        const dayLogs = logsByDate[dateStr];
        let sumPct = 0;
        allAdhkar.forEach(d => {
          const count = dayLogs[d.id] || 0;
          sumPct += Math.min(count / d.target, 1);
        });
        const avg = sumPct / allAdhkar.length; // 0 to 1
        stats[dateStr] = avg;
      });

      setDailyStats(prev => ({ ...prev, ...stats }));
    };


    // Get active targets from props (flat list) - Keep inside effect or memo
    const allAdhkar = groups.flatMap(g => g.adhkar);
    if (allAdhkar.length === 0) return;

    fetchRangeStats();
  }, [days, groups]); // Only re-fetch if date range changes (scroll) or groups change.

  // --- Optimistic Local Update ---
  // When liveCounters change (user taps), update the local dailyStats for TODAY immediately.
  // This creates a "cache" so if we switch days, we don't rely only on DB (which might be slow).
  useEffect(() => {
    if (!liveCounters) return;

    // We only update the stats for the currently selected date based on live counters
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const allAdhkar = groups.flatMap(g => g.adhkar);

    if (allAdhkar.length === 0) return;

    let sumPct = 0;
    allAdhkar.forEach(d => {
      const count = liveCounters[d.id] || 0;
      sumPct += Math.min(count / d.target, 1);
    });
    const avg = sumPct / allAdhkar.length;

    setDailyStats(prev => ({
      ...prev,
      [dateStr]: avg
    }));

  }, [liveCounters, selectedDate, groups]);

  // Initial scroll
  useEffect(() => {
    if (scrollRef.current && !loadingRef.current) {
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
    const scrollX = Math.abs(scrollLeft);
    const maxScroll = scrollWidth - clientWidth;

    if (Math.abs(scrollX - maxScroll) < 50) {
      loadingRef.current = true;
      setFutureDays(prev => prev + 15);
      setTimeout(() => { loadingRef.current = false; }, 300);
    }

    if (scrollX < 50) {
      loadingRef.current = true;
      setPastDays(prev => {
        const newVal = prev + 15;
        setTimeout(() => { loadingRef.current = false; }, 0);
        return newVal;
      });
    }
  }, []);

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="flex gap-4 overflow-x-auto px-4 py-2 scrollbar-hide snap-x relative items-center"
    >
      {days.map((date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const isSelected = isSameDay(date, selectedDate);
        const isToday = isSameDay(date, new Date());

        let progress = dailyStats[dateStr] || 0;

        // If this is the currently selected date, try to use live counters if available
        if (isSelected && liveCounters && allAdhkar.length > 0) {
          let sumPct = 0;
          allAdhkar.forEach(d => {
            const count = liveCounters[d.id] || 0;
            sumPct += Math.min(count / d.target, 1);
          });
          progress = sumPct / allAdhkar.length;
        }

        return (
          <button
            key={date.toISOString()}
            data-today={isToday ? "true" : undefined}
            onClick={() => onSelectDate(date)}
            className={`flex flex-col items-center justify-center min-w-[36px] h-[68px] rounded-[24px] snap-center transition-all duration-300 ${isSelected
              ? "bg-background neu-flat" // Active
              : "bg-transparent opacity-70" // Inactive
              }`}
          >
            {/* Top Text (Day Name) */}
            <span className={`text-[10px] font-medium mb-2 font-['SF_Pro'] tracking-tight ${isSelected ? "text-primary font-bold" : "text-[#6f6f6f]"}`}>
              {format(date, "EEE", { locale: ar })}
            </span>

            {/* Circle with Progress */}
            <MiniCircularProgress progress={progress} size={26} strokeWidth={2}>
              <span className={`text-[11px] font-medium font-['SF_Pro'] tracking-tight leading-none pt-[1px] ${isSelected ? "text-primary" : "text-[#6f6f6f]"}`}>
                {format(date, "d")}
              </span>
            </MiniCircularProgress>

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

interface FocusScreenProps {
  groups: DhikrGroup[];
  onNavigateToGroups: () => void;
}

export default function FocusScreen({ groups, onNavigateToGroups }: FocusScreenProps) {
  const supabase = createClient();
  const [selectedDate, setSelectedDate] = useState(new Date());

  // State for counters and UI controls
  const [counters, setCounters] = useState<Record<string, number>>({});
  const [countersLoaded, setCountersLoaded] = useState(false);
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
  // Set initial active dhikr when data loads or filter changes
  useEffect(() => {
    // Only proceed if we have visible adhkar
    if (visibleAdhkar.length === 0) {
      setActiveDhikrId(null);
      return;
    }

    // Wait until counters are loaded to determine incomplete status properly
    if (!countersLoaded) return;

    // Check if current activeDhikr is still in the visible list
    const stillExists = visibleAdhkar.find(d => d.id === activeDhikrId);

    // If no active dhikr (first load) or it was filtered out
    if (!activeDhikrId || !stillExists) {
      // Find the first INCOMPLETE dhikr to auto-select
      const firstIncomplete = visibleAdhkar.find(d => (counters[d.id] || 0) < d.target);

      if (firstIncomplete) {
        setActiveDhikrId(firstIncomplete.id);
      } else {
        // If all are complete, default to the first one
        setActiveDhikrId(visibleAdhkar[0].id);
      }
    }
  }, [visibleAdhkar, activeDhikrId, counters, countersLoaded]);

  const activeDhikr = visibleAdhkar.find(d => d.id === activeDhikrId) || null;
  const activeGroup = groups.find(g => g.id === selectedGroupId) || groups[0]; // Fallback for UI if needed

  // No file-based audio refs needed
  // We use Web Audio API directly in playSound

  const getCurrentCount = useCallback(
    (dhikrId: string) => counters[dhikrId] || 0,
    [counters]
  );

  // Audio/Sound logic...
  // --- Advanced Audio Logic (Web Audio API with Silence Trimming) ---
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBuffersRef = useRef<Record<string, AudioBuffer>>({});

  // Initialize Audio Context and Preload Sounds
  useEffect(() => {
    const initAudio = async () => {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;

      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }

      const loadBuffer = async (url: string, key: string) => {
        try {
          const response = await fetch(url);
          const arrayBuffer = await response.arrayBuffer();
          if (audioContextRef.current) {
            const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);

            // Trim Silence
            const channelData = audioBuffer.getChannelData(0); // Check first channel
            let startOffset = 0;
            // Find first sample with significant amplitude
            for (let i = 0; i < channelData.length; i++) {
              if (Math.abs(channelData[i]) > 0.02) { // Threshold for "silence"
                startOffset = i;
                break;
              }
            }

            // If significant silence found (e.g. > 100 samples), create a new trimmed buffer
            // Or just store the offset. Storing offset is cheaper but playing slice is cleaner.
            // Let's create a trimmed buffer for cleaner re-use.
            if (startOffset > 0 && startOffset < audioBuffer.length) {
              const trimmedLength = audioBuffer.length - startOffset;
              const trimmedBuffer = audioContextRef.current.createBuffer(
                audioBuffer.numberOfChannels,
                trimmedLength,
                audioBuffer.sampleRate
              );

              for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
                const originalData = audioBuffer.getChannelData(channel);
                const newData = trimmedBuffer.getChannelData(channel);
                newData.set(originalData.subarray(startOffset));
              }
              audioBuffersRef.current[key] = trimmedBuffer;
            } else {
              audioBuffersRef.current[key] = audioBuffer;
            }
          }
        } catch (e) {
          console.error(`Error loading audio ${key}:`, e);
        }
      };

      await Promise.all([
        loadBuffer("/sounds/click-light.mp3", "light"),
        loadBuffer("/sounds/click-heavy.mp3", "heavy")
      ]);
    };

    initAudio();

    // Cleanup
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, []);

  // Wrap playSound in useCallback to be safe, although Refs handle the state.
  const playSound = useCallback((current: number, target: number) => {
    try {
      const ctx = audioContextRef.current;
      if (!ctx) return;

      // Ensure context is running (sometimes it suspends)
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      let buffer: AudioBuffer | null = null;
      let volume = 1.0;
      let duration = 0;

      if (current === target) {
        buffer = audioBuffersRef.current["heavy"];
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(50);
        }
      } else if (current >= target - 2 && current < target) {
        buffer = audioBuffersRef.current["light"];
        volume = 0.6;
        duration = 0.15; // Cut off quickly to keep only the first "click" of the sound
      }

      if (buffer) {
        const source = ctx.createBufferSource();
        source.buffer = buffer;

        const gainNode = ctx.createGain();
        gainNode.gain.value = volume;

        source.connect(gainNode);
        gainNode.connect(ctx.destination);

        source.start(0);
        if (duration > 0) {
          source.stop(ctx.currentTime + duration);
        }
      }
    } catch (e) {
      console.error("Audio playback error", e);
    }
  }, []);

  /* ----------------------------------
   * Derived State
   * ---------------------------------- */
  // --- Persistence Logic ---
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cache for logs: DateStr -> { dhikrId: count }
  // This prevents re-fetching old data if we have newer local data that isn't saved yet
  const logsCache = useRef<Record<string, Record<string, number>>>({});

  // Fetch counts when date changes
  useEffect(() => {
    const fetchCounts = async () => {
      const dateStr = format(selectedDate, "yyyy-MM-dd");

      // 1. Check Cache First
      if (logsCache.current[dateStr]) {
        setCounters(logsCache.current[dateStr]);
        setCountersLoaded(true);
        return;
      }

      setCountersLoaded(false);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data, error } = await supabase
        .from("daily_logs")
        .select("dhikr_id, count")
        .eq("user_id", session.user.id)
        .eq("log_date", dateStr);

      if (error) {
        console.error("Error fetching logs:", error);
      } else {
        const newCounters: Record<string, number> = {};
        data?.forEach((row: any) => {
          newCounters[row.dhikr_id] = row.count;
        });

        // Update State
        setCounters(newCounters);

        // Update Cache
        logsCache.current[dateStr] = newCounters;
      }
      setCountersLoaded(true);
    };

    fetchCounts();
  }, [selectedDate, supabase]); // Removed unnecessary deps

  // --- Offline & Sync Logic ---
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync effect
  useEffect(() => {
    const syncOfflineData = async () => {
      if (typeof window === 'undefined') return;

      const offlineQueue = JSON.parse(localStorage.getItem('offline_queue') || '[]');
      if (offlineQueue.length === 0) return;

      console.log('Syncing offline data...', offlineQueue.length);
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) return;

      const newQueue = [...offlineQueue];

      // Process queue
      // We process sequentially to ensure order, or just iterate.
      // Since we just update counts, we can just send the latest.
      // But to be safe, let's try to send all.
      for (let i = 0; i < newQueue.length; i++) {
        const item = newQueue[i];
        try {
          // Check existing
          const { data: existing } = await supabase
            .from("daily_logs")
            .select("id")
            .eq("dhikr_id", item.dhikrId)
            .eq("log_date", item.dateStr)
            .single();

          if (existing) {
            await supabase.from("daily_logs").update({ count: item.count }).eq("id", existing.id);
          } else {
            await supabase.from("daily_logs").insert({
              dhikr_id: item.dhikrId,
              count: item.count,
              log_date: item.dateStr,
              user_id: userId
            });
          }
          // Remove from queue if successful (mark for removal)
          newQueue[i] = null;
        } catch (e) {
          console.error("Sync failed for item", item, e);
        }
      }

      // Clean queue
      const remaining = newQueue.filter(x => x !== null);
      localStorage.setItem('offline_queue', JSON.stringify(remaining));

      if (remaining.length === 0) {
        setErrorMessage(null); // Clear error if all synced
      }
    };

    // Listen for online
    window.addEventListener('online', syncOfflineData);

    // Initial check
    if (navigator.onLine) {
      syncOfflineData();
    }

    return () => window.removeEventListener('online', syncOfflineData);
  }, [supabase]);

  // Save to DB function with Offline Fallback
  const saveToDb = async (dhikrId: string, count: number, dateObj: Date) => {
    const dateStr = format(dateObj, "yyyy-MM-dd");
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return; // Should handle anon auth too if enabled

    try {
      const { error } = await supabase
        .from("daily_logs")
        .upsert(
          {
            user_id: session.user.id,
            dhikr_id: dhikrId,
            log_date: dateStr,
            count: count,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,dhikr_id,log_date" }
        );

      if (error) throw error;

      // Success
      setErrorMessage(null);

    } catch (e: any) {
      if (e.message === "Offline" || e.message === "Failed to fetch") {
        console.warn("Saving locally (Offline mode)");
      } else {
        console.error("Error saving progress (saving locally):", JSON.stringify(e, null, 2) || e);
      }
      setErrorMessage("تعذر الاتصال. سيتم الحفظ تلقائياً عند عودة الإنترنت.");

      // Save directly to localStorage queue
      const queueItem = { dhikrId, count, dateStr, timestamp: Date.now() };

      const currentQueue = JSON.parse(localStorage.getItem('offline_queue') || '[]');

      // Remove duplicates for same dhikr/day (keep latest count)
      const filteredQueue = currentQueue.filter((x: any) => !(x.dhikrId === dhikrId && x.dateStr === dateStr));
      filteredQueue.push(queueItem);

      localStorage.setItem('offline_queue', JSON.stringify(filteredQueue));
    }
  };

  const updateCounter = (id: string, newVal: number) => {
    const dateStr = format(selectedDate, "yyyy-MM-dd");

    // 1. Update State
    setCounters((prev) => {
      const next = { ...prev, [id]: newVal };
      // 2. Update Cache Immediately
      logsCache.current[dateStr] = next;
      return next;
    });

    // 3. Trigger Save (Debounced or Immediate)
    // We handle the save call in the handler
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

      updateCounter(activeDhikr.id, newCount);

      setTapAnimation(true);
      setTimeout(() => setTapAnimation(false), 150);

      // Haptic Feedback
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(10);
      }

      playSound(newCount, activeDhikr.target);

      // Debounced Save
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        saveToDb(activeDhikr.id, newCount, selectedDate);
      }, 2000); // Save after 2s of inactivity

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
  }, [activeDhikr, activeGroup, getCurrentCount, visibleAdhkar, activeDhikrId, selectedDate, playSound]);

  const handleReset = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeDhikr) return;
    updateCounter(activeDhikr.id, 0);
    saveToDb(activeDhikr.id, 0, selectedDate);
  }, [activeDhikr, selectedDate]);

  const handleManualSave = (val: number) => {
    if (!activeDhikr) return;
    updateCounter(activeDhikr.id, val);
    saveToDb(activeDhikr.id, val, selectedDate);
  }

  if (!activeGroup) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto">
          <div className="opacity-30 scale-125">
            <GroupsIcon active={false} />
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">لا توجد مجموعات نشطة</h3>
          <p className="text-muted-foreground text-sm mt-1">
            لم يتم العثور على أي أذكار حالياً.
          </p>
        </div>
        <p className="text-xs text-muted-foreground/70">
          انتقل إلى تبويب "المجموعات" لإضافة أو تفعيل الأذكار.
        </p>
        <button
          onClick={onNavigateToGroups}
          className="bg-primary text-primary-foreground text-sm font-medium px-6 py-2 rounded-full shadow-sm hover:opacity-90 transition-opacity mt-2"
        >
          إضافة مجموعة أذكار
        </button>
      </div>
    );
  }

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
        <button
          onClick={onNavigateToGroups}
          className="bg-primary text-primary-foreground text-sm font-medium px-6 py-2 rounded-full shadow-sm hover:opacity-90 transition-opacity mt-2"
        >
          إضافة أذكار
        </button>
      </div>
    );
  }

  const currentCount = getCurrentCount(activeDhikr.id);
  const isComplete = currentCount >= activeDhikr.target;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* 1. Day Strip */}
      <div className="pt-2 pb-0">
        <DayStrip selectedDate={selectedDate} onSelectDate={setSelectedDate} groups={groups} liveCounters={counters} />
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




          {/* Content Container */}
          <div className="flex-1 flex flex-col items-center justify-start pt-12 w-full max-w-[90%]">
            {/* Dhikr Text */}
            <h2 className="font-serif text-xl sm:text-2xl text-center leading-loose text-foreground font-medium text-balance mb-4 line-clamp-3 overflow-hidden text-ellipsis px-2">
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
          <div className="absolute bottom-6 text-sm font-medium text-muted-foreground bg-secondary/50 px-4 py-1.5 rounded-full backdrop-blur-sm">
            الهدف: {activeDhikr.target}
          </div>

          {/* Bottom Left Controls: Virtue, Manual, Reset */}
          <div className="absolute bottom-6 left-6 flex flex-col gap-3 z-30" onClick={e => e.stopPropagation()}>
            {/* 1. Virtue (Top) */}
            <div
              role="button"
              onClick={() => setShowVirtue(true)}
              className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-transform active:scale-95 text-accent"
              style={{
                background: '#F0F0F0',
                boxShadow: '-0.946px 0.946px 1.892px 0 rgba(198, 198, 199, 0.20) inset, 0.946px -0.946px 1.892px 0 rgba(198, 198, 199, 0.20) inset, -0.946px -0.946px 1.892px 0 rgba(255, 255, 255, 0.90) inset, 0.946px 0.946px 2.366px 0 rgba(198, 198, 199, 0.90) inset'
              }}
            >
              <Lightbulb size={18} />
            </div>
            {/* 2. Manual */}
            <div
              role="button"
              onClick={() => setShowManualInput(true)}
              className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-transform active:scale-95 text-accent"
              style={{
                background: '#F0F0F0',
                boxShadow: '-0.946px 0.946px 1.892px 0 rgba(198, 198, 199, 0.20) inset, 0.946px -0.946px 1.892px 0 rgba(198, 198, 199, 0.20) inset, -0.946px -0.946px 1.892px 0 rgba(255, 255, 255, 0.90) inset, 0.946px 0.946px 2.366px 0 rgba(198, 198, 199, 0.90) inset'
              }}
            >
              <Hash size={18} />
            </div>
            {/* 3. Reset (Bottom) */}
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
