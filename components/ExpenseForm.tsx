'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Category, Expense, PresetExpense } from '@/lib/types';
import {
  CATEGORIES,
  CATEGORY_CONFIG,
  DEFAULT_PRESETS,
  roundCurrency,
  formatCurrency,
  PRESETS_STORAGE_KEY,
} from '@/lib/utils';
import {
  validateExpenseForm,
  blockInvalidAmountKeys,
  MAX_DESCRIPTION_LENGTH,
  MIN_DESCRIPTION_LENGTH,
  MAX_SINGLE_EXPENSE_AMOUNT,
} from '@/lib/validation';
import {
  getClientTodayDateISO,
  getMillisecondsUntilMidnight,
  isTimeFeatureEnabled,
  getCurrentTimeHHMM,
  isDecemberOnwards,
} from '@/lib/dateUtils';
import {
  Plus,
  Zap,
  CheckCircle2,
  SlidersHorizontal,
  X,
  AlertCircle,
  Lock,
} from 'lucide-react';

interface ExpenseFormProps {
  onAddExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => void;
  onInstantToast?: (message: string) => void;
  currentDateISO?: string;
  selectedMonth?: string;
}

export default function ExpenseForm({
  onAddExpense,
  onInstantToast,
  currentDateISO,
  selectedMonth = '2026-11',
}: ExpenseFormProps) {
  const isMonthLocked = isDecemberOnwards(selectedMonth);
  const activeDate = currentDateISO || '2026-11-12';

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Category>('Food');
  const [date, setDate] = useState<string>(currentDateISO || '2026-11-12');
  const [time, setTime] = useState<string>('12:00');
  const [presets, setPresets] = useState<PresetExpense[]>(() => {
    if (typeof window === 'undefined') return DEFAULT_PRESETS;
    try {
      const stored = localStorage.getItem(PRESETS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Fallback
    }
    return DEFAULT_PRESETS;
  });
  const [isManagingPresets, setIsManagingPresets] = useState(false);
  const [newPresetLabel, setNewPresetLabel] = useState('');
  const [newPresetAmount, setNewPresetAmount] = useState('');
  const [newPresetCat, setNewPresetCat] = useState<Category>('Food');
  const [justAdded, setJustAdded] = useState(false);

  // Field touch states for inline error display
  const [touched, setTouched] = useState<{
    description: boolean;
    amount: boolean;
    date: boolean;
    time: boolean;
  }>({
    description: false,
    amount: false,
    date: false,
    time: false,
  });

  const descInputRef = useRef<HTMLInputElement>(null);
  const timeActive = isTimeFeatureEnabled(date);

  // Synchronize client date on mount and schedule automatic midnight rollover
  useEffect(() => {
    // Schedule rollover across midnight
    let timerId: NodeJS.Timeout;
    const scheduleMidnightRollover = () => {
      const ms = getMillisecondsUntilMidnight();
      timerId = setTimeout(() => {
        const newToday = getClientTodayDateISO();
        setDate(newToday);
        setTime(getCurrentTimeHHMM());
        scheduleMidnightRollover();
      }, ms);
    };

    scheduleMidnightRollover();
    return () => clearTimeout(timerId);
  }, []);

  const savePresets = (newPresets: PresetExpense[]) => {
    setPresets(newPresets);
    try {
      localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(newPresets));
    } catch (err) {
      console.error(err);
    }
  };

  // Real-time validation computation (capped at 2026-11-30)
  const validation = useMemo(() => {
    const effectiveMaxDate = activeDate < '2026-11-30' ? activeDate : '2026-11-30';
    return validateExpenseForm(
      {
        description,
        amount,
        category,
        date,
        time: timeActive ? time : undefined,
      },
      effectiveMaxDate
    );
  }, [description, amount, category, date, time, timeActive, activeDate]);

  const trimmedDescLen = description.trim().length;

  const handleAddPreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (isMonthLocked) return;
    const parsedAmount = parseFloat(newPresetAmount);
    if (!newPresetLabel.trim() || isNaN(parsedAmount) || parsedAmount <= 0) return;

    const newPreset: PresetExpense = {
      id: `preset-${Date.now()}`,
      label: `+₱${parsedAmount} ${newPresetLabel.trim()}`,
      description: newPresetLabel.trim(),
      category: newPresetCat,
      amount: roundCurrency(parsedAmount),
    };

    const updated = [...presets, newPreset];
    savePresets(updated);
    setNewPresetLabel('');
    setNewPresetAmount('');
  };

  const handleDeletePreset = (id: string) => {
    if (isMonthLocked) return;
    const updated = presets.filter((p) => p.id !== id);
    savePresets(updated);
  };

  const handleResetPresets = () => {
    if (isMonthLocked) return;
    savePresets(DEFAULT_PRESETS);
    setIsManagingPresets(false);
  };

  // Submit main form with strict validation and December lock check
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isMonthLocked || isDecemberOnwards(date)) {
      if (onInstantToast) {
        onInstantToast('December 2026 onwards is strictly locked. No logging permitted.');
      }
      return;
    }

    setTouched({ description: true, amount: true, date: true, time: true });

    if (!validation.isValid) {
      return;
    }

    onAddExpense({
      date: date || activeDate,
      time: timeActive ? (time || getCurrentTimeHHMM()) : undefined,
      description: validation.sanitizedDescription,
      category,
      amount: validation.parsedAmount,
    });

    if (onInstantToast) {
      onInstantToast(`Expense logged (${formatCurrency(validation.parsedAmount)})`);
    }

    setDescription('');
    setAmount('');
    setTouched({ description: false, amount: false, date: false, time: false });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);

    descInputRef.current?.focus();
  };

  // One-tap quick preset log
  const handlePresetClick = (preset: PresetExpense) => {
    if (isMonthLocked) {
      if (onInstantToast) {
        onInstantToast('December 2026 onwards is strictly locked. Button access disabled.');
      }
      return;
    }

    onAddExpense({
      date: activeDate,
      time: isTimeFeatureEnabled(activeDate) ? getCurrentTimeHHMM() : undefined,
      description: preset.description,
      category: preset.category,
      amount: preset.amount,
    });

    if (onInstantToast) {
      onInstantToast(`Logged ${formatCurrency(preset.amount)} for "${preset.description}"`);
    }

    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  };

  return (
    <div className={`rounded-xl border p-3 sm:p-4 shadow-sm backdrop-blur-sm transition-all ${
      isMonthLocked
        ? 'bg-zinc-950/80 border-amber-500/20 opacity-70'
        : 'bg-zinc-900/80 border-zinc-800'
    }`}>
      {/* December 2026 Strict Lockdown Notice */}
      {isMonthLocked && (
        <div className="mb-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center gap-2 text-xs text-amber-300">
          <Lock className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="font-medium">
            December 2026 onwards is strictly locked. You are not allowed to type anything or access any buttons in this period.
          </span>
        </div>
      )}

      {/* Quick Presets Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>One-Tap Quick Presets</span>
            <span className="text-[10px] text-zinc-500 hidden sm:inline">(Tap to log instantly)</span>
          </div>

          {!isMonthLocked && (
            <button
              type="button"
              onClick={() => setIsManagingPresets(!isManagingPresets)}
              className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
            >
              <SlidersHorizontal className="w-3 h-3" />
              <span>{isManagingPresets ? 'Done' : 'Customize'}</span>
            </button>
          )}
        </div>

        {/* Preset management drawer */}
        {!isMonthLocked && isManagingPresets && (
          <div className="p-3 mb-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-300">Manage Shortcuts</span>
              <button
                onClick={handleResetPresets}
                className="text-[11px] text-zinc-500 hover:text-zinc-300 underline cursor-pointer"
              >
                Reset to default
              </button>
            </div>

            {/* Existing presets pills with delete */}
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
              {presets.map((p) => (
                <span
                  key={p.id}
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300"
                >
                  {p.label}
                  <button
                    onClick={() => handleDeletePreset(p.id)}
                    className="text-zinc-500 hover:text-rose-400 ml-1 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            {/* Add new preset form */}
            <form onSubmit={handleAddPreset} className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-800/80">
              <input
                type="text"
                placeholder="Name (e.g. Tricycle)"
                value={newPresetLabel}
                onChange={(e) => setNewPresetLabel(e.target.value)}
                className="text-xs bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-100 flex-1 min-w-[120px] focus:outline-none focus:border-zinc-700"
              />
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="₱ Amount"
                value={newPresetAmount}
                onKeyDown={blockInvalidAmountKeys}
                onChange={(e) => setNewPresetAmount(e.target.value)}
                className="text-xs bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-100 w-24 focus:outline-none focus:border-zinc-700 font-mono"
              />
              <select
                value={newPresetCat}
                onChange={(e) => setNewPresetCat(e.target.value as Category)}
                className="text-xs bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5 text-zinc-300 focus:outline-none focus:border-zinc-700 cursor-pointer"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1.5 rounded hover:bg-emerald-500/30 font-medium transition-colors cursor-pointer"
              >
                + Add Preset
              </button>
            </form>
          </div>
        )}

        {/* Presets Horizontal Scrollable Carousel */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {presets.map((preset) => {
            const config = CATEGORY_CONFIG[preset.category];
            return (
              <button
                key={preset.id}
                type="button"
                disabled={isMonthLocked}
                onClick={() => handlePresetClick(preset)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-950/70 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/50 text-zinc-300 text-xs font-mono whitespace-nowrap transition-all active:scale-95 cursor-pointer group disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: config.accentHex }}
                />
                <span className="font-sans text-zinc-200 group-hover:text-white">
                  {preset.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Rapid Input Form with Strict Field Validation */}
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Line 1: Description & Amount */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-2.5 items-start">
          {/* Description */}
          <div className="sm:col-span-7">
            <div className="relative">
              <input
                ref={descInputRef}
                type="text"
                required
                disabled={isMonthLocked}
                maxLength={MAX_DESCRIPTION_LENGTH}
                value={description}
                onBlur={() => setTouched((p) => ({ ...p, description: true }))}
                onChange={(e) => {
                  setDescription(e.target.value);
                  setTouched((p) => ({ ...p, description: true }));
                }}
                placeholder={isMonthLocked ? 'Locked (no typing allowed)' : 'What did you spend on? (min 3 chars)'}
                className={`w-full bg-zinc-950/90 border rounded-lg px-3 py-2 pr-14 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  touched.description && validation.errors.description
                    ? 'border-rose-500/80 focus:ring-1 focus:ring-rose-500'
                    : 'border-zinc-800 focus:ring-1 focus:ring-zinc-600 focus:border-zinc-700'
                }`}
              />
              <span
                className={`absolute right-2.5 top-2.5 text-[10px] font-mono select-none ${
                  trimmedDescLen > 0 && trimmedDescLen < MIN_DESCRIPTION_LENGTH
                    ? 'text-rose-400 font-semibold'
                    : trimmedDescLen >= MAX_DESCRIPTION_LENGTH - 5
                    ? 'text-amber-400 font-semibold'
                    : 'text-zinc-500'
                }`}
              >
                {trimmedDescLen}/{MAX_DESCRIPTION_LENGTH}
              </span>
            </div>

            {touched.description && validation.errors.description && (
              <div className="flex items-center gap-1 text-rose-400 text-xs mt-1 animate-in fade-in">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{validation.errors.description}</span>
              </div>
            )}
          </div>

          {/* Amount */}
          <div className="sm:col-span-5">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-mono text-sm select-none">
                ₱
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={MAX_SINGLE_EXPENSE_AMOUNT}
                required
                disabled={isMonthLocked}
                value={amount}
                onKeyDown={blockInvalidAmountKeys}
                onBlur={() => setTouched((p) => ({ ...p, amount: true }))}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setTouched((p) => ({ ...p, amount: true }));
                }}
                placeholder="0.00"
                className={`w-full bg-zinc-950/90 border rounded-lg pl-7 pr-3 py-2 text-sm font-mono text-zinc-100 placeholder:text-zinc-500 focus:outline-none transition-all tabular-nums disabled:opacity-50 disabled:cursor-not-allowed ${
                  touched.amount && validation.errors.amount
                    ? 'border-rose-500/80 focus:ring-1 focus:ring-rose-500'
                    : 'border-zinc-800 focus:ring-1 focus:ring-zinc-600 focus:border-zinc-700'
                }`}
              />
            </div>

            {touched.amount && validation.errors.amount && (
              <div className="flex items-center gap-1 text-rose-400 text-xs mt-1 animate-in fade-in">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{validation.errors.amount}</span>
              </div>
            )}
          </div>
        </div>

        {/* Line 2: Category, Date & Time */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-2.5 items-start">
          {/* Category Dropdown */}
          <div className={timeActive ? 'sm:col-span-4' : 'sm:col-span-6'}>
            <select
              value={category}
              disabled={isMonthLocked}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="w-full bg-zinc-950/90 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-600 focus:border-zinc-700 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Date Picker (Strict max of 2026-11-30) */}
          <div className={timeActive ? 'sm:col-span-4' : 'sm:col-span-6'}>
            <input
              type="date"
              max="2026-11-30"
              disabled={isMonthLocked}
              value={date}
              onBlur={() => setTouched((p) => ({ ...p, date: true }))}
              onChange={(e) => {
                setDate(e.target.value);
                setTouched((p) => ({ ...p, date: true }));
              }}
              className={`w-full bg-zinc-950/90 border rounded-lg px-3 py-2 text-sm font-mono text-zinc-300 focus:outline-none transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                touched.date && validation.errors.date
                  ? 'border-rose-500/80 focus:ring-1 focus:ring-rose-500'
                  : 'border-zinc-800 focus:ring-1 focus:ring-zinc-600 focus:border-zinc-700'
              }`}
            />
            {touched.date && validation.errors.date && (
              <div className="flex items-center gap-1 text-rose-400 text-xs mt-1 animate-in fade-in">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{validation.errors.date}</span>
              </div>
            )}
          </div>

          {/* Timing Input: Only active on November 12 onwards */}
          {timeActive && (
            <div className="sm:col-span-4">
              <input
                type="time"
                disabled={isMonthLocked}
                value={time}
                title="Time of expense"
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-zinc-950/90 border border-zinc-800 rounded-lg px-3 py-2 text-sm font-mono text-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-600 focus:border-zinc-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          )}
        </div>

        {/* Category Pills & Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          {/* Quick Category Selector Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-zinc-500 hidden sm:inline mr-1">
              Category:
            </span>
            {CATEGORIES.map((cat) => {
              const config = CATEGORY_CONFIG[cat];
              const isSelected = category === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  disabled={isMonthLocked}
                  onClick={() => setCategory(cat)}
                  className={`text-xs px-2.5 py-1 rounded-md transition-all cursor-pointer border disabled:opacity-40 disabled:cursor-not-allowed ${
                    isSelected
                      ? `${config.color} border-current font-medium shadow-sm`
                      : 'bg-zinc-950/50 border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!validation.isValid || isMonthLocked}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 font-medium text-sm transition-all shadow-sm active:scale-98 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-zinc-100"
          >
            {justAdded ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700 font-semibold">Added!</span>
              </>
            ) : isMonthLocked ? (
              <>
                <Lock className="w-4 h-4 text-zinc-500" />
                <span>Locked</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Log Expense</span>
                <span className="text-xs text-zinc-500 font-mono hidden md:inline ml-1">
                  ↵
                </span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
