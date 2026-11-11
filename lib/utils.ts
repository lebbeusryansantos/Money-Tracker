import { Category, Expense, PresetExpense, WeeklySubtotal, CategorySummary, MonthSummary } from './types';

export const CATEGORIES: Category[] = [
  'Food',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Utilities',
  'Other',
];

export const CATEGORY_CONFIG: Record<
  Category,
  {
    label: string;
    color: string;
    textColor: string;
    badgeBg: string;
    border: string;
    accentHex: string;
  }
> = {
  Food: {
    label: 'Food & Dining',
    color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    textColor: 'text-emerald-400',
    badgeBg: 'bg-emerald-500/15',
    border: 'border-emerald-500/30',
    accentHex: '#10b981',
  },
  Transportation: {
    label: 'Transportation',
    color: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    textColor: 'text-sky-400',
    badgeBg: 'bg-sky-500/15',
    border: 'border-sky-500/30',
    accentHex: '#38bdf8',
  },
  Shopping: {
    label: 'Shopping',
    color: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    textColor: 'text-violet-400',
    badgeBg: 'bg-violet-500/15',
    border: 'border-violet-500/30',
    accentHex: '#a78bfa',
  },
  Entertainment: {
    label: 'Entertainment',
    color: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
    textColor: 'text-pink-400',
    badgeBg: 'bg-pink-500/15',
    border: 'border-pink-500/30',
    accentHex: '#f472b6',
  },
  Utilities: {
    label: 'Bills & Utilities',
    color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    textColor: 'text-amber-400',
    badgeBg: 'bg-amber-500/15',
    border: 'border-amber-500/30',
    accentHex: '#fbbf24',
  },
  Other: {
    label: 'Other & Misc',
    color: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
    textColor: 'text-zinc-400',
    badgeBg: 'bg-zinc-500/15',
    border: 'border-zinc-500/30',
    accentHex: '#a1a1aa',
  },
};

export const DEFAULT_PRESETS: PresetExpense[] = [
  { id: 'preset-1', label: '+₱40 Tricycle', description: 'Tricycle fare', category: 'Transportation', amount: 40 },
  { id: 'preset-2', label: '+₱80 Lunch', description: 'Quick Lunch meal', category: 'Food', amount: 80 },
  { id: 'preset-3', label: '+₱150 Grab', description: 'Grab ride', category: 'Transportation', amount: 150 },
  { id: 'preset-4', label: '+₱180 Chagee', description: 'Chagee Milk Tea', category: 'Food', amount: 180 },
  { id: 'preset-5', label: '+₱25 Jeepney', description: 'Jeepney fare', category: 'Transportation', amount: 25 },
  { id: 'preset-6', label: '+₱350 Groceries', description: 'Pantry essentials', category: 'Shopping', amount: 350 },
];

