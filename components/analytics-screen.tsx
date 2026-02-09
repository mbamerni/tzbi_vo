"use client";

import React from "react"
import { useAnalytics } from "@/hooks/use-analytics";
import { Flame, TrendingUp, Award, BookOpen, Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

function WeeklyChart({ stats, maxCount }: { stats: any[], maxCount: number }) {
  return (
    <div className="flex items-end justify-between gap-2 h-36 px-2">
      {stats.map((stat) => {
        const height = maxCount > 0 ? (stat.count / maxCount) * 100 : 0;
        return (
          <div key={stat.date} className="flex flex-col items-center gap-1.5 flex-1">
            <div className="w-full bg-secondary rounded-full relative overflow-hidden" style={{ height: "100px" }}>
              <div
                className="absolute bottom-0 w-full bg-primary rounded-full transition-all duration-500"
                style={{ height: `${height}%` }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis w-full text-center">{stat.day}</span>
          </div>
        );
      })}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border">
      <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-bold text-card-foreground">{value}</p>
        {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );
}

export default function AnalyticsScreen() {
  const { stats, mostRead, summary, loading, dateRange } = useAnalytics();

  const maxCount = Math.max(...stats.map((s) => s.count), 1);
  const weeklyPercentage = Math.min(Math.round((summary.totalWeek / summary.weeklyTarget) * 100), 100);

  if (loading && stats.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={24} />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="px-4 pt-5 pb-3">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="font-semibold text-foreground text-xl">لوحة التحكم</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              تتبع تقدمك والتزامك
            </p>
          </div>
          <div className="bg-secondary/50 px-3 py-1.5 rounded-xl text-xs font-medium text-muted-foreground flex items-center gap-2">
            <CalendarIcon size={14} />
            <span>{format(dateRange.start, 'd MMM', { locale: ar })} - {format(dateRange.end, 'd MMM', { locale: ar })}</span>
          </div>
        </div>
      </div>

      <div className="px-4 pb-6 space-y-5">
        {/* Stat Cards */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={<Flame size={20} />}
            label="إجمالي الأسبوع"
            value={summary.totalWeek.toString()}
            sub="ذكر تم إنجازه"
          />
          <StatCard
            icon={<TrendingUp size={20} />}
            label="نسبة الالتزام"
            value={`${weeklyPercentage}%`}
            sub={`من الهدف: ${summary.weeklyTarget}`}
          />
        </div>

        {/* Weekly Chart */}
        <div className="p-4 rounded-2xl bg-card border border-border">
          <div className="flex items-center gap-2 mb-4">
            <Award size={18} className="text-primary" />
            <h3 className="font-semibold text-card-foreground text-sm">
              النشاط اليومي
            </h3>
          </div>
          <WeeklyChart stats={stats} maxCount={maxCount} />
        </div>

        {/* Most Read */}
        <div className="p-4 rounded-2xl bg-card border border-border">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen size={18} className="text-primary" />
            <h3 className="font-semibold text-card-foreground text-sm">
              الأكثر قراءة
            </h3>
          </div>

          <div className="space-y-3">
            {mostRead.map((item, index) => {
              const max = mostRead[0]?.count || 1;
              const width = (item.count / max) * 100;

              return (
                <div key={item.name} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-serif text-sm text-foreground truncate mb-1">
                      {item.name}
                    </p>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-500"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground font-medium shrink-0">
                    {item.count.toLocaleString("ar-SA")}
                  </span>
                </div>
              );
            })}
            {mostRead.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-4">لا توجد بيانات كافية</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

