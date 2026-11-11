'use client';

import React, { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import { Expense, UserProfile, Role } from '@/lib/types';
import {
  INITIAL_MOCK_DATA,
  loadStoredExpenses,
  saveStoredExpenses,
  calculateMonthSummary,
  getMonthKey,
  formatCurrency,
} from '@/lib/utils';
import {
  getClientTodayDateISO,
  getMillisecondsUntilMidnight,
  isFutureDate,
} from '@/lib/dateUtils';
import {
  AuthContext,
  PRESET_USERS,
  DEFAULT_USER,
  checkExpensePermission,
  canResetSystemData,
} from '@/lib/permissions';
import DashboardMetrics from '@/components/DashboardMetrics';
import ExpenseForm from '@/components/ExpenseForm';
import ExpenseList from '@/components/ExpenseList';
import CategoryBreakdown from '@/components/CategoryBreakdown';
import DataExportImport from '@/components/DataExportImport';
import AuthBar from '@/components/AuthBar';
import {
  WalletCards,
  Plus,
  Command,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

function ExpenseTrackerApp() {
  const [currentUser, setCurrentUser] = useState<UserProfile>(DEFAULT_USER);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-11');
  const [todayDate, setTodayDate] = useState<string>('2026-11-11');
  const [toastMessage, setToastMessage] = useState<{ text: string; isError?: boolean } | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const formRef = useRef<HTMLDivElement>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Safe client-side initialization & Midnight automatic date rollover
  useEffect(() => {
    setIsMounted(true);
    const clientToday = getClientTodayDateISO();
    setTodayDate(clientToday);

    const loaded = loadStoredExpenses();
    setExpenses(loaded);

    // Default to current month or latest available month in dataset
    const todayMonth = clientToday.slice(0, 7);
    const hasTodayMonth = loaded.some((e) => e.date.startsWith(todayMonth));
    if (hasTodayMonth) {
      setSelectedMonth(todayMonth);
    } else if (loaded.length > 0) {
      const latest = [...loaded].sort((a, b) => b.date.localeCompare(a.date))[0];
      setSelectedMonth(latest.date.slice(0, 7));
    }

    // Set automatic rollover timer for midnight rollover without requiring page refresh
    let timerId: NodeJS.Timeout;
    const scheduleMidnight = () => {
      const ms = getMillisecondsUntilMidnight();
      timerId = setTimeout(() => {
        const nextDay = getClientTodayDateISO();
        setTodayDate(nextDay);
        scheduleMidnight();
      }, ms);
    };

    scheduleMidnight();
    return () => clearTimeout(timerId);
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

  // Toast notification helper (auto-dismisses after 3 seconds)
  const showToast = (text: string, isError = false) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToastMessage({ text, isError });
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Add new expense with future date backend guard and userId ownership binding
  const handleAddExpense = (newExpData: Omit<Expense, 'id' | 'createdAt'>) => {
    // Guard against future dates
    if (isFutureDate(newExpData.date, todayDate)) {
      showToast('Rejected: Cannot log expenses for future dates.', true);
      return;
    }

    const newExpense: Expense = {
      ...newExpData,
      id: `exp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: Date.now(),
      userId: currentUser.id, // Attach ownership
    };

    const updated = [newExpense, ...expenses];
    updateExpensesAndPersist(updated);

    const expMonth = getMonthKey(newExpense.date);
    if (expMonth !== selectedMonth) {
      setSelectedMonth(expMonth);
    }

    showToast(`Expense logged (${formatCurrency(newExpense.amount)})`);
  };

  // Update existing expense with IDOR and ownership authorization check
  const handleUpdateExpense = (updated: Expense) => {
    const perm = checkExpensePermission(currentUser, updated, 'edit');
    if (!perm.allowed) {
      showToast(perm.reason || 'Unauthorized to update this expense.', true);
      return;
    }

    const updatedList = expenses.map((e) => (e.id === updated.id ? updated : e));
    updateExpensesAndPersist(updatedList);
    showToast(`Changes saved for "${updated.description}"`);
  };

  // Delete expense with IDOR and ownership authorization check
  const handleDeleteExpense = (id: string) => {
    const target = expenses.find((e) => e.id === id);
    if (!target) return;

    const perm = checkExpensePermission(currentUser, target, 'delete');
    if (!perm.allowed) {
      showToast(perm.reason || 'Unauthorized to delete this expense.', true);
      return;
    }

    const updatedList = expenses.filter((e) => e.id !== id);
    updateExpensesAndPersist(updatedList);
    showToast(`Deleted "${target.description}"`);
  };

  // Import expenses
  const handleImportExpenses = (imported: Expense[], mode: 'merge' | 'replace') => {
    let finalExpenses: Expense[] = [];
    if (mode === 'replace') {
      if (currentUser.role !== 'admin') {
        showToast('Permission Denied: Only Admin can replace all data.', true);
        return;
      }
      finalExpenses = imported.map((item) => ({
        ...item,
        userId: item.userId || currentUser.id,
      }));
    } else {
      const existingIds = new Set(expenses.map((e) => e.id));
      const newItems = imported
        .filter((e) => !existingIds.has(e.id))
        .map((item) => ({ ...item, userId: item.userId || currentUser.id }));
      finalExpenses = [...newItems, ...expenses];
    }

    updateExpensesAndPersist(finalExpenses);

    if (finalExpenses.length > 0) {
      const latest = [...finalExpenses].sort((a, b) => b.date.localeCompare(a.date))[0];
      setSelectedMonth(latest.date.slice(0, 7));
    }
  };

  // Reset to initial mock data (November 2026 Google Sheet)
  const handleResetToDemo = () => {
    const perm = canResetSystemData(currentUser);
    if (!perm.allowed) {
      showToast(perm.reason || 'Only Admin can reset system data.', true);
      return;
    }
    updateExpensesAndPersist(INITIAL_MOCK_DATA);
    setSelectedMonth('2026-11');
    showToast('Reset data to official Google Sheet ledger');
  };

  // Clear all data
  const handleClearAll = () => {
    const perm = canResetSystemData(currentUser);
    if (!perm.allowed) {
      showToast(perm.reason || 'Only Admin can wipe system data.', true);
      return;
    }
    updateExpensesAndPersist([]);
    showToast('All expense records wiped');
  };

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const input = formRef.current?.querySelector('input');
    input?.focus();
  };

  // Calculate unique months available
  const availableMonths = useMemo(() => {
    const monthSet = new Set<string>();
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

  // Auth Context Provider Value
  const authContextValue = useMemo(() => {
    return {
      currentUser,
      setCurrentUser,
      switchRole: (role: Role) => setCurrentUser(PRESET_USERS[role]),
      isAdmin: currentUser.role === 'admin',
      isGuest: currentUser.role === 'guest',
      canEditExpense: (exp: Expense) => checkExpensePermission(currentUser, exp, 'edit').allowed,
      canDeleteExpense: (exp: Expense) => checkExpensePermission(currentUser, exp, 'delete').allowed,
      canResetData: () => canResetSystemData(currentUser).allowed,
    };
  }, [currentUser]);

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
    <AuthContext.Provider value={authContextValue}>
      <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-20 sm:pb-12">
        {/* Transient Toast Notification Banner (Auto-dismisses in 3s) */}
        {toastMessage && (
          <div
            role="status"
            className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-3.5 py-2.5 rounded-lg border text-xs shadow-2xl backdrop-blur-md animate-in slide-in-from-top-2 duration-200 ${
              toastMessage.isError
                ? 'bg-rose-950/90 border-rose-700/80 text-rose-200'
                : 'bg-zinc-900/90 border-zinc-700/80 text-zinc-100'
            }`}
          >
            {toastMessage.isError ? (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span className="font-medium">{toastMessage.text}</span>
          </div>
        )}

        {/* Top Navigation Bar with Profile / Role Switcher */}
        <header className="sticky top-0 z-30 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
            {/* Logo & Brand */}
            <div className="flex items-center gap-2.5 shrink-0">
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

            {/* Quick Metrics Glance */}
            <div className="hidden lg:flex items-center gap-3 text-xs text-zinc-400 font-mono">
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

            {/* Profile / Auth Bar & Action Button */}
            <div className="flex items-center gap-2.5">
              <AuthBar />

              <button
                onClick={scrollToForm}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-medium transition-all shadow-sm active:scale-95 cursor-pointer shrink-0"
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
              {/* Frictionless Quick-Add Bar with Strict Field Validation */}
              <div ref={formRef}>
                <ExpenseForm
                  onAddExpense={handleAddExpense}
                  onInstantToast={(msg) => showToast(msg)}
                  currentDateISO={todayDate}
                />
              </div>

              {/* Itemized Ledger with Inline Edit, Date Grouping & IDOR Checks */}
              <ExpenseList
                expenses={expenses}
                onUpdateExpense={handleUpdateExpense}
                onDeleteExpense={handleDeleteExpense}
                selectedMonth={selectedMonth}
                onToast={(msg) => showToast(msg)}
                currentDateISO={todayDate}
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
                onToast={(msg) => showToast(msg)}
              />

              {/* Micro Quick Reference / Tips */}
              <div className="rounded-xl bg-zinc-900/40 border border-zinc-800/60 p-4 space-y-2 text-xs text-zinc-400">
                <div className="flex items-center gap-1.5 text-zinc-300 font-medium">
                  <Command className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Validation &amp; Security Specs</span>
                </div>
                <ul className="space-y-1 text-[11px] text-zinc-500 list-disc list-inside">
                  <li>Press <span className="font-mono text-zinc-400">N</span> or <span className="font-mono text-zinc-400">/</span> anywhere to focus the expense logger.</li>
                  <li>All fields strictly mandatory with real-time character counters.</li>
                  <li>Future dates locked (`max={todayDate}`) with automatic midnight rollover.</li>
                  <li>Click &quot;Edit&quot; on any owned record for seamless inline editing.</li>
                  <li>Role-based access protects system seed records from unauthorized deletion.</li>
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
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs shadow-md active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-zinc-950 stroke-[3]" />
            <span>Quick Log</span>
          </button>
        </div>
      </div>
    </AuthContext.Provider>
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
