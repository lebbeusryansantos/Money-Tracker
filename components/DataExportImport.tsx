'use client';

import React, { useState, useRef } from 'react';
import { Expense } from '@/lib/types';
import {
  exportToCSV,
  exportToJSON,
  parseCSV,
  parseJSON,
  formatCurrency,
} from '@/lib/utils';
import { useAuth } from '@/lib/permissions';
import {
  Download,
  Upload,
  RotateCcw,
  Trash2,
  FileSpreadsheet,
  FileCode,
  AlertCircle,
  X,
  AlertTriangle,
  Lock,
} from 'lucide-react';

interface DataExportImportProps {
  expenses: Expense[];
  onImportExpenses: (imported: Expense[], mode: 'merge' | 'replace') => void;
  onResetToDemo: () => void;
  onClearAll: () => void;
  onToast: (msg: string) => void;
}

export default function DataExportImport({
  expenses,
  onImportExpenses,
  onResetToDemo,
  onClearAll,
  onToast,
}: DataExportImportProps) {
  const { canResetData, currentUser } = useAuth();
  const [importPreview, setImportPreview] = useState<{
    items: Expense[];
    fileName: string;
    totalAmount: number;
  } | null>(null);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        let parsed: Expense[] = [];

        if (file.name.endsWith('.csv')) {
          parsed = parseCSV(text);
        } else if (file.name.endsWith('.json')) {
          parsed = parseJSON(text);
        } else {
          throw new Error('Please upload a .csv or .json file.');
        }

        const totalAmount = parsed.reduce((sum, item) => sum + item.amount, 0);
        setImportPreview({
          items: parsed,
          fileName: file.name,
          totalAmount,
        });
      } catch (err: any) {
        setErrorMessage(err?.message || 'Failed to parse file.');
      }
    };

    reader.onerror = () => {
      setErrorMessage('Failed to read file from disk.');
    };

    reader.readAsText(file);
    e.target.value = '';
  };

  const handleApplyImport = () => {
    if (!importPreview) return;
    onImportExpenses(importPreview.items, importMode);
    onToast(
      `Successfully ${importMode === 'merge' ? 'merged' : 'imported'} ${importPreview.items.length} expenses!`
    );
    setImportPreview(null);
  };

  const handlePromptReset = () => {
    if (!canResetData()) {
      onToast('Permission Denied: Only Admin role can reset system seed data.');
      return;
    }
    setShowResetConfirm(true);
  };

  const handlePromptClear = () => {
    if (!canResetData()) {
      onToast('Permission Denied: Only Admin role can wipe database.');
      return;
    }
    setShowClearConfirm(true);
  };

  return (
    <div className="rounded-xl bg-zinc-900/60 border border-zinc-800/80 p-4 shadow-sm space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Download className="w-4 h-4 text-zinc-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
            Data Management &amp; Portability
          </h3>
        </div>
        <span className="text-xs text-zinc-500 font-mono">Zero Cloud • 100% Local</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {/* Export CSV */}
        <button
          onClick={() => {
            exportToCSV(expenses);
            onToast('Exported expenses to CSV');
          }}
          className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-zinc-950/70 border border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-800/40 text-xs font-medium text-zinc-300 transition-colors cursor-pointer"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
          <span>Export CSV</span>
        </button>

        {/* Export JSON */}
        <button
          onClick={() => {
            exportToJSON(expenses);
            onToast('Exported backup JSON');
          }}
          className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-zinc-950/70 border border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-800/40 text-xs font-medium text-zinc-300 transition-colors cursor-pointer"
        >
          <FileCode className="w-3.5 h-3.5 text-sky-400" />
          <span>Export JSON</span>
        </button>

        {/* Import Trigger */}
        <button
          onClick={() => {
            setErrorMessage(null);
            setImportPreview(null);
            fileInputRef.current?.click();
          }}
          className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-zinc-950/70 border border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-800/40 text-xs font-medium text-zinc-300 transition-colors cursor-pointer"
        >
          <Upload className="w-3.5 h-3.5 text-violet-400" />
          <span>Import CSV/JSON</span>
        </button>

        {/* Reset to Demo */}
        <button
          onClick={handlePromptReset}
          className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-zinc-950/70 border border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-800/40 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
          <span>Sample Data</span>
        </button>
      </div>

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".csv,.json,text/csv,application/json"
        className="hidden"
      />

      {/* Error Message */}
      {errorMessage && (
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-rose-200 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Import Preview Modal */}
      {importPreview && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
        >
          <div className="w-full max-w-md rounded-xl bg-zinc-900 border border-zinc-800 p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-violet-400" />
                <h3 className="text-sm font-semibold text-zinc-100">Confirm Data Import</h3>
              </div>
              <button
                onClick={() => setImportPreview(null)}
                className="text-zinc-500 hover:text-zinc-300 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-zinc-300">
              <div className="flex justify-between py-1 border-b border-zinc-800/60">
                <span className="text-zinc-500">File Name:</span>
                <span className="font-mono text-zinc-200 truncate max-w-[200px]">
                  {importPreview.fileName}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800/60">
                <span className="text-zinc-500">Valid Expenses Found:</span>
                <span className="font-mono font-semibold text-zinc-200">
                  {importPreview.items.length} items
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800/60">
                <span className="text-zinc-500">Total Sum:</span>
                <span className="font-mono font-semibold text-emerald-400">
                  {formatCurrency(importPreview.totalAmount)}
                </span>
              </div>
            </div>

            {/* Mode selection */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-medium text-zinc-400 block">Import Action</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setImportMode('merge')}
                  className={`p-2.5 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                    importMode === 'merge'
                      ? 'bg-zinc-800 border-zinc-600 text-zinc-100'
                      : 'bg-zinc-950/60 border-zinc-800 text-zinc-400'
                  }`}
                >
                  <div className="font-medium text-zinc-200">Merge Data</div>
                  <div className="text-[10px] text-zinc-500">Add to existing list</div>
                </button>
                <button
                  type="button"
                  onClick={() => setImportMode('replace')}
                  className={`p-2.5 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                    importMode === 'replace'
                      ? 'bg-zinc-800 border-zinc-600 text-zinc-100'
                      : 'bg-zinc-950/60 border-zinc-800 text-zinc-400'
                  }`}
                >
                  <div className="font-medium text-zinc-200">Replace All</div>
                  <div className="text-[10px] text-zinc-500">Overwrite current data</div>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setImportPreview(null)}
                className="px-3.5 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyImport}
                className="px-4 py-2 rounded-lg text-xs font-medium bg-emerald-500 hover:bg-emerald-400 text-zinc-950 transition-colors shadow-sm cursor-pointer"
              >
                Apply Import
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Accessible Confirmation Dialog for Resetting to Demo */}
      {showResetConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
        >
          <div className="w-full max-w-sm rounded-xl bg-zinc-900 border border-zinc-800 p-5 shadow-2xl space-y-4 text-center">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-zinc-100">Reset to November 2026 Sample Data?</h3>
              <p className="text-xs text-zinc-400">
                This will restore the 20 official November 2026 transactions from your Google Sheet ledger. Any custom additions will be overwritten.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="w-1/2 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onResetToDemo();
                  setShowResetConfirm(false);
                  onToast('Dataset reset to official Google Sheet ledger');
                }}
                className="w-1/2 py-2 rounded-lg text-xs font-medium bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold transition-colors shadow-sm cursor-pointer"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Accessible Confirmation Dialog for Clearing All Data */}
      {showClearConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
        >
          <div className="w-full max-w-sm rounded-xl bg-zinc-900 border border-zinc-800 p-5 shadow-2xl space-y-4 text-center">
            <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-zinc-100">Clear All Expense Data?</h3>
              <p className="text-xs text-zinc-400">
                This will wipe all {expenses.length} logged expenses from your browser&apos;s localStorage. We recommend exporting a CSV or JSON backup first.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="w-1/2 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onClearAll();
                  setShowClearConfirm(false);
                  onToast('All expenses cleared');
                }}
                className="w-1/2 py-2 rounded-lg text-xs font-medium bg-rose-500 hover:bg-rose-600 text-white transition-colors shadow-sm cursor-pointer"
              >
                Confirm Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom subtle actions */}
      <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1">
        <span>Stored securely in browser `localStorage`</span>
        <button
          onClick={handlePromptClear}
          className="text-zinc-500 hover:text-rose-400 transition-colors underline cursor-pointer"
        >
          Wipe database
        </button>
      </div>
    </div>
  );
}