export const INITIAL_MOCK_DATA: Expense[] = [
  {
    id: 'sheet-01',
    date: '2026-11-02',
    description: 'COC Pass',
    category: 'Entertainment',
    amount: 219.0,
    createdAt: 1793613600000,
    userId: 'usr-admin-1',
    order: 1,
  },
  {
    id: 'sheet-02',
    date: '2026-11-04',
    description: 'Tricycle',
    category: 'Transportation',
    amount: 40.0,
    createdAt: 1793786400000,
    userId: 'usr-admin-1',
    order: 2,
  },
  {
    id: 'sheet-03',
    date: '2026-11-04',
    description: 'Chagee',
    category: 'Food',
    amount: 180.0,
    createdAt: 1793790000000,
    userId: 'usr-admin-1',
    order: 3,
  },
  {
    id: 'sheet-04',
    date: '2026-11-04',
    description: 'Tricycle',
    category: 'Transportation',
    amount: 40.0,
    createdAt: 1793793600000,
    userId: 'usr-admin-1',
    order: 4,
  },
  {
    id: 'sheet-05',
    date: '2026-11-04',
    description: 'Lunch',
    category: 'Food',
    amount: 80.0,
    createdAt: 1793797200000,
    userId: 'usr-admin-1',
    order: 5,
  },
  {
    id: 'sheet-06',
    date: '2026-11-04',
    description: 'Tricycle',
    category: 'Transportation',
    amount: 40.0,
    createdAt: 1793800800000,
    userId: 'usr-admin-1',
    order: 6,
  },
  {
    id: 'sheet-07',
    date: '2026-11-07',
    description: 'Photocard (Zel)',
    category: 'Shopping',
    amount: 354.0,
    createdAt: 1794045600000,
    userId: 'usr-admin-1',
    order: 7,
  },
  {
    id: 'sheet-08',
    date: '2026-11-09',
    description: 'Takoyaki',
    category: 'Transportation',
    amount: 60.0,
    createdAt: 1794218400000,
    userId: 'usr-admin-1',
    order: 8,
  },
  {
    id: 'sheet-09',
    date: '2026-11-09',
    description: 'Jamaican',
    category: 'Food',
    amount: 85.0,
    createdAt: 1794222000000,
    userId: 'usr-admin-1',
    order: 9,
  },
  {
    id: 'sheet-10',
    date: '2026-11-09',
    description: 'Mango Juice',
    category: 'Food',
    amount: 85.0,
    createdAt: 1794225600000,
    userId: 'usr-admin-1',
    order: 10,
  },
  {
    id: 'sheet-11',
    date: '2026-11-09',
    description: 'Lunch',
    category: 'Food',
    amount: 80.0,
    createdAt: 1794229200000,
    userId: 'usr-admin-1',
    order: 11,
  },
  {
    id: 'sheet-12',
    date: '2026-11-09',
    description: 'Tricycle',
    category: 'Transportation',
    amount: 40.0,
    createdAt: 1794232800000,
    userId: 'usr-admin-1',
    order: 12,
  },
  {
    id: 'sheet-13',
    date: '2026-11-10',
    description: 'Photocard (Twitzy)',
    category: 'Shopping',
    amount: 112.0,
    createdAt: 1794304800000,
    userId: 'usr-admin-1',
    order: 13,
  },
  {
    id: 'sheet-14',
    date: '2026-11-11',
    description: 'Grab',
    category: 'Utilities',
    amount: 80.0,
    createdAt: 1794391200000,
    userId: 'usr-admin-1',
    order: 14,
  },
  {
    id: 'sheet-15',
    date: '2026-11-11',
    description: 'Pancit Canton',
    category: 'Food',
    amount: 40.0,
    createdAt: 1794394800000,
    userId: 'usr-admin-1',
    order: 15,
  },
  {
    id: 'sheet-16',
    date: '2026-11-11',
    description: 'Grab',
    category: 'Transportation',
    amount: 154.0,
    createdAt: 1794398400000,
    userId: 'usr-admin-1',
    order: 16,
  },
  {
    id: 'sheet-17',
    date: '2026-11-11',
    description: 'Photocard (Yuna)',
    category: 'Shopping',
    amount: 160.0,
    createdAt: 1794402000000,
    userId: 'usr-admin-1',
    order: 17,
  },
  {
    id: 'sheet-18',
    date: '2026-11-11',
    description: 'Lunch',
    category: 'Food',
    amount: 346.48,
    createdAt: 1794405600000,
    userId: 'usr-admin-1',
    order: 18,
  },
  {
    id: 'sheet-19',
    date: '2026-11-11',
    description: 'Grab',
    category: 'Transportation',
    amount: 149.0,
    createdAt: 1794409200000,
    userId: 'usr-admin-1',
    order: 19,
  },
  {
    id: 'sheet-20',
    date: '2026-11-11',
    description: 'Tricycle',
    category: 'Transportation',
    amount: 150.0,
    createdAt: 1794412800000,
    userId: 'usr-admin-1',
    order: 20,
  },
];

/**
 * Ensures floating-point precision rounding
 */
export function roundCurrency(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

/**
 * Standard Philippine Peso formatting: ₱X,XXX.XX
 */
export function formatCurrency(amount: number): string {
  const rounded = roundCurrency(amount);
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rounded);
}

/**
 * Compact currency formatting (e.g. ₱1.2k, ₱45k)
 */
