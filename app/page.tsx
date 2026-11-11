'use client';

import React, { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import { Expense } from '@/lib/types';
import {
  INITIAL_MOCK_DATA,
  loadStoredExpenses,
  saveStoredExpenses,
  calculateMonthSummary,
  getTodayDateString,
  getMonthKey,
  formatCurrency,
} from '@/lib/utils';
import DashboardMetrics from '@/components/DashboardMetrics';
import ExpenseForm from '@/components/ExpenseForm';
import ExpenseList from '@/components/ExpenseList';
import CategoryBreakdown from '@/components/CategoryBreakdown';
import DataExportImport from '@/components/DataExportImport';
import {
  WalletCards,
  Plus,
  ArrowUp,
  Sparkles,
  Command,
  CheckCircle2,
  Sliders,
} from 'lucide-react';

function ExpenseTrackerApp() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-11');
  const [todayDate, setTodayDate] = useState<string>('2026-11-11');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [mobileQuickAddOpen, setMobileQuickAddOpen] = useState(false);

  const formRef = useRef<HTMLDivElement>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Safe client-side initialization
  useEffect(() => {
    setIsMounted(true);
    const clientToday = getTodayDateString();
    setTodayDate(clientToday);

    const loaded = loadStoredExpenses();
    setExpenses(loaded);

    // Default to current month or latest available month
    const todayMonth = clientToday.slice(0, 7);
    const hasTodayMonth = loaded.some((e) => e.date.startsWith(todayMonth));
    if (hasTodayMonth) {
      setSelectedMonth(todayMonth);
    } else if (loaded.length > 0) {
      // Find latest month in data
      const latest = [...loaded].sort((a, b) => b.date.localeCompare(a.date))[0];
      setSelectedMonth(latest.date.slice(0, 7));
    }
  }, []);

  // Global keyboard shortcuts (N or / to log new expense)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
        return;
      }
      if (e.key === 'n' || e.key === 'N' || e.key === '/') {
        e.preventDefault();
        scrollToForm();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Save to localStorage whenever expenses change
  const updateExpensesAndPersist = (newExpenses: Expense[]) => {
    setExpenses(newExpenses);
    saveStoredExpenses(newExpenses);
  };

  // Toast notification helper
  const showToast = (message: string) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToastMessage(message);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // Add new expense
  const handleAddExpense = (newExpData: Omit<Expense, 'id' | 'createdAt'>) => {
    const newExpense: Expense = {
      ...newExpData,
      id: `exp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: Date.now(),
    };

    const updated = [newExpense, ...expenses];
    updateExpensesAndPersist(updated);

    // If added into a month different from current view, auto-switch to that month
    const expMonth = getMonthKey(newExpense.date);
    if (expMonth !== selectedMonth) {
      setSelectedMonth(expMonth);
    }

    showToast(`Logged ${formatCurrency(newExpense.amount)} for "${newExpense.description}"`);
  };

  // Update existing expense
  const handleUpdateExpense = (updated: Expense) => {
    const updatedList = expenses.map((e) => (e.id === updated.id ? updated : e));
    updateExpensesAndPersist(updatedList);
    showToast(`Updated "${updated.description}"`);
  };

  // Delete expense
  const handleDeleteExpense = (id: string) => {
    const target = expenses.find((e) => e.id === id);
    const updatedList = expenses.filter((e) => e.id !== id);
    updateExpensesAndPersist(updatedList);
    showToast(target ? `Deleted "${target.description}"` : 'Expense deleted');
  };

  // Import expenses
  const handleImportExpenses = (imported: Expense[], mode: 'merge' | 'replace') => {
    let finalExpenses: Expense[] = [];
    if (mode === 'replace') {
      finalExpenses = imported;
    } else {
      // Merge: avoid duplicates by ID or timestamp
      const existingIds = new Set(expenses.map((e) => e.id));
      const newItems = imported.filter((e) => !existingIds.has(e.id));
      finalExpenses = [...newItems, ...expenses];
    }

    updateExpensesAndPersist(finalExpenses);

    if (finalExpenses.length > 0) {
      const latest = [...finalExpenses].sort((a, b) => b.date.localeCompare(a.date))[0];
      setSelectedMonth(latest.date.slice(0, 7));
    }
  };

  // Reset to initial mock data (November 2026)
  const handleResetToDemo = () => {
    updateExpensesAndPersist(INITIAL_MOCK_DATA);
    setSelectedMonth('2026-11');
  };

  // Clear all data
  const handleClearAll = () => {
    updateExpensesAndPersist([]);
  };

  // Scroll to quick-add form
  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const input = formRef.current?.querySelector('input');
    input?.focus();
  };

  // Calculate unique months available
  const availableMonths = useMemo(() => {
    const monthSet = new Set<string>();
    // Always include selectedMonth and current real-time month
    monthSet.add(selectedMonth);
    monthSet.add(todayDate.slice(0, 7));
    for (const exp of expenses) {
      monthSet.add(exp.date.slice(0, 7));
    }
    return Array.from(monthSet).sort().reverse();
  }, [expenses, selectedMonth, todayDate]);

  // Aggregate summary for selected month
  const monthSummary = useMemo(() => {
    return calculateMonthSummary(expenses, selectedMonth);
  }, [expenses, selectedMonth]);

  // Prevent SSR flash / hydration discrepancy
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex items-center gap-2 text-zinc-500 font-mono text-xs">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>INITIALIZING TRACKER...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-20 sm:pb-12">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-zinc-900 border border-zinc-700/80 text-zinc-100 text-xs shadow-xl animate-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700/80 flex items-center justify-center text-zinc-100 font-bold shadow-inner">
              <WalletCards className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-sm tracking-tight text-white">
                  TRACKER
                </span>
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  PHP
                </span>
              </div>
            </div>
          </div>

          {/* Quick Glances & Action */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-3 text-xs text-zinc-400 font-mono pr-2">
              <div>
                Today:{' '}
                <span className="text-zinc-200 font-medium">
                  {formatCurrency(monthSummary.todayTotal)}
                </span>
              </div>
              <span className="text-zinc-700">|</span>
              <div>
                Month:{' '}
                <span className="text-zinc-200 font-medium">
                  {formatCurrency(monthSummary.total)}
                </span>
              </div>
            </div>

            <button
              onClick={scrollToForm}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-medium transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Entry</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Real-time Dashboard KPI Cards */}
        <DashboardMetrics
          summary={monthSummary}
          selectedMonth={selectedMonth}
          onSelectMonth={setSelectedMonth}
          availableMonths={availableMonths}
          todayDate={todayDate}
        />

        {/* 2-Column Responsive Layout: Left Stream & Right Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Stream (Col 8 on Desktop) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Frictionless Quick-Add Bar */}
            <div ref={formRef}>
              <ExpenseForm
                onAddExpense={handleAddExpense}
                onInstantToast={showToast}
              />
            </div>

            {/* Itemized Ledger with Search, Grouping, Inline Edit & Delete */}
            <ExpenseList
              expenses={expenses}
              onUpdateExpense={handleUpdateExpense}
              onDeleteExpense={handleDeleteExpense}
              selectedMonth={selectedMonth}
            />
          </div>

          {/* Sidebar (Col 4 on Desktop) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Category Breakdown & Progress Bars */}
            <CategoryBreakdown
              categories={monthSummary.categoryBreakdown}
              totalMonthlySpent={monthSummary.total}
            />

            {/* Data Management: Export CSV/JSON, Import, Reset */}
            <DataExportImport
              expenses={expenses}
              onImportExpenses={handleImportExpenses}
              onResetToDemo={handleResetToDemo}
              onClearAll={handleClearAll}
              onToast={showToast}
            />

            {/* Micro Quick Reference / Tips */}
            <div className="rounded-xl bg-zinc-900/40 border border-zinc-800/60 p-4 space-y-2 text-xs text-zinc-400">
              <div className="flex items-center gap-1.5 text-zinc-300 font-medium">
                <Command className="w-3.5 h-3.5 text-zinc-400" />
                <span>Quick Power Tips</span>
              </div>
              <ul className="space-y-1 text-[11px] text-zinc-500 list-disc list-inside">
                <li>Press <span className="font-mono text-zinc-400">N</span> or <span className="font-mono text-zinc-400">/</span> anywhere to quickly focus the expense logger.</li>
                <li>Tap any one-tap preset button to instantly log frequent micro-expenses.</li>
                <li>Press <span className="font-mono text-zinc-400">Enter</span> to submit from description or amount field.</li>
                <li>Filter by category pill or search description/amount in real time.</li>
                <li>Export anytime to standard CSV or JSON backup. Zero server latency.</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Sticky Quick Action Bar */}
      <div className="sm:hidden fixed bottom-3 left-4 right-4 z-40 flex items-center justify-between p-2 rounded-xl bg-zinc-900/90 border border-zinc-800 backdrop-blur-lg shadow-2xl">
        <div className="flex flex-col pl-2">
          <span className="text-[10px] text-zinc-500 uppercase font-mono">Today&apos;s Spend</span>
          <span className="text-xs font-mono font-bold text-zinc-200 tabular-nums">
            {formatCurrency(monthSummary.todayTotal)}
          </span>
        </div>

        <button
          onClick={scrollToForm}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs shadow-md active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4 text-zinc-950 stroke-[3]" />
          <span>Quick Log</span>
        </button>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
          <div className="flex items-center gap-2 text-zinc-500 font-mono text-xs">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>INITIALIZING TRACKER...</span>
          </div>
        </div>
      }
    >
      <ExpenseTrackerApp />
    </Suspense>
  );
}
