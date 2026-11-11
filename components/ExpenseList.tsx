'use client';

import React, { useState, useMemo } from 'react';
import { Expense, Category } from '@/lib/types';
import {
  CATEGORIES,
  CATEGORY_CONFIG,
  formatCurrency,
  formatRelativeDate,
  roundCurrency,
} from '@/lib/utils';
import {
  Search,
  Filter,
  Trash2,
  Edit3,
  Calendar,
  UtensilsCrossed,
  Car,
  ShoppingBag,
  Film,
  Zap,
  MoreHorizontal,
  ArrowUpDown,
  X,
  AlertTriangle,
  Check,
} from 'lucide-react';

interface ExpenseListProps {
  expenses: Expense[];
  onUpdateExpense: (updated: Expense) => void;
  onDeleteExpense: (id: string) => void;
  selectedMonth: string;
}

export default function ExpenseList({
  expenses,
  onUpdateExpense,
  onDeleteExpense,
  selectedMonth,
}: ExpenseListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');

  // Edit State
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editDesc, setEditDesc] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editCategory, setEditCategory] = useState<Category>('Food');
  const [editDate, setEditDate] = useState('');

  // Delete Confirmation State
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);

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
        return b.date.localeCompare(a.date) || b.createdAt - a.createdAt;
      } else if (sortBy === 'date-asc') {
        return a.date.localeCompare(b.date) || a.createdAt - b.createdAt;
      } else if (sortBy === 'amount-desc') {
        return b.amount - a.amount;
      } else {
        return a.amount - b.amount;
      }
    });
  }, [expenses, selectedMonth, selectedCategory, searchQuery, sortBy]);

  // Group by Date
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
      const subtotal = roundCurrency(
        items.reduce((sum, item) => sum + item.amount, 0)
      );
      groups.push({ date, items, subtotal });
    });

    // Sort date groups descending or ascending based on sortBy
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

  // Start Edit
  const handleStartEdit = (item: Expense) => {
    setEditingExpense(item);
    setEditDesc(item.description);
    setEditAmount(item.amount.toString());
    setEditCategory(item.category);
    setEditDate(item.date);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense) return;
    const parsedAmount = parseFloat(editAmount);
    if (!editDesc.trim() || isNaN(parsedAmount) || parsedAmount <= 0) return;

    onUpdateExpense({
      ...editingExpense,
      description: editDesc.trim(),
      amount: roundCurrency(parsedAmount),
      category: editCategory,
      date: editDate,
    });

    setEditingExpense(null);
  };

  // Confirm Delete
  const handleConfirmDelete = () => {
    if (expenseToDelete) {
      onDeleteExpense(expenseToDelete.id);
      setExpenseToDelete(null);
    }
  };

  return (
    <section className="space-y-4">
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
              placeholder="Search expenses (e.g. Chagee, Sisig, Grab, 40)..."
              className="w-full bg-zinc-950/80 border border-zinc-800 rounded-lg pl-9 pr-8 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
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
                onChange={(e) => setSortBy(e.target.value as any)}
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

      {/* Itemized Ledger */}
      {filteredExpenses.length === 0 ? (
        <div className="rounded-xl bg-zinc-900/30 border border-zinc-800/60 p-10 text-center space-y-2">
          <div className="w-10 h-10 rounded-full bg-zinc-800/60 text-zinc-500 mx-auto flex items-center justify-center">
            <Search className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-medium text-zinc-300">No expenses found</h4>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            {searchQuery || selectedCategory !== 'All'
              ? 'Try adjusting your search query or category filter.'
              : 'No expenses logged for this month yet. Use the quick-add bar above to log your first transaction.'}
          </p>
          {(searchQuery || selectedCategory !== 'All') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
              }}
              className="mt-2 text-xs px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {groupedByDate.map((group) => {
            const { label, subLabel } = formatRelativeDate(group.date);
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
                  </div>
                  <div className="text-xs font-mono font-medium text-zinc-400 tabular-nums">
                    Daily Total: <span className="text-zinc-200 font-semibold">{formatCurrency(group.subtotal)}</span>
                  </div>
                </div>

                {/* List items for this date */}
                <div className="rounded-xl bg-zinc-900/60 border border-zinc-800/80 divide-y divide-zinc-800/60 overflow-hidden shadow-sm">
                  {group.items.map((item) => {
                    const catConfig = CATEGORY_CONFIG[item.category];
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
                            <div className="text-sm font-medium text-zinc-100 truncate group-hover:text-white">
                              {item.description}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                              <span className={`text-[11px] font-medium ${catConfig.textColor}`}>
                                {item.category}
                              </span>
                              <span>·</span>
                              <span className="font-mono text-[11px] text-zinc-500">
                                {new Date(item.createdAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Right: Amount & Actions */}
                        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                          <div className="font-mono font-semibold text-sm sm:text-base text-zinc-100 tabular-nums tracking-tight">
                            {formatCurrency(item.amount)}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleStartEdit(item)}
                              aria-label="Edit expense"
                              className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setExpenseToDelete(item)}
                              aria-label="Delete expense"
                              className="p-1.5 rounded-md hover:bg-rose-500/10 text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
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

      {/* Edit Modal / Drawer */}
      {editingExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-xl bg-zinc-900 border border-zinc-800 p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <h3 className="text-sm font-semibold text-zinc-100">Edit Expense</h3>
              <button
                onClick={() => setEditingExpense(null)}
                className="text-zinc-500 hover:text-zinc-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  required
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    Amount (₱)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    required
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm font-mono text-zinc-100 focus:outline-none focus:border-zinc-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    Category
                  </label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value as Category)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-700"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  required
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm font-mono text-zinc-200 focus:outline-none focus:border-zinc-700"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingExpense(null)}
                  className="px-3.5 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-medium bg-zinc-100 hover:bg-white text-zinc-950 transition-colors shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {expenseToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-xl bg-zinc-900 border border-zinc-800 p-5 shadow-2xl space-y-4">
            <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-5 h-5" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-sm font-semibold text-zinc-100">Delete Expense?</h3>
              <p className="text-xs text-zinc-400">
                Are you sure you want to delete{' '}
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
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="w-1/2 py-2 rounded-lg text-xs font-medium bg-rose-500 hover:bg-rose-600 text-white transition-colors shadow-sm cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

