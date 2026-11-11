'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Category, Expense, PresetExpense } from '@/lib/types';
import {
  CATEGORIES,
  CATEGORY_CONFIG,
  DEFAULT_PRESETS,
  getTodayDateString,
  roundCurrency,
  formatCurrency,
  PRESETS_STORAGE_KEY,
} from '@/lib/utils';
import {
  Plus,
  Calendar,
  Tag,
  Zap,
  CornerDownLeft,
  CheckCircle2,
  SlidersHorizontal,
  X,
} from 'lucide-react';

interface ExpenseFormProps {
  onAddExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => void;
  onInstantToast?: (message: string) => void;
}

export default function ExpenseForm({
  onAddExpense,
  onInstantToast,
}: ExpenseFormProps) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Category>('Food');
  const [date, setDate] = useState('2026-11-11');
  const [presets, setPresets] = useState<PresetExpense[]>(DEFAULT_PRESETS);
  const [isManagingPresets, setIsManagingPresets] = useState(false);
  const [newPresetLabel, setNewPresetLabel] = useState('');
  const [newPresetAmount, setNewPresetAmount] = useState('');
  const [newPresetCat, setNewPresetCat] = useState<Category>('Food');
  const [justAdded, setJustAdded] = useState(false);

  const descInputRef = useRef<HTMLInputElement>(null);

  // Load custom presets & update date to client local today
  useEffect(() => {
    setDate(getTodayDateString());
    try {
      const stored = localStorage.getItem(PRESETS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPresets(parsed);
        }
      }
    } catch {
      // Ignore fallback
    }
  }, []);

  const savePresets = (newPresets: PresetExpense[]) => {
    setPresets(newPresets);
    try {
      localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(newPresets));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddPreset = (e: React.FormEvent) => {
    e.preventDefault();
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
    const updated = presets.filter((p) => p.id !== id);
    savePresets(updated);
  };

  const handleResetPresets = () => {
    savePresets(DEFAULT_PRESETS);
    setIsManagingPresets(false);
  };

  // Submit main form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!description.trim() || isNaN(parsedAmount) || parsedAmount <= 0) {
      return;
    }

    onAddExpense({
      date: date || getTodayDateString(),
      description: description.trim(),
      category,
      amount: roundCurrency(parsedAmount),
    });

    setDescription('');
    setAmount('');
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);

    // Keep focus for rapid multi-logging
    descInputRef.current?.focus();
  };

  // One-tap quick preset log
  const handlePresetClick = (preset: PresetExpense) => {
    onAddExpense({
      date: getTodayDateString(),
      description: preset.description,
      category: preset.category,
      amount: preset.amount,
    });

    if (onInstantToast) {
      onInstantToast(`Logged ${formatCurrency(preset.amount)} for ${preset.description}`);
    }

    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  };

  return (
    <div className="rounded-xl bg-zinc-900/80 border border-zinc-800 p-3 sm:p-4 shadow-sm backdrop-blur-sm">
      {/* Quick Presets Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>One-Tap Quick Presets</span>
            <span className="text-[10px] text-zinc-500 hidden sm:inline">(Tap to log instantly)</span>
          </div>

          <button
            type="button"
            onClick={() => setIsManagingPresets(!isManagingPresets)}
            className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
          >
            <SlidersHorizontal className="w-3 h-3" />
            <span>{isManagingPresets ? 'Done' : 'Customize'}</span>
          </button>
        </div>

        {/* Preset management popup or drawer */}
        {isManagingPresets && (
          <div className="p-3 mb-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-300">Manage Shortcuts</span>
              <button
                onClick={handleResetPresets}
                className="text-[11px] text-zinc-500 hover:text-zinc-300 underline"
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
                    className="text-zinc-500 hover:text-rose-400 ml-1"
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
                placeholder="₱ Amount"
                value={newPresetAmount}
                onChange={(e) => setNewPresetAmount(e.target.value)}
                className="text-xs bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-100 w-24 focus:outline-none focus:border-zinc-700 font-mono"
              />
              <select
                value={newPresetCat}
                onChange={(e) => setNewPresetCat(e.target.value as Category)}
                className="text-xs bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5 text-zinc-300 focus:outline-none focus:border-zinc-700"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1.5 rounded hover:bg-emerald-500/30 font-medium transition-colors"
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
                onClick={() => handlePresetClick(preset)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-950/70 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/50 text-zinc-300 text-xs font-mono whitespace-nowrap transition-all active:scale-95 cursor-pointer group"
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

      {/* Main Rapid Input Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-2.5">
          {/* Description (Span 5 on Desktop) */}
          <div className="sm:col-span-5 relative">
            <input
              ref={descInputRef}
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What did you spend on? (e.g. Lunch Sisig)"
              className="w-full bg-zinc-950/90 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-600 focus:border-zinc-700 transition-all"
            />
          </div>

          {/* Amount (Span 3 on Desktop) */}
          <div className="sm:col-span-3 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-mono text-sm">
              ₱
            </span>
            <input
              type="number"
              step="any"
              min="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-zinc-950/90 border border-zinc-800 rounded-lg pl-7 pr-3 py-2 text-sm font-mono text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-600 focus:border-zinc-700 transition-all tabular-nums"
            />
          </div>

          {/* Category Dropdown (Span 2 on Desktop) */}
          <div className="sm:col-span-2 relative">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="w-full bg-zinc-950/90 border border-zinc-800 rounded-lg px-2.5 py-2 text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-600 focus:border-zinc-700 transition-all cursor-pointer"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Date Picker (Span 2 on Desktop) */}
          <div className="sm:col-span-2 relative">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-zinc-950/90 border border-zinc-800 rounded-lg px-2 py-2 text-xs sm:text-sm font-mono text-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-600 focus:border-zinc-700 transition-all cursor-pointer"
            />
          </div>
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
                  onClick={() => setCategory(cat)}
                  className={`text-xs px-2.5 py-1 rounded-md transition-all cursor-pointer border ${
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
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 font-medium text-sm transition-all shadow-sm active:scale-98 cursor-pointer disabled:opacity-50"
          >
            {justAdded ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700 font-semibold">Added!</span>
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
