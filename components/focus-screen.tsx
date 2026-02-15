"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import type { DhikrGroup } from "@/lib/athkari-data";
import { createClient } from "@/lib/supabase/client";
import { AnimatePresence, motion } from "framer-motion";
import {
  RotateCcw,
  Settings2,
  Volume2,
  Hash,
  MoreHorizontal,
  Calendar,
  Check,
} from "lucide-react";
import { format, isSameDay } from "date-fns";

// Hooks
import { useSchedule } from "@/hooks/use-schedule";

// Components
import { CircularProgress } from "@/components/ui/circular-progress";
import { ManualInputModal } from "@/components/ui/manual-input-modal";
import { VirtueModal } from "@/components/ui/virtue-modal";
import { DayStrip } from "@/components/features/day-strip";
import { DhikrCardsSlider } from "@/components/features/dhikr-slider";
import { GroupFilter } from "@/components/features/group-filter";

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

  // Use the new Schedule Hook
  const { displayedGroups, updateSchedule, currentConfig } = useSchedule(groups, selectedDate);

  // Slider State - Persist active group
  const [selectedGroupId, setSelectedGroupId] = useState<string | "all">(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('last_selected_group_id') || 'all';
    }
    return 'all';
  });

  useEffect(() => {
    localStorage.setItem('last_selected_group_id', selectedGroupId);
  }, [selectedGroupId]);

  // Handle Toggle Group/Dhikr via Schedule Hook
  const handleToggleGroup = (groupId: string, isActive: boolean) => {
    const currentGroups = currentConfig.activeGroupIds;
    let newGroups = [...currentGroups];

    if (isActive) {
      if (!newGroups.includes(groupId)) newGroups.push(groupId);
    } else {
      newGroups = newGroups.filter(id => id !== groupId);
    }

    updateSchedule(newGroups, currentConfig.activeDhikrIds);
  };

  const handleToggleDhikr = (dhikrId: string, isActive: boolean) => {
    const currentDhikrs = currentConfig.activeDhikrIds;
    let newDhikrs = [...currentDhikrs];

    if (isActive) {
      if (!newDhikrs.includes(dhikrId)) newDhikrs.push(dhikrId);
    } else {
      newDhikrs = newDhikrs.filter(id => id !== dhikrId);
    }

    updateSchedule(currentConfig.activeGroupIds, newDhikrs);
  };

  // Determine which list of adhkar to show
  const visibleAdhkar = useMemo(() => {
    if (selectedGroupId === "all") {
      return displayedGroups.flatMap(g => g.adhkar);
    }
    const group = displayedGroups.find(g => g.id === selectedGroupId);
    return group ? group.adhkar : [];
  }, [displayedGroups, selectedGroupId]);

  // Active Dhikr Logic - Persist active dhikr
  const [activeDhikrId, setActiveDhikrId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const savedId = localStorage.getItem('last_active_dhikr_id');
      return savedId || null;
    }
    return null;
  });

  useEffect(() => {
    if (activeDhikrId) {
      localStorage.setItem('last_active_dhikr_id', activeDhikrId);
    }
  }, [activeDhikrId]);

  // Set initial active dhikr when data loads or filter changes
  useEffect(() => {
    if (visibleAdhkar.length === 0) {
      setActiveDhikrId(null);
      return;
    }

    // Only set if null or current selection is no longer visible
    const exists = visibleAdhkar.find(d => d.id === activeDhikrId);
    if (!activeDhikrId || !exists) {
      setActiveDhikrId(visibleAdhkar[0].id);
    }
  }, [visibleAdhkar, activeDhikrId]);

  const activeDhikr = useMemo(() =>
    visibleAdhkar.find(d => d.id === activeDhikrId) || visibleAdhkar[0],
    [visibleAdhkar, activeDhikrId]);

  // Fetch counters for selected date
  useEffect(() => {
    const fetchCounters = async () => {
      setCountersLoaded(false);
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) return;

      const { data } = await supabase
        .from('daily_logs')
        .select('dhikr_id, count')
        .eq('user_id', session.user.id)
        .eq('log_date', dateStr);

      const newCounters: Record<string, number> = {};
      if (data) {
        data.forEach((row: any) => {
          newCounters[row.dhikr_id] = row.count;
        });
      }
      setCounters(newCounters);
      setCountersLoaded(true);
    };

    fetchCounters();
  }, [selectedDate, supabase]);

  // Main interaction: Tap to count
  const handleTap = async () => {
    if (!activeDhikr) return;

    setTapAnimation(true);
    setTimeout(() => setTapAnimation(false), 100);

    // Haptic feedback
    if (navigator.vibrate) navigator.vibrate(10);

    const currentCount = counters[activeDhikr.id] || 0;

    // Check if target reached? (Optional: stop counting or continue)
    // For now, allow infinite counting or up to target? 
    // Usually Azkar apps stopping at target is preferred, but manual override allows more.
    if (currentCount >= activeDhikr.target) {
      // Maybe lighter haptic or visual cue that done?
    }

    const newCount = currentCount + 1;
    setCounters(prev => ({ ...prev, [activeDhikr.id]: newCount }));

    // Debounced Save
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      // Upsert
      await supabase.from('daily_logs').upsert({
        user_id: session.user.id,
        dhikr_id: activeDhikr.id,
        log_date: dateStr,
        count: newCount,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id, dhikr_id, log_date' });
    } catch (err) {
      console.error("Failed to save count", err);
    }

    // Auto-advance if target reached
    if (newCount === activeDhikr.target) {
      // Find next dhikr
      const idx = visibleAdhkar.findIndex(d => d.id === activeDhikr.id);
      if (idx !== -1 && idx < visibleAdhkar.length - 1) {
        // Small delay for user to realize they finished
        setTimeout(() => {
          setActiveDhikrId(visibleAdhkar[idx + 1].id);
        }, 400);
      }
    }
  };

  const handleReset = async () => {
    if (!activeDhikr) return;
    if (!confirm('هل تريد تصفير عداد هذا الذكر؟')) return;

    setCounters(prev => ({ ...prev, [activeDhikr.id]: 0 }));

    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    await supabase.from('daily_logs').upsert({
      user_id: session.user.id,
      dhikr_id: activeDhikr.id,
      log_date: dateStr,
      count: 0,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id, dhikr_id, log_date' });
  };

  const handleManualUpdate = async (val: number) => {
    if (!activeDhikr) return;
    setCounters(prev => ({ ...prev, [activeDhikr.id]: val }));

    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    await supabase.from('daily_logs').upsert({
      user_id: session.user.id,
      dhikr_id: activeDhikr.id,
      log_date: dateStr,
      count: val,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id, dhikr_id, log_date' });
  };

  // View Calculation
  const currentCount = activeDhikr ? (counters[activeDhikr.id] || 0) : 0;
  const targetCount = activeDhikr ? activeDhikr.target : 1;
  const progress = Math.min(currentCount / targetCount, 1);
  const isComplete = currentCount >= targetCount;

  return (
    <div className="flex flex-col h-full relative" style={{ direction: "ltr" }}>
      {/* Background Gradients */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-secondary/5 pointer-events-none" />

      {/* Top Bar: Date & Group Filter */}
      <div className="flex-none pt-4 pb-2 z-10 bg-background/80 backdrop-blur-md">
        <div className="mb-3">
          <DayStrip
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            groups={groups}
            liveCounters={isSameDay(selectedDate, new Date()) ? counters : undefined}
          />
        </div>
        <GroupFilter
          groups={displayedGroups}
          selectedGroupId={selectedGroupId}
          onSelectGroup={setSelectedGroupId}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-between px-6 pb-6 pt-2 z-0 overflow-y-auto">

        {/* Big Counter Circle */}
        <div className="flex-1 flex flex-col items-center justify-center w-full min-h-[280px]">
          {activeDhikr ? (
            <div className="relative">
              {/* Circular Progress */}
              <div className="transform scale-[2.5] opacity-90">
                <CircularProgress current={currentCount} target={targetCount} />
              </div>

              {/* Center Text (Count) */}
              <button
                onClick={handleTap}
                className={`absolute inset-0 flex flex-col items-center justify-center rounded-full active:scale-95 transition-transform ${tapAnimation ? "scale-95" : ""}`}
              >
                <span className="text-6xl font-bold font-mono tracking-tighter text-foreground">
                  {currentCount}
                </span>
                <span className="text-sm text-muted-foreground mt-1 font-medium">
                  / {targetCount}
                </span>
              </button>
            </div>
          ) : (
            <div className="text-center text-muted-foreground">
              <Check size={48} className="mx-auto mb-4 opacity-20" />
              <p>لا توجد أذكار متاحة لهذا اليوم</p>
              <button onClick={onNavigateToGroups} className="mt-4 text-primary underline">
                إدارة الأذكار
              </button>
            </div>
          )}
        </div>

        {/* Dhikr Text Card */}
        {activeDhikr && (
          <div className="w-full mb-6">
            <div className="flex items-center justify-center gap-4 mb-6">
              <button
                onClick={handleReset}
                className="p-3 rounded-full bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                title="تصفير"
              >
                <RotateCcw size={20} />
              </button>

              <button
                onClick={() => setShowManualInput(true)}
                className="p-3 rounded-full bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                title="تعديل يدوي"
              >
                <Hash size={20} />
              </button>

              <button
                onClick={() => setShowVirtue(true)}
                className="p-3 rounded-full bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                title="فضل الذكر"
              >
                <Volume2 size={20} />
                {/* Using Volume Icon as placeholder for Virtue/Info if Lightbulb not desired, or stick to Lightbulb */}
              </button>
            </div>

            <div className="bg-card/50 border border-border/50 rounded-3xl p-6 text-center backdrop-blur-sm shadow-sm relative overflow-hidden group">
              {isComplete && (
                <div className="absolute top-0 right-0 p-3">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                    <Check className="text-green-500" />
                  </motion.div>
                </div>
              )}
              <p className="text-xl md:text-2xl font-medium leading-relaxed font-serif text-card-foreground" dir="rtl">
                {activeDhikr.text}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Slider */}
      {activeDhikr && (
        <div className="flex-none pb-4 z-10 bg-background/80 backdrop-blur-md border-t border-border/50 pt-2">
          <DhikrCardsSlider
            adhkar={visibleAdhkar}
            activeDhikrId={activeDhikr.id}
            counters={counters}
            onSelectDhikr={setActiveDhikrId}
          />
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showManualInput && activeDhikr && (
          <ManualInputModal
            current={counters[activeDhikr.id] || 0}
            max={10000} // Arbitrary max
            onSave={handleManualUpdate}
            onClose={() => setShowManualInput(false)}
          />
        )}
        {showVirtue && activeDhikr && (
          <VirtueModal
            dhikr={activeDhikr}
            onClose={() => setShowVirtue(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
