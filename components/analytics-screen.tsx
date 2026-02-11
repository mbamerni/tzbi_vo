"use client";

import React, { useMemo } from "react";
import { useStats } from "@/hooks/use-stats";
import { Loader2, Flame, Trophy, Calendar, Hash, Activity, Target } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export default function AnalyticsScreen() {
  const { stats, loading } = useStats();

  // Memoize chart data to prevent re-renders unless stats change
  const chartData = useMemo(() => {
    return [...stats.dailyActivity].reverse();
  }, [stats.dailyActivity]);

  const heatmapData = useMemo(() => {
    return stats.heatmapData;
  }, [stats.heatmapData]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  // Helper to get color intensity for heatmap
  const getLevelColor = (level: number) => {
    switch (level) {
      case 0: return "bg-secondary"; // Empty
      case 1: return "bg-primary/20";
      case 2: return "bg-primary/40";
      case 3: return "bg-primary/60";
      case 4: return "bg-primary";
      default: return "bg-secondary";
    }
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-y-auto">
      {/* Header */}
      <div className="p-6 pb-2">
        <h1 className="text-2xl font-serif font-bold text-foreground">إحصائياتي</h1>
        <p className="text-sm text-muted-foreground mt-1">تابع تقدمك وحافظ على استمرارك</p>
      </div>

      <div className="flex-1 px-6 pb-24 space-y-6">

        {/* Overview Headers (3 Cards) */}
        <div className="grid grid-cols-3 gap-3">
          {/* Total Tasbeehs */}
          <div className="bg-card p-4 rounded-2xl border border-border shadow-sm flex flex-col items-center justify-center text-center">
            <div className="mb-2 p-2 bg-blue-100 text-blue-600 rounded-full dark:bg-blue-900/30 dark:text-blue-400">
              <Hash size={18} />
            </div>
            <span className="text-2xl font-bold font-mono">{stats.totalCount}</span>
            <span className="text-[10px] text-muted-foreground mt-1">إجمالي التسبيحات</span>
          </div>

          {/* Current Streak */}
          <div className="bg-card p-4 rounded-2xl border border-border shadow-sm flex flex-col items-center justify-center text-center">
            <div className="mb-2 p-2 bg-orange-100 text-orange-600 rounded-full dark:bg-orange-900/30 dark:text-orange-400">
              <Flame size={18} />
            </div>
            <span className="text-2xl font-bold font-mono">{stats.streak}</span>
            <span className="text-[10px] text-muted-foreground mt-1">يوم تتابع</span>
          </div>

          {/* Today's Completion */}
          <div className="bg-card p-4 rounded-2xl border border-border shadow-sm flex flex-col items-center justify-center text-center">
            <div className="mb-2 p-2 bg-green-100 text-green-600 rounded-full dark:bg-green-900/30 dark:text-green-400">
              <Target size={18} />
            </div>
            <span className="text-2xl font-bold font-mono">{stats.todayCompletion}%</span>
            <span className="text-[10px] text-muted-foreground mt-1">إنجاز اليوم</span>
          </div>
        </div>

        {/* Activity Chart (Area Chart) */}
        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="text-primary" size={20} />
            <h3 className="font-semibold">النشاط الأسبوعي</h3>
          </div>
          <div className="h-[200px] w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
                <XAxis
                  dataKey="dayName"
                  tick={{ fontSize: 10, fill: '#888' }}
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                />
                <Tooltip
                  cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1 }}
                  content={({ payload, label }) => {
                    if (payload && payload.length) {
                      return (
                        <div className="bg-popover text-popover-foreground text-xs p-2 rounded-lg border shadow-sm text-right">
                          <p className="font-semibold mb-1">{label}</p>
                          <p>العدد: {payload[0].value}</p>
                        </div>
                      )
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorCount)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Heatmap Grid (Last 3 Months) */}
        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="text-primary" size={20} />
            <h3 className="font-semibold">سجل الالتزام (3 أشهر)</h3>
          </div>
          {/* GitHub Style Grid */}
          <div className="flex flex-wrap gap-1 justify-center dir-ltr" style={{ direction: 'ltr' }}>
            {/* 
                 We need to make this scrollable or fitting. 
                 3 months ~ 90 days. 
                 Grid usually is by weeks (columns). 
                 ~13 weeks. 
                 Let's just use a simple flex wrap of squares for simplicity responsiveness 
                 OR a horizontal scroll.
                 Let's try a responsive flex grid.
             */}
            <div className="grid grid-cols-[repeat(auto-fit,minmax(12px,1fr))] gap-1 w-full max-w-full">
              {heatmapData.map((item) => (
                <div
                  key={item.date}
                  className={`h-3 w-3 rounded-sm ${getLevelColor(item.level)}`}
                  title={`${item.date}: ${item.count}`}
                />
              ))}
            </div>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-2 w-full justify-end">
              <span>أقل</span>
              <div className={`h-2 w-2 rounded-sm ${getLevelColor(0)}`}></div>
              <div className={`h-2 w-2 rounded-sm ${getLevelColor(2)}`}></div>
              <div className={`h-2 w-2 rounded-sm ${getLevelColor(4)}`}></div>
              <span>أكثر</span>
            </div>
          </div>
        </div>

        {/* Top Adhkar */}
        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="text-yellow-500" size={20} />
            <h3 className="font-semibold">الأكثر إنجازاً</h3>
          </div>
          <div className="space-y-4">
            {stats.topAdhkar.length > 0 ? (
              stats.topAdhkar.map((item, index) => (
                <div key={item.id} className="relative">
                  <div className="flex items-center justify-between mb-2 text-sm">
                    <div className="flex items-center gap-3">
                      <span className={`
                        w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                        ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
                          index === 1 ? 'bg-gray-100 text-gray-700' :
                            'bg-orange-50 text-orange-700'}
                      `}>
                        {index + 1}
                      </span>
                      <span className="font-medium text-foreground">{item.text}</span>
                    </div>
                    <span className="font-mono font-bold text-primary">{Math.round(item.adherence)}%</span>
                  </div>
                  <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-primary h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(item.adherence, 100)}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-sm text-muted-foreground py-4">لا توجد بيانات كافية</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
