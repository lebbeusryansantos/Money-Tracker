'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Expense, Category } from '@/lib/types';
import {
  CATEGORIES,
  CATEGORY_CONFIG,
  formatCurrency,
  formatRelativeDate,
  roundCurrency,
} from '@/lib/utils';
import {
  validateExpenseForm,
  blockInvalidAmountKeys,
  MAX_DESCRIPTION_LENGTH,
  MAX_SINGLE_EXPENSE_AMOUNT,
} from '@/lib/validation';
import {
  isRecordEditable,
  getClientTodayDateISO,
  isTimeFeatureEnabled,
  formatTimeDisplay,
  isDecemberOnwards,
} from '@/lib/dateUtils';
import { useAuth, checkExpensePermission } from '@/lib/permissions';
import {
  Search,
  Trash2,
  Edit3,
  UtensilsCrossed,
  Car,
  ShoppingBag,
  Film,
  Zap,
  MoreHorizontal,
  ArrowUpDown,
  X,
  AlertTriangle,
  Lock,
  Clock,
} from 'lucide-react';

interface ExpenseListProps {
  expenses: Expense[];
  onUpdateExpense: (updated: Expense) => void;
  onDeleteExpense: (id: string) => void;
  selectedMonth: string;
  onToast?: (msg: string) => void;
  currentDateISO?: string;
}

