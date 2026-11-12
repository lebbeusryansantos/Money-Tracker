'use client';

import React, { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import { Expense } from '@/lib/types';
import {
  INITIAL_MOCK_DATA,
  loadStoredExpenses,
  calculateMonthSummary,
  getMonthKey,
  formatCurrency,
} from '@/lib/utils';
import {
  getClientTodayDateISO,
  getMillisecondsUntilMidnight,
  isFutureDate,
} from '@/lib/dateUtils';
import { useAuth, checkExpensePermission } from '@/lib/auth';
import {
  fetchUserExpenses,
  createExpenseInCloud,
  updateExpenseInCloud,
  deleteExpenseFromCloud,
  bulkInsertExpensesInCloud,
  clearAllUserExpensesInCloud,
} from '@/lib/expenseService';
import { generateUUID } from '@/lib/types';
import DashboardMetrics from '@/components/DashboardMetrics';
import ExpenseForm from '@/components/ExpenseForm';
import ExpenseList from '@/components/ExpenseList';
import CategoryBreakdown from '@/components/CategoryBreakdown';
import DataExportImport from '@/components/DataExportImport';
import AuthBar from '@/components/AuthBar';
import AuthScreen from '@/components/AuthScreen';
import {
  WalletCards,
  Plus,
  Command,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react';

function ExpenseTrackerApp() {
  const { user, isLoading: authLoading } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoadingExpenses, setIsLoadingExpenses] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-11');
  const [todayDate, setTodayDate] = useState<string>('2026-11-12');
  const [toastMessage, setToastMessage] = useState<{ text: string; isError?: boolean } | null>(null);
  const isMounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const formRef = useRef<HTMLDivElement>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const input = formRef.current?.querySelector('input');
    input?.focus();
  };

  // Safe client-side initialization & Midnight automatic date rollover
  useEffect(() => {
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

  // Fetch expenses from Supabase cloud whenever authenticated user changes
  useEffect(() => {
    if (authLoading) return;

    let isCurrent = true;

    async function loadCloudExpenses() {
      if (!user) {
        if (isCurrent) {
          setExpenses([]);
          setIsLoadingExpenses(false);
        }
        return;
      }

      setIsLoadingExpenses(true);
      try {
        const { data, error } = await fetchUserExpenses(user.id);
        if (!isCurrent) return;

        if (error) {
          showToast(`Cloud fetch warning: ${error.message}`, true);
          setExpenses([]);
        } else if (data && data.length > 0) {
          setExpenses(data);
          // Auto select latest month with transactions
          const latest = [...data].sort((a, b) => b.date.localeCompare(a.date))[0];
          if (latest) {
            setSelectedMonth(latest.date.slice(0, 7));
          }
        } else {
          // Cloud table is empty: check if there's local data to migrate seamlessly
          const localData = loadStoredExpenses();
          if (localData && localData.length > 0) {
            setIsSyncing(true);
            const { data: migrated, error: migError } = await bulkInsertExpensesInCloud(
              localData,
              user.id
            );
            if (!isCurrent) return;

            if (!migError && migrated && migrated.length > 0) {
              setExpenses(migrated);
              showToast(`Migrated ${migrated.length} existing transactions to Supabase!`);
              const latest = [...migrated].sort((a, b) => b.date.localeCompare(a.date))[0];
              if (latest) {
                setSelectedMonth(latest.date.slice(0, 7));
              }
            } else {
              setExpenses([]);
            }
            setIsSyncing(false);
          } else {
            setExpenses([]);
          }
        }
      } catch (err: unknown) {
        if (isCurrent) {
          showToast(err instanceof Error ? err.message : 'Failed to connect to Supabase database.', true);
          setExpenses([]);
        }
      } finally {
        if (isCurrent) {
          setIsLoadingExpenses(false);
        }
      }
    }

    loadCloudExpenses();

    return () => {
      isCurrent = false;
    };
  }, [user, authLoading]);

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

  // Add new expense to Supabase Cloud
  const handleAddExpense = async (newExpData: Omit<Expense, 'id' | 'createdAt'>) => {
    if (!user) {
      showToast('Please sign in to log expenses.', true);
      return;
    }

    // Strictly block December 2026 onwards
    if (newExpData.date >= '2026-12-01') {
      showToast('December 2026 onwards is strictly locked. No logging permitted.', true);
      return;
    }

    // Guard against future dates
    if (isFutureDate(newExpData.date, todayDate)) {
      showToast('Rejected: Cannot log expenses for future dates.', true);
      return;
    }

    const newExpense: Expense = {
      ...newExpData,
      id: generateUUID(),
      createdAt: Date.now(),
      userId: user.id,
    };

    // Optimistic UI update
    const previous = [...expenses];
    setExpenses([newExpense, ...expenses]);

    const expMonth = getMonthKey(newExpense.date);
    if (expMonth !== selectedMonth) {
      setSelectedMonth(expMonth);
    }

    setIsSyncing(true);
    const { data: saved, error } = await createExpenseInCloud(newExpense, user.id);
    setIsSyncing(false);

    if (error) {
      // Rollback on failure
      setExpenses(previous);
      showToast(`Cloud Sync Error: ${error.message}`, true);
    } else if (saved) {
      // Replace optimistic row with verified server row
      setExpenses((curr) => curr.map((e) => (e.id === newExpense.id ? saved : e)));
      showToast(`Expense logged (${formatCurrency(newExpense.amount)})`);
    }
  };

  // Update existing expense in Supabase Cloud
  const handleUpdateExpense = async (updated: Expense) => {
    if (!user) {
      showToast('Please sign in to edit expenses.', true);
      return;
    }

    if (updated.date >= '2026-12-01') {
      showToast('December 2026 onwards is strictly locked. Editing disabled.', true);
      return;
    }

    const perm = checkExpensePermission(user, updated, 'edit');
    if (!perm.allowed) {
      showToast(perm.reason || 'Unauthorized to update this expense.', true);
      return;
    }

    // Optimistic UI update
    const previous = [...expenses];
    setExpenses((curr) => curr.map((e) => (e.id === updated.id ? updated : e)));

    setIsSyncing(true);
    const { error } = await updateExpenseInCloud(updated, user.id);
    setIsSyncing(false);

    if (error) {
      setExpenses(previous);
      showToast(`Update Failed: ${error.message}`, true);
    } else {
      showToast(`Changes saved for "${updated.description}"`);
    }
  };

  // Delete expense from Supabase Cloud
  const handleDeleteExpense = async (id: string) => {
    if (!user) {
      showToast('Please sign in to delete expenses.', true);
      return;
    }

    const target = expenses.find((e) => e.id === id);
    if (!target) return;

    if (target.date >= '2026-12-01') {
      showToast('December 2026 onwards is strictly locked. Deletion disabled.', true);
      return;
    }

    const perm = checkExpensePermission(user, target, 'delete');
    if (!perm.allowed) {
      showToast(perm.reason || 'Unauthorized to delete this expense.', true);
      return;
    }

    // Optimistic UI update
    const previous = [...expenses];
    setExpenses((curr) => curr.filter((e) => e.id !== id));

    setIsSyncing(true);
    const { error } = await deleteExpenseFromCloud(id, user.id);
    setIsSyncing(false);

    if (error) {
      setExpenses(previous);
      showToast(`Delete Failed: ${error.message}`, true);
    } else {
      showToast(`Deleted "${target.description}"`);
    }
  };

  // Import expenses (CSV or JSON) to Supabase Cloud
  const handleImportExpenses = async (imported: Expense[], mode: 'merge' | 'replace') => {
    if (!user) {
      showToast('Please sign in to import expenses.', true);
      return;
    }

    setIsSyncing(true);
    setIsLoadingExpenses(true);

    try {
      if (mode === 'replace') {
        await clearAllUserExpensesInCloud(user.id);
      }

      const prepared = imported.map((item) => ({
        ...item,
        id: item.id && item.id.length === 36 ? item.id : generateUUID(),
        userId: user.id,
      }));

      const { data: inserted, error } = await bulkInsertExpensesInCloud(prepared, user.id);
      if (error) {
        showToast(`Import Error: ${error.message}`, true);
      } else {
        const { data: freshList } = await fetchUserExpenses(user.id);
        if (freshList) {
          setExpenses(freshList);
          if (freshList.length > 0) {
            const latest = [...freshList].sort((a, b) => b.date.localeCompare(a.date))[0];
            setSelectedMonth(latest.date.slice(0, 7));
          }
        }
        showToast(`Successfully imported ${inserted?.length || prepared.length} expenses to cloud!`);
      }
    } finally {
      setIsSyncing(false);
      setIsLoadingExpenses(false);
    }
  };

  // Reset to initial mock data (November 2026 Google Sheet) in Supabase Cloud
  const handleResetToDemo = async () => {
    if (!user) {
      showToast('Please sign in to restore ledger.', true);
      return;
    }

    setIsSyncing(true);
    setIsLoadingExpenses(true);
    try {
      await clearAllUserExpensesInCloud(user.id);
      const seedItems = INITIAL_MOCK_DATA.map((item) => ({
        ...item,
        userId: user.id,
      }));
      const { data, error } = await bulkInsertExpensesInCloud(seedItems, user.id);
      if (error) {
        showToast(`Reset failed: ${error.message}`, true);
      } else {
        setExpenses(data || seedItems);
        setSelectedMonth('2026-11');
        showToast('Restored official Google Sheet ledger to cloud!');
      }
    } finally {
      setIsSyncing(false);
      setIsLoadingExpenses(false);
    }
  };

  // Clear all data from Supabase Cloud
  const handleClearAll = async () => {
    if (!user) {
      showToast('Please sign in to clear data.', true);
      return;
    }

    setIsSyncing(true);
    try {
      const { error } = await clearAllUserExpensesInCloud(user.id);
      if (error) {
        showToast(`Clear failed: ${error.message}`, true);
      } else {
        setExpenses([]);
        showToast('All cloud expense records wiped.');
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // Calculate unique months available (Strictly capped before December 2026)
  const availableMonths = useMemo(() => {
    const monthSet = new Set<string>();
    monthSet.add(selectedMonth);
    monthSet.add(todayDate.slice(0, 7));
    for (const exp of expenses) {
      monthSet.add(exp.date.slice(0, 7));
    }
    return Array.from(monthSet)
      .filter((m) => m <= '2026-11')
      .sort()
      .reverse();
  }, [expenses, selectedMonth, todayDate]);

  // Aggregate summary for selected month
  const monthSummary = useMemo(() => {
    return calculateMonthSummary(expenses, selectedMonth);
  }, [expenses, selectedMonth]);

  // Prevent SSR flash / hydration discrepancy
  if (!isMounted || authLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center space-y-3">
        <div className="flex items-center gap-2.5 text-zinc-400 font-mono text-xs">
          <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
          <span>CONNECTING TO SUPABASE CLOUD...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-20 sm:pb-12">
      {/* Transient Toast Notification Banner */}
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

      {/* Top Navigation Bar with Real Supabase Auth */}
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
                {isSyncing && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-zinc-500 font-mono">
                    <RefreshCw className="w-2.5 h-2.5 animate-spin text-emerald-400" />
                    <span className="hidden sm:inline">Syncing</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Metrics Glance (when signed in) */}
          {user && (
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
          )}

          {/* Profile / Auth Bar & Action Button */}
          <div className="flex items-center gap-2.5">
            <AuthBar />

            {user && (
              <button
                onClick={scrollToForm}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-medium transition-all shadow-sm active:scale-95 cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log Entry</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area: If logged out, render AuthScreen */}
      {!user ? (
        <main className="max-w-7xl mx-auto px-4 sm:px-6">
          <AuthScreen onSuccess={() => showToast('Signed in successfully!')} />
        </main>
      ) : (
        /* Authenticated Dashboard View */
        <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
          {/* Cloud Sync Status Indicator */}
          {isLoadingExpenses ? (
            <div className="rounded-xl bg-zinc-900/40 border border-zinc-800/60 p-6 flex items-center justify-center gap-2 text-xs font-mono text-zinc-400">
              <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
              <span>Fetching your cloud transactions from Supabase...</span>
            </div>
          ) : (
            <>
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
                      selectedMonth={selectedMonth}
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
                      <span>Cloud Sync &amp; Validation Specs</span>
                    </div>
                    <ul className="space-y-1 text-[11px] text-zinc-500 list-disc list-inside">
                      <li>Connected to Supabase PostgreSQL table <span className="font-mono text-zinc-400">public.expenses</span>.</li>
                      <li>Changes automatically sync across your phone and laptop in real-time.</li>
                      <li>Press <span className="font-mono text-zinc-400">N</span> or <span className="font-mono text-zinc-400">/</span> anywhere to focus the expense logger.</li>
                      <li>Future dates locked (`max={todayDate}`) with automatic midnight rollover.</li>
                      <li>December 2026 onwards is strictly read-only and locked.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      )}

      {/* Mobile Sticky Quick Action Bar (when signed in) */}
      {user && (
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
      )}
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