export function formatCompactCurrency(amount: number): string {
  if (Math.abs(amount) < 1000) {
    return formatCurrency(amount);
  }
  const rounded = roundCurrency(amount);
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(rounded);
}

/**
 * Returns today's ISO date string (YYYY-MM-DD) based on local time
 */
export function getTodayDateString(): string {
  if (typeof window === 'undefined') {
    return '2026-11-11';
  }
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats YYYY-MM-DD to a human readable string like "Nov 11, 2026"
 */
export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Formats a date relative to today (e.g. "Today", "Yesterday", or "Wed, Nov 11")
 */
export function formatRelativeDate(dateStr: string): { label: string; subLabel: string } {
  const today = getTodayDateString();
  const [ty, tm, td] = today.split('-').map(Number);
  const todayDate = new Date(ty, tm - 1, td);

  const [y, m, d] = dateStr.split('-').map(Number);
  const targetDate = new Date(y, m - 1, d);

  const diffTime = todayDate.getTime() - targetDate.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  const dayOfWeek = targetDate.toLocaleDateString('en-US', { weekday: 'short' });
  const formatted = targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  if (diffDays === 0) {
    return { label: 'Today', subLabel: `${dayOfWeek}, ${formatted}` };
  } else if (diffDays === 1) {
    return { label: 'Yesterday', subLabel: `${dayOfWeek}, ${formatted}` };
  } else {
    return { label: `${dayOfWeek}, ${targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`, subLabel: String(y) };
  }
}

/**
 * Gets the month key (YYYY-MM) from an ISO date string
 */
export function getMonthKey(dateStr: string): string {
  return dateStr.slice(0, 7);
}

/**
 * Returns formatted month label e.g. "November 2026"
 */
export function formatMonthKey(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/**
 * Returns the number of days in a given month (YYYY-MM)
 */
export function getDaysInMonth(monthKey: string): number {
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(year, month, 0).getDate();
}

/**
 * Returns dynamic Monday-to-Sunday weekly intervals for a given month (YYYY-MM)
 */
export function getMonthWeeks(monthKey: string): {
  weekIndex: number;
  startDate: string;
  endDate: string;
  dateRange: string;
}[] {
  const [year, month] = monthKey.split('-').map(Number);
  const totalDays = new Date(year, month, 0).getDate();
  const weeks = [];

  let currentStart = 1;
  let weekIndex = 1;

  while (currentStart <= totalDays) {
    const startDateObj = new Date(year, month - 1, currentStart);
    // Day of week: 0 = Sun, 1 = Mon, ..., 6 = Sat
    const dayOfWeek = startDateObj.getDay();
    // Monday-based week: distance to upcoming Sunday (0)
    // If dayOfWeek is Sunday (0), distance to Sunday is 0 days
    // If dayOfWeek is Monday (1), distance to Sunday is 6 days
    const daysUntilSunday = (7 - dayOfWeek) % 7;
    const currentEnd = Math.min(currentStart + daysUntilSunday, totalDays);

    const startStr = `${year}-${String(month).padStart(2, '0')}-${String(currentStart).padStart(2, '0')}`;
    const endStr = `${year}-${String(month).padStart(2, '0')}-${String(currentEnd).padStart(2, '0')}`;

    const startObj = new Date(year, month - 1, currentStart);
    const endObj = new Date(year, month - 1, currentEnd);

    const startMonth = startObj.toLocaleDateString('en-US', { month: 'short' });
    const endMonth = endObj.toLocaleDateString('en-US', { month: 'short' });

    let dateRange = '';
    if (startMonth === endMonth) {
      dateRange = `${startMonth} ${currentStart} – ${currentEnd}`;
    } else {
      dateRange = `${startMonth} ${currentStart} – ${endMonth} ${currentEnd}`;
    }

    weeks.push({
      weekIndex,
      startDate: startStr,
      endDate: endStr,
      dateRange,
    });

    currentStart = currentEnd + 1;
    weekIndex++;
  }

  return weeks;
}

/**
 * Aggregates all expenses for a specified month
 */
export function calculateMonthSummary(expenses: Expense[], monthKey: string): MonthSummary {
  const monthExpenses = expenses.filter((e) => e.date.startsWith(monthKey));
  const todayStr = getTodayDateString();

  // Monthly total
  let totalRaw = 0;
  let todayTotalRaw = 0;
  const activeDaysSet = new Set<string>();
  const categoryTotals: Record<Category, { total: number; count: number }> = {
    Food: { total: 0, count: 0 },
    Transportation: { total: 0, count: 0 },
    Shopping: { total: 0, count: 0 },
    Entertainment: { total: 0, count: 0 },
    Utilities: { total: 0, count: 0 },
    Other: { total: 0, count: 0 },
  };

  for (const exp of monthExpenses) {
    totalRaw += exp.amount;
    activeDaysSet.add(exp.date);

    if (exp.date === todayStr) {
      todayTotalRaw += exp.amount;
    }

    if (categoryTotals[exp.category]) {
      categoryTotals[exp.category].total += exp.amount;
      categoryTotals[exp.category].count += 1;
    }
  }

  const total = roundCurrency(totalRaw);
  const todayTotal = roundCurrency(todayTotalRaw);
  const activeDaysCount = activeDaysSet.size;

  // Days elapsed in the month
  const totalDaysInMonth = getDaysInMonth(monthKey);
  const currentMonthKey = getMonthKey(todayStr);

  let daysElapsed = totalDaysInMonth;
  if (monthKey === currentMonthKey) {
    const todayDay = parseInt(todayStr.split('-')[2], 10);
    daysElapsed = Math.min(todayDay, totalDaysInMonth);
  } else if (monthKey > currentMonthKey) {
    daysElapsed = 0;
  }

  // Average Daily Spend: Total spent in active month / number of days with logged transactions
  // Fallback to days elapsed if no transactions
  const divisor = activeDaysCount > 0 ? activeDaysCount : Math.max(1, daysElapsed);
  const dailyAverage = roundCurrency(total / divisor);

  // Weekly subtotals calculation
  const calendarWeeks = getMonthWeeks(monthKey);
  const weeklySubtotals: WeeklySubtotal[] = calendarWeeks.map((w) => {
    const weekExpenses = monthExpenses.filter(
      (e) => e.date >= w.startDate && e.date <= w.endDate
    );
    const weekSum = weekExpenses.reduce((acc, curr) => acc + curr.amount, 0);
    const roundedWeekTotal = roundCurrency(weekSum);
    const percentage = total > 0 ? roundCurrency((roundedWeekTotal / total) * 100) : 0;

    return {
      weekIndex: w.weekIndex,
      label: `Week ${w.weekIndex}`,
      dateRange: w.dateRange,
      startDate: w.startDate,
      endDate: w.endDate,
      total: roundedWeekTotal,
      count: weekExpenses.length,
      percentageOfMonthly: percentage,
    };
  });

  // Category breakdown
  const categoryBreakdown: CategorySummary[] = CATEGORIES.map((cat) => {
    const info = categoryTotals[cat];
    const catTotal = roundCurrency(info.total);
    const percentage = total > 0 ? roundCurrency((catTotal / total) * 100) : 0;
    return {
      category: cat,
      total: catTotal,
      count: info.count,
      percentage,
    };
  }).sort((a, b) => b.total - a.total);

  const isFuture = monthKey > currentMonthKey;
  const isLocked = isFuture;

  return {
    monthKey,
    label: formatMonthKey(monthKey),
    total,
    todayTotal,
    dailyAverage,
    activeDaysCount,
    daysElapsed,
    totalDaysInMonth,
    weeklySubtotals,
    categoryBreakdown,
    expenseCount: monthExpenses.length,
    isLocked,
    isFuture,
  };
}

/**
 * Exports expenses to CSV format: Date,Description,Category,Amount
 */
export function exportToCSV(expenses: Expense[]): void {
  const headers = ['Date', 'Description', 'Category', 'Amount'];
  const rows = expenses.map((exp) => {
    // Escape quotes in description
    const safeDesc = `"${exp.description.replace(/"/g, '""')}"`;
    return [exp.date, safeDesc, exp.category, roundCurrency(exp.amount).toFixed(2)].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `tracker_expenses_${getTodayDateString()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports full data as JSON backup
 */
export function exportToJSON(expenses: Expense[]): void {
  const jsonContent = JSON.stringify(expenses, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `tracker_backup_${getTodayDateString()}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Parses CSV file text into Expense array
 */
export function parseCSV(csvText: string): Expense[] {
  const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) {
    throw new Error('CSV file has no data rows.');
  }

  // Parse header
  const headerLine = lines[0].toLowerCase();
  const isHeaderValid =
    headerLine.includes('date') &&
    headerLine.includes('description') &&
    headerLine.includes('category') &&
    headerLine.includes('amount');

  if (!isHeaderValid) {
    throw new Error('CSV must have headers: Date, Description, Category, Amount');
  }

  const results: Expense[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    // Simple regex parser for CSV row with quotes
    const regex = /(?:^|,)(?:"([^"]*(?:""[^"]*)*)"|([^,]*))/g;
    const tokens: string[] = [];
    let match;
    while ((match = regex.exec(line)) !== null) {
      let val = match[1] !== undefined ? match[1].replace(/""/g, '"') : match[2];
      tokens.push(val.trim());
    }

    if (tokens.length >= 4) {
      const date = tokens[0];
      const description = tokens[1];
      let category = tokens[2] as Category;
      const amountStr = tokens[3].replace(/[₱,$\s]/g, '');
      const amount = parseFloat(amountStr);

      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        continue; // skip invalid date
      }

      if (!CATEGORIES.includes(category)) {
        category = 'Other';
      }

      if (isNaN(amount) || amount <= 0) {
        continue; // skip invalid amount
      }

      results.push({
        id: `imp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        date,
        description: description || 'Imported Expense',
        category,
        amount: roundCurrency(amount),
        createdAt: Date.now(),
      });
    }
  }

  if (results.length === 0) {
    throw new Error('No valid expense entries could be parsed from the CSV file.');
  }

  return results;
}

/**
 * Parses and validates JSON backup file
 */
export function parseJSON(jsonText: string): Expense[] {
  const data = JSON.parse(jsonText);
  if (!Array.isArray(data)) {
    throw new Error('Invalid JSON: expected an array of expenses.');
  }

  const validExpenses: Expense[] = [];
  for (const item of data) {
    if (
      item &&
      typeof item.description === 'string' &&
      typeof item.date === 'string' &&
      typeof item.amount === 'number' &&
      item.amount > 0
    ) {
      const cat = CATEGORIES.includes(item.category) ? item.category : 'Other';
      validExpenses.push({
        id: item.id || `exp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        date: item.date,
        description: item.description,
        category: cat,
        amount: roundCurrency(item.amount),
        createdAt: typeof item.createdAt === 'number' ? item.createdAt : Date.now(),
      });
    }
  }

  if (validExpenses.length === 0) {
    throw new Error('No valid expenses found in JSON.');
  }

  return validExpenses;
}

/**
 * LocalStorage management
 */
export const STORAGE_KEY = 'money_tracker_expenses_v3';
export const PRESETS_STORAGE_KEY = 'money_tracker_presets_v3';

export function loadStoredExpenses(): Expense[] {
  if (typeof window === 'undefined') return INITIAL_MOCK_DATA;
  try {
    // Clear out any old versions to ensure exact Google Sheets ledger order is loaded
    localStorage.removeItem('tracker_expenses_v1');
    localStorage.removeItem('money_tracker_expenses_v2');
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_MOCK_DATA));
      return INITIAL_MOCK_DATA;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    // If empty array or corrupted, seed with initial mock data
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_MOCK_DATA));
    return INITIAL_MOCK_DATA;
  } catch (err) {
    console.warn('LocalStorage error, using fallback mock data:', err);
    return INITIAL_MOCK_DATA;
  }
}

export function saveStoredExpenses(expenses: Expense[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
  } catch (err) {
    console.error('Failed to save expenses to localStorage:', err);
  }
}
