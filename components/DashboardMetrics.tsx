'use client';

import React from 'react';
import { MonthSummary, WeeklySubtotal } from '@/lib/types';
import { formatCurrency, formatCompactCurrency } from '@/lib/utils';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  TrendingUp,
  Wallet,
  Clock,
  BarChart3,
  Sparkles,
  Lock,
} from 'lucide-react';

interface DashboardMetricsProps {
  summary: MonthSummary;
  selectedMonth: string;
  onSelectMonth: (month: string) => void;
  availableMonths: string[];
  todayDate?: string;
}

export default function DashboardMetrics({
  summary,
  selectedMonth,
  onSelectMonth,
  availableMonths,
  todayDate = '2026-11-11',
}: DashboardMetricsProps) {
  // Navigation
  const currentIndex = availableMonths.indexOf(selectedMonth);
  const hasPrevious = currentIndex < availableMonths.length - 1;
  const hasNext = currentIndex > 0;

  const goToPrevMonth = () => {
    if (hasPrevious) {
      onSelectMonth(availableMonths[currentIndex + 1]);
    } else {
      // Decrement month mathematically
      const [y, m] = selectedMonth.split('-').map(Number);
      const prevDate = new Date(y, m - 2, 1);
      const prevKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
      onSelectMonth(prevKey);
    }
  };

  const goToNextMonth = () => {
    if (hasNext) {
      const nextCandidate = availableMonths[currentIndex - 1];
      if (nextCandidate >= '2026-12') return;
      onSelectMonth(nextCandidate);
    } else {
      // Decrement month mathematically but strictly cap before December 2026
      const [y, m] = selectedMonth.split('-').map(Number);
      const nextDate = new Date(y, m, 1);
      const nextKey = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
      if (nextKey >= '2026-12') return;
      onSelectMonth(nextKey);
    }
  };

  const currentMonthKey = todayDate.slice(0, 7);
  const isCurrentMonth = selectedMonth === currentMonthKey;
  const isDecLocked = selectedMonth >= '2026-12';

  // Maximum weekly total for relative bar scaling
  const maxWeeklyTotal = Math.max(
    ...summary.weeklySubtotals.map((w) => w.total),
    1
  );

  return (
    <section className="space-y-4">
      {/* Top Month Navigation Bar */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900/80 border border-zinc-800 text-sm font-medium text-zinc-200">
            <Calendar className="w-4 h-4 text-zinc-400" />
            <span>{summary.label}</span>
          </div>

          {(isDecLocked || summary.isLocked || selectedMonth > currentMonthKey) && (
            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
              <Lock className="w-3 h-3" />
              <span>{isDecLocked ? 'Strictly Locked Period' : 'Read-Only Period'}</span>
            </span>
          )}

          {!isCurrentMonth && (
            <button
              onClick={() => onSelectMonth(currentMonthKey)}
              className="text-xs px-2.5 py-1 rounded-md bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 transition-colors cursor-pointer"
            >
              Current Month
            </button>
          )}
        </div>

        {/* Month Selector Buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={goToPrevMonth}
            aria-label="Previous month"
            className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={goToNextMonth}
            disabled={selectedMonth >= '2026-11' || isDecLocked}
            aria-label="Next month"
            className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 1. Monthly Total Spent */}
        <div className="relative overflow-hidden rounded-xl bg-zinc-900/60 border border-zinc-800/80 p-4 shadow-sm hover:border-zinc-700/80 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">
              Monthly Total
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Wallet className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-semibold tracking-tight text-zinc-100 tabular-nums">
            {formatCurrency(summary.total)}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-zinc-400">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-zinc-800/80 text-zinc-300 font-mono">
              {summary.expenseCount} {summary.expenseCount === 1 ? 'item' : 'items'}
            </span>
            <span>logged this month</span>
          </div>
        </div>

        {/* 2. Today's Spend */}
        <div className="relative overflow-hidden rounded-xl bg-zinc-900/60 border border-zinc-800/80 p-4 shadow-sm hover:border-zinc-700/80 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">
              Today&apos;s Spend
            </span>
            <div className="w-7 h-7 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-semibold tracking-tight text-zinc-100 tabular-nums">
            {formatCurrency(summary.todayTotal)}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-zinc-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Active day real-time glance</span>
          </div>
        </div>

        {/* 3. Average Daily Spend */}
        <div className="relative overflow-hidden rounded-xl bg-zinc-900/60 border border-zinc-800/80 p-4 shadow-sm hover:border-zinc-700/80 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">
              Avg Daily Spend
            </span>
            <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-semibold tracking-tight text-zinc-100 tabular-nums">
            {formatCurrency(summary.dailyAverage)}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-zinc-400">
            <span className="font-mono text-zinc-300">
              {summary.activeDaysCount} {summary.activeDaysCount === 1 ? 'active day' : 'active days'}
            </span>
            <span>· {summary.daysElapsed} days elapsed</span>
          </div>
        </div>

        {/* 4. Active Month Velocity */}
        <div className="relative overflow-hidden rounded-xl bg-zinc-900/60 border border-zinc-800/80 p-4 shadow-sm hover:border-zinc-700/80 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">
              Month Progress
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-semibold tracking-tight text-zinc-100 tabular-nums">
            {Math.round((summary.daysElapsed / summary.totalDaysInMonth) * 100)}%
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-zinc-400">
            <span className="font-mono text-zinc-300">Day {summary.daysElapsed}</span>
            <span>of {summary.totalDaysInMonth} days in {summary.label.split(' ')[0]}</span>
          </div>
        </div>
      </div>

      {/* Weekly Subtotals Visual Breakdown Bar */}
      <div className="rounded-xl bg-zinc-900/60 border border-zinc-800/80 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-zinc-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
              Calendar Weekly Subtotals
            </h3>
          </div>
          <span className="text-xs text-zinc-500">Monday – Sunday Intervals</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {summary.weeklySubtotals.map((week: WeeklySubtotal) => {
            const barPercent =
              maxWeeklyTotal > 0
                ? Math.min(100, Math.round((week.total / maxWeeklyTotal) * 100))
                : 0;

            const isNonZero = week.total > 0;

            return (
              <div
                key={week.weekIndex}
                className={`p-2.5 rounded-lg border transition-all ${
                  isNonZero
                    ? 'bg-zinc-950/70 border-zinc-800/80 hover:border-zinc-700'
                    : 'bg-zinc-950/30 border-zinc-900/60 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium text-zinc-200">{week.label}</span>
                  <span className="text-[11px] text-zinc-500 font-mono">
                    {week.count} {week.count === 1 ? 'tx' : 'txs'}
                  </span>
                </div>
                <div className="text-[11px] text-zinc-400 mb-1.5 truncate">
                  {week.dateRange}
                </div>
                <div className="font-mono font-semibold text-sm text-zinc-100 tabular-nums">
                  {formatCurrency(week.total)}
                </div>

                {/* Progress bar */}
                <div className="w-full bg-zinc-800/60 h-1.5 rounded-full overflow-hidden mt-2">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${barPercent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
