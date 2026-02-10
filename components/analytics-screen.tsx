"use client";

import { useStats } from "@/hooks/use-stats";
import { Loader2, Flame, Trophy, Calendar, Hash, Activity } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";

export default function AnalyticsScreen() {
  const { stats, loading } = useStats();

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="px-6 pt-8 pb-4">
        <h1 className="text-2xl font-serif font-bold text-foreground">إحصائياتي</h1>
        <p className="text-sm text-muted-foreground mt-1">تابع تقدمك وحافظ على استمرارك</p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-32">
        {/* Bento Grid Summary */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {/* Today's Count (Large) */}
          <div className="col-span-2 bg-gradient-to-br from-primary/10 to-primary/5 p-5 rounded-2xl border border-primary/10 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-primary mb-1 flex items-center gap-1.5">
                <Activity size={16} />
                نشاط اليوم
              </p>
              <h2 className="text-4xl font-bold text-foreground font-mono tracking-tight">
                {stats.todayCount}
              </h2>
            </div>
            <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
              <Hash size={24} />
            </div>
          </div>

          {/* Streak */}
          <div className="bg-card p-4 rounded-2xl border border-border shadow-sm flex flex-col justify-between">
            <div className="h-8 w-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400 mb-3">
              <Flame size={18} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground font-mono">
                {stats.streak} <span className="text-xs font-sans font-normal text-muted-foreground">أيام</span>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">تتابع متواصل</p>
            </div>
          </div>

          {/* Lifetime Total */}
          <div className="bg-card p-4 rounded-2xl border border-border shadow-sm flex flex-col justify-between">
            <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-3">
              <Trophy size={18} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground font-mono truncate">
                {stats.totalCount}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">مجموع الأذكار</p>
            </div>
          </div>
        </div>

        {/* Weekly Activity Chart */}
        <div className="mb-6">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Calendar size={18} className="text-primary" />
            النشاط الأسبوعي
          </h3>
          <div className="h-48 w-full bg-card/50 rounded-2xl border border-border/50 p-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[...stats.dailyActivity].reverse()}>
                <XAxis
                  dataKey="dayName"
                  tick={{ fontSize: 10, fill: '#888' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: 'transparent' }}
                  content={({ payload, label }) => {
                    if (payload && payload.length) {
                      return (
                        <div className="bg-popover text-popover-foreground text-xs p-2 rounded-lg border shadow-sm">
                          <p className="font-semibold mb-1">{label}</p>
                          <p>العدد: {payload[0].value}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {stats.dailyActivity.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="hsl(var(--primary))" fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Adhkar */}
        <div>
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Trophy size={18} className="text-yellow-500" />
            الأكثر تكراراً
          </h3>
          <div className="space-y-3">
            {stats.topAdhkar.length > 0 ? (
              stats.topAdhkar.map((item, index) => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-card border border-border">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-sm font-bold text-muted-foreground shrink-0">
                      #{index + 1}
                    </div>
                    <p className="text-sm font-medium text-foreground truncate">
                      {item.text}
                    </p>
                  </div>
                  <span className="text-sm font-mono font-bold text-primary mr-3 shrink-0">
                    {item.count}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-center text-sm text-muted-foreground py-8 opacity-60">
                ابدأ بذكر الله لتظهر إحصائياتك هنا
              </p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