export default function ExpenseList({
  expenses,
  onUpdateExpense,
  onDeleteExpense,
  selectedMonth,
  onToast,
  currentDateISO,
}: ExpenseListProps) {
  const { currentUser } = useAuth();
  const todayISO = currentDateISO || getClientTodayDateISO();
  const isMonthLocked = isDecemberOnwards(selectedMonth);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');

  // Inline Row Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDesc, setEditDesc] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editCategory, setEditCategory] = useState<Category>('Food');
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editErrors, setEditErrors] = useState<{
    description?: string;
    amount?: string;
    date?: string;
    time?: string;
  }>({});

  // Delete Confirmation State
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);

  // Keyboard shortcut listener to cancel inline edit on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (editingId) {
          setEditingId(null);
          setEditErrors({});
        } else if (expenseToDelete) {
          setExpenseToDelete(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingId, expenseToDelete]);

  // Filter & Sort Logic
  const filteredExpenses = useMemo(() => {
    return expenses.filter((item) => {
      // Month match (if not 'All')
      if (selectedMonth && !item.date.startsWith(selectedMonth)) {
        return false;
      }

      // Category match
      if (selectedCategory !== 'All' && item.category !== selectedCategory) {
        return false;
      }

      // Search match
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesDesc = item.description.toLowerCase().includes(query);
        const matchesCategory = item.category.toLowerCase().includes(query);
        const matchesAmount = item.amount.toString().includes(query);
        if (!matchesDesc && !matchesCategory && !matchesAmount) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'date-desc') {
        const dateDiff = b.date.localeCompare(a.date);
        if (dateDiff !== 0) return dateDiff;
        // Within same date: latest must be on top for all days
        if (a.order !== undefined && b.order !== undefined) {
          return b.order - a.order;
        }
        if (a.time && b.time && a.time !== b.time) {
          return b.time.localeCompare(a.time);
        }
        return b.createdAt - a.createdAt;
      } else if (sortBy === 'date-asc') {
        const dateDiff = a.date.localeCompare(b.date);
        if (dateDiff !== 0) return dateDiff;
        if (a.order !== undefined && b.order !== undefined) {
          return a.order - b.order;
        }
        if (a.time && b.time && a.time !== b.time) {
          return a.time.localeCompare(b.time);
        }
        return a.createdAt - b.createdAt;
      } else if (sortBy === 'amount-desc') {
        return b.amount - a.amount;
      } else {
        return a.amount - b.amount;
      }
    });
  }, [expenses, selectedMonth, selectedCategory, searchQuery, sortBy]);

  // Group by Date: THE LATEST MUST BE ON TOP for all days
  const groupedByDate = useMemo(() => {
    const groups: { date: string; items: Expense[]; subtotal: number }[] = [];
    const map = new Map<string, Expense[]>();

    for (const exp of filteredExpenses) {
      if (!map.has(exp.date)) {
        map.set(exp.date, []);
      }
      map.get(exp.date)!.push(exp);
    }

    map.forEach((items, date) => {
      if (sortBy === 'amount-desc') {
        items.sort((a, b) => b.amount - a.amount);
      } else if (sortBy === 'amount-asc') {
        items.sort((a, b) => a.amount - b.amount);
      } else if (sortBy === 'date-asc') {
        // Date ascending: oldest on top within day
        if (date <= '2026-11-11') {
          items.sort((a, b) => {
            if (a.order !== undefined && b.order !== undefined) {
              return a.order - b.order;
            }
            return a.createdAt - b.createdAt;
          });
        } else {
          items.sort((a, b) => {
            if (a.time && b.time && a.time !== b.time) return a.time.localeCompare(b.time);
            return a.createdAt - b.createdAt;
          });
        }
      } else {
        // Default (date-desc): THE LATEST MUST BE ON TOP for all days
        if (date <= '2026-11-11') {
          // Latest logged entry on top (e.g. order 20 Tricycle > order 19 Grab > order 18 Lunch)
          items.sort((a, b) => {
            if (a.order !== undefined && b.order !== undefined) {
              return b.order - a.order;
            }
            return b.createdAt - a.createdAt;
          });
        } else {
          // November 12 onwards: latest time on top, fallback to createdAt descending
          items.sort((a, b) => {
            if (a.time && b.time && a.time !== b.time) return b.time.localeCompare(a.time);
            return b.createdAt - a.createdAt;
          });
        }
      }

      const subtotal = roundCurrency(
        items.reduce((sum, item) => sum + item.amount, 0)
      );
      groups.push({ date, items, subtotal });
    });

    if (sortBy === 'date-asc') {
      groups.sort((a, b) => a.date.localeCompare(b.date));
    } else {
      groups.sort((a, b) => b.date.localeCompare(a.date));
    }

    return groups;
  }, [filteredExpenses, sortBy]);

  // Filtered total sum
  const filteredTotal = useMemo(() => {
    return roundCurrency(
      filteredExpenses.reduce((sum, item) => sum + item.amount, 0)
    );
  }, [filteredExpenses]);

  // Icon mapping
  const getCategoryIcon = (cat: Category) => {
    switch (cat) {
      case 'Food':
        return <UtensilsCrossed className="w-3.5 h-3.5" />;
      case 'Transportation':
        return <Car className="w-3.5 h-3.5" />;
      case 'Shopping':
        return <ShoppingBag className="w-3.5 h-3.5" />;
      case 'Entertainment':
        return <Film className="w-3.5 h-3.5" />;
      case 'Utilities':
        return <Zap className="w-3.5 h-3.5" />;
      default:
        return <MoreHorizontal className="w-3.5 h-3.5" />;
    }
  };

  // Start Inline Editing
  const handleStartInlineEdit = (item: Expense) => {
    if (isDecemberOnwards(item.date) || isMonthLocked) {
      if (onToast) onToast('December 2026 onwards is strictly locked. Editing disabled.');
      return;
    }

    const perm = checkExpensePermission(currentUser, item, 'edit');
    if (!perm.allowed) {
      if (onToast) onToast(perm.reason || 'Permission denied.');
      return;
    }

    setEditingId(item.id);
    setEditDesc(item.description);
    setEditAmount(item.amount.toString());
    setEditCategory(item.category);
    setEditDate(item.date);
    // Preserve existing time or format from timestamp
    setEditTime(
      item.time ||
        (item.createdAt
          ? new Date(item.createdAt).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })
          : '12:00')
    );
    setEditErrors({});
  };

  const handleCancelInlineEdit = () => {
    setEditingId(null);
    setEditErrors({});
  };

  const handleSaveInlineEdit = (originalItem: Expense) => {
    const timeActive = isTimeFeatureEnabled(editDate);

    const validation = validateExpenseForm(
      {
        description: editDesc,
        amount: editAmount,
        category: editCategory,
        date: editDate,
        time: timeActive ? editTime : undefined,
      },
      todayISO
    );

    if (!validation.isValid) {
      setEditErrors({
        description: validation.errors.description,
        amount: validation.errors.amount,
        date: validation.errors.date,
        time: validation.errors.time,
      });
      return;
    }

    // Time doesn't change once edited EXCEPT when user manually edits it
    onUpdateExpense({
      ...originalItem,
      description: validation.sanitizedDescription,
      amount: validation.parsedAmount,
      category: editCategory,
      date: editDate,
      time: timeActive ? (editTime || originalItem.time) : undefined,
      createdAt: originalItem.createdAt, // Preserved untouched
    });

    setEditingId(null);
    setEditErrors({});
    if (onToast) onToast(`Changes saved (${formatCurrency(validation.parsedAmount)})`);
  };

  // Prompt Delete
  const handlePromptDelete = (item: Expense) => {
    if (isDecemberOnwards(item.date) || isMonthLocked) {
      if (onToast) onToast('December 2026 onwards is strictly locked. Deletion disabled.');
      return;
    }

    const perm = checkExpensePermission(currentUser, item, 'delete');
    if (!perm.allowed) {
      if (onToast) onToast(perm.reason || 'Permission denied.');
      return;
    }
    setExpenseToDelete(item);
  };

  const handleConfirmDelete = () => {
    if (expenseToDelete) {
      onDeleteExpense(expenseToDelete.id);
      setExpenseToDelete(null);
    }
  };

  return (
    <section className="space-y-4">
      {/* December 2026 Onwards Strict Lock Banner */}
      {isMonthLocked && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2.5 text-xs text-amber-300">
          <Lock className="w-4 h-4 shrink-0 text-amber-400" />
          <span className="font-medium">
            December 2026 onwards is strictly locked. You are not allowed to type anything or access any action buttons in this period.
          </span>
        </div>
      )}

      {/* Search & Filter Header Bar */}
      <div className="rounded-xl bg-zinc-900/60 border border-zinc-800/80 p-3.5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Keyword Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search expenses (e.g. Chagee, Tricycle, Grab)..."
              className="w-full bg-zinc-950/80 border border-zinc-800 rounded-lg pl-9 pr-8 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-950/80 border border-zinc-800 text-xs text-zinc-300">
              <ArrowUpDown className="w-3.5 h-3.5 text-zinc-500" />
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(
                    e.target.value as 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'
                  )
                }
                className="bg-transparent text-zinc-200 focus:outline-none cursor-pointer"
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="amount-desc">Highest Amount</option>
                <option value="amount-asc">Lowest Amount</option>
              </select>
            </div>
          </div>
        </div>

        {/* Category Pills & Stats Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-zinc-800/60">
          <div className="flex flex-wrap items-center gap-1">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`text-xs px-2.5 py-1 rounded-md transition-colors cursor-pointer border ${
                selectedCategory === 'All'
                  ? 'bg-zinc-100 text-zinc-950 font-medium border-zinc-100'
                  : 'bg-zinc-950/50 text-zinc-400 border-zinc-800/80 hover:text-zinc-200'
              }`}
            >
              All
            </button>
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat;
              const config = CATEGORY_CONFIG[cat];
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-xs px-2.5 py-1 rounded-md transition-colors cursor-pointer border ${
                    isSelected
                      ? `${config.color} border-current font-medium`
                      : 'bg-zinc-950/50 text-zinc-400 border-zinc-800/80 hover:text-zinc-200'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Filter summary status */}
          <div className="text-xs text-zinc-400 font-mono">
            <span>
              {filteredExpenses.length} {filteredExpenses.length === 1 ? 'entry' : 'entries'}
            </span>
            <span className="mx-1.5 text-zinc-600">·</span>
            <span className="text-zinc-200 font-semibold">{formatCurrency(filteredTotal)}</span>
          </div>
        </div>
      </div>

      {/* Itemized Ledger with Exact Sheet Order & Conditional Time */}
      {filteredExpenses.length === 0 ? (
        <div className="rounded-xl bg-zinc-900/30 border border-zinc-800/60 p-10 text-center space-y-2">
          <div className="w-10 h-10 rounded-full bg-zinc-800/60 text-zinc-500 mx-auto flex items-center justify-center">
            <Search className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-medium text-zinc-300">No expenses found</h4>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            {searchQuery || selectedCategory !== 'All'
              ? 'Try adjusting your search query or category filter.'
              : 'No expenses logged for this period yet.'}
          </p>
          {(searchQuery || selectedCategory !== 'All') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
              }}
              className="mt-2 text-xs px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors cursor-pointer"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {groupedByDate.map((group) => {
            const { label, subLabel } = formatRelativeDate(group.date);
            const isGroupLocked = isDecemberOnwards(group.date) || !isRecordEditable(group.date, todayISO);
            const timeFeatureActive = isTimeFeatureEnabled(group.date);

            return (
              <div key={group.date} className="space-y-1.5">
                {/* Date Group Header */}
                <div className="flex items-center justify-between px-2 pt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-zinc-200 tracking-wide">
                      {label}
                    </span>
                    <span className="text-[11px] text-zinc-500 font-mono">
                      {subLabel}
                    </span>
                    {isGroupLocked && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <Lock className="w-2.5 h-2.5" />
                        <span>Locked Period</span>
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-mono font-medium text-zinc-400 tabular-nums">
                    Daily Total: <span className="text-zinc-200 font-semibold">{formatCurrency(group.subtotal)}</span>
                  </div>
                </div>

                {/* List items for this date */}
                <div className="rounded-xl bg-zinc-900/60 border border-zinc-800/80 divide-y divide-zinc-800/60 overflow-hidden shadow-sm">
                  {group.items.map((item) => {
                    const catConfig = CATEGORY_CONFIG[item.category];
                    const isEditing = editingId === item.id;
                    const permEdit = checkExpensePermission(currentUser, item, 'edit');
                    const permDelete = checkExpensePermission(currentUser, item, 'delete');
                    const isReadOnly = isGroupLocked || isMonthLocked || (!permEdit.allowed && !permDelete.allowed);

                    // Inline Row Edit State
                    if (isEditing) {
                      return (
                        <div
                          key={item.id}
                          className="p-3 sm:px-4 bg-zinc-900/90 border-l-2 border-emerald-500 space-y-2 animate-in fade-in"
                        >
                          <div className="text-[11px] font-semibold text-zinc-400 flex items-center justify-between">
                            <span>Inline Editing Entry</span>
                            <span className="text-[10px] text-zinc-500 font-mono">
                              Press Enter to save, Esc to cancel
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-start">
                            {/* Edit Description */}
                            <div className="sm:col-span-4">
                              <input
                                type="text"
                                maxLength={MAX_DESCRIPTION_LENGTH}
                                value={editDesc}
                                onChange={(e) => setEditDesc(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-zinc-500"
                                placeholder="Description (min 3 chars)"
                                autoFocus
                              />
                              {editErrors.description && (
                                <span className="text-[10px] text-rose-400 block mt-0.5">
                                  {editErrors.description}
                                </span>
                              )}
                            </div>

                            {/* Edit Amount */}
                            <div className="sm:col-span-3">
                              <div className="relative">
                                <span className="absolute left-2 top-1.5 text-zinc-500 font-mono text-xs">
                                  ₱
                                </span>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0.01"
                                  max={MAX_SINGLE_EXPENSE_AMOUNT}
                                  value={editAmount}
                                  onKeyDown={blockInvalidAmountKeys}
                                  onChange={(e) => setEditAmount(e.target.value)}
                                  className="w-full bg-zinc-950 border border-zinc-700 rounded pl-6 pr-2 py-1.5 text-xs font-mono text-zinc-100 focus:outline-none focus:border-zinc-500"
                                  placeholder="0.00"
                                />
                              </div>
                              {editErrors.amount && (
                                <span className="text-[10px] text-rose-400 block mt-0.5">
                                  {editErrors.amount}
                                </span>
                              )}
                            </div>

                            {/* Edit Category */}
                            <div className="sm:col-span-2">
                              <select
                                value={editCategory}
                                onChange={(e) => setEditCategory(e.target.value as Category)}
                                className="w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-500 cursor-pointer"
                              >
                                {CATEGORIES.map((c) => (
                                  <option key={c} value={c}>
                                    {c}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Edit Date */}
                            <div className={timeFeatureActive ? 'sm:col-span-2' : 'sm:col-span-3'}>
                              <input
                                type="date"
                                max={todayISO < '2026-11-30' ? todayISO : '2026-11-30'}
                                value={editDate}
                                onChange={(e) => setEditDate(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-700 rounded px-1.5 py-1.5 text-[11px] font-mono text-zinc-200 focus:outline-none focus:border-zinc-500 cursor-pointer"
                              />
                              {editErrors.date && (
                                <span className="text-[10px] text-rose-400 block mt-0.5">
                                  {editErrors.date}
                                </span>
                              )}
                            </div>

                            {/* Edit Time (Only active and editable on Nov 12 onwards) */}
                            {timeFeatureActive && (
                              <div className="sm:col-span-1">
                                <input
                                  type="time"
                                  value={editTime}
                                  title="Edit time"
                                  onChange={(e) => setEditTime(e.target.value)}
                                  className="w-full bg-zinc-950 border border-zinc-700 rounded px-1 py-1.5 text-[11px] font-mono text-zinc-200 focus:outline-none focus:border-zinc-500 cursor-pointer"
                                />
                                {editErrors.time && (
                                  <span className="text-[10px] text-rose-400 block mt-0.5">
                                    {editErrors.time}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Action Buttons for Inline Edit */}
                          <div className="flex items-center justify-end gap-2 pt-1 border-t border-zinc-800/60">
                            <button
                              type="button"
                              onClick={handleCancelInlineEdit}
                              className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition-colors cursor-pointer"
                            >
                              Cancel (Esc)
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveInlineEdit(item)}
                              className="px-3 py-1 rounded bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-medium text-xs transition-colors cursor-pointer"
                            >
                              Save Changes
                            </button>
                          </div>
                        </div>
                      );
                    }

                    // Standard Display Row
                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 sm:px-4 hover:bg-zinc-800/30 transition-colors group"
                      >
                        {/* Left: Icon & Description */}
                        <div className="flex items-center gap-3 min-w-0 pr-3">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${catConfig.badgeBg} ${catConfig.border} ${catConfig.textColor}`}
                          >
                            {getCategoryIcon(item.category)}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-zinc-100 truncate group-hover:text-white flex items-center gap-1.5">
                              <span>{item.description}</span>
                              {isReadOnly && (
                                <span title="Read-only record" className="text-zinc-500">
                                  <Lock className="w-3 h-3 inline" />
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                              <span className={`text-[11px] font-medium ${catConfig.textColor}`}>
                                {item.category}
                              </span>

                              {/* Timing feature: ONLY rendered on November 12 onwards! Ignored on Nov 11 & before */}
                              {timeFeatureActive && (
                                <>
                                  <span>·</span>
                                  <span className="font-mono text-[11px] text-zinc-400 flex items-center gap-0.5">
                                    <Clock className="w-2.5 h-2.5 inline text-zinc-500" />
                                    <span>{formatTimeDisplay(item.time, item.createdAt)}</span>
                                  </span>
                                </>
                              )}

                              {item.userId === 'usr-admin-1' && (
                                <>
                                  <span>·</span>
                                  <span className="text-[10px] text-zinc-600 font-mono">System Seed</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right: Amount & Actions */}
                        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                          <div className="font-mono font-semibold text-sm sm:text-base text-zinc-100 tabular-nums tracking-tight">
                            {formatCurrency(item.amount)}
                          </div>

                          {/* Action Buttons: Disabled & Locked on December 2026 onwards */}
                          {!isMonthLocked && (
                            <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                              {permEdit.allowed && !isGroupLocked ? (
                                <button
                                  onClick={() => handleStartInlineEdit(item)}
                                  aria-label="Edit expense inline"
                                  title="Edit expense"
                                  className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <span
                                  title={permEdit.reason || 'Locked period'}
                                  className="p-1.5 text-zinc-600 cursor-not-allowed"
                                >
                                  <Lock className="w-3.5 h-3.5" />
                                </span>
                              )}

                              {permDelete.allowed && !isGroupLocked ? (
                                <button
                                  onClick={() => handlePromptDelete(item)}
                                  aria-label="Delete expense"
                                  title="Delete expense"
                                  className="p-1.5 rounded-md hover:bg-rose-500/10 text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              ) : null}
                            </div>
                          )}

                          {isMonthLocked && (
                            <span title="December 2026 onwards locked" className="text-zinc-600 p-1">
                              <Lock className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Accessible Custom Delete Confirmation Modal */}
      {expenseToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
        >
          <div className="w-full max-w-sm rounded-xl bg-zinc-900 border border-zinc-800 p-5 shadow-2xl space-y-4">
            <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-5 h-5" />
            </div>

            <div className="text-center space-y-1">
              <h3 id="delete-dialog-title" className="text-sm font-semibold text-zinc-100">
                Delete Expense?
              </h3>
              <p className="text-xs text-zinc-400">
                Are you sure you want to permanently delete{' '}
                <span className="font-semibold text-zinc-200">
                  &ldquo;{expenseToDelete.description}&rdquo;
                </span>{' '}
                for{' '}
                <span className="font-mono text-zinc-200">
                  {formatCurrency(expenseToDelete.amount)}
                </span>
                ? This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setExpenseToDelete(null)}
                className="w-1/2 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Cancel (Esc)
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="w-1/2 py-2 rounded-lg text-xs font-medium bg-rose-500 hover:bg-rose-600 text-white transition-colors shadow-sm cursor-pointer"
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
