"use client";

import { useState } from "react";
import { useAdhkarData } from "@/hooks/use-adhkar-data";
import FocusScreen from "@/components/focus-screen";
import GroupsScreen from "@/components/groups-screen";
import AnalyticsScreen from "@/components/analytics-screen";
import QuranRepetitionScreen from "@/components/quran-repetition-screen";
import { BottomNav } from "@/components/bottom-nav";
import { Loader2 } from "lucide-react";

type Tab = "focus" | "groups" | "stats" | "quran";

export default function Page() {
  const [activeTab, setActiveTab] = useState<Tab>("quran");
  const {
    groups,
    activeGroups,
    loading,
    userId,
    toggleGroup,
    toggleDhikr,
    addGroup,
    editGroup,
    deleteGroup,
    addDhikr,
    editDhikr,
    deleteDhikr,
    reorderGroup,
    reorderDhikr
  } = useAdhkarData();

  if (loading && groups.length === 0) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-dvh bg-background max-w-lg mx-auto shadow-2xl overflow-hidden relative">
      {/* Screen Content */}
      <main className="flex-1 overflow-hidden relative pb-[85px]">
        {activeTab === "focus" && (
          <div className="absolute inset-0 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-[85px]">
            <FocusScreen
              groups={activeGroups}
              onNavigateToGroups={() => setActiveTab("groups")}
            />
          </div>
        )}
        {activeTab === "groups" && (
          <div className="absolute inset-0 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-[85px] overflow-y-auto">
            <GroupsScreen
              groups={groups}
              onToggleGroup={toggleGroup}
              onToggleDhikr={toggleDhikr}
              onAddGroup={addGroup}
              onEditGroup={editGroup}
              onDeleteGroup={deleteGroup}
              onAddDhikr={addDhikr}
              onEditDhikr={editDhikr}
              onDeleteDhikr={deleteDhikr}
              onReorderGroup={reorderGroup}
              onReorderDhikr={reorderDhikr}
            />
          </div>
        )}
        {activeTab === "stats" && (
          <div className="absolute inset-0 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-[85px] overflow-y-auto">
            <AnalyticsScreen />
          </div>
        )}
        {activeTab === "quran" && (
          <div className="absolute inset-0 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-[85px] overflow-y-auto">
            <QuranRepetitionScreen />
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={(t) => setActiveTab(t as Tab)} />
    </div>
  );
}

