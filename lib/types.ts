export type Category =
  | 'Food'
  | 'Transportation'
  | 'Shopping'
  | 'Entertainment'
  | 'Utilities'
  | 'Other';

export type Role = 'admin' | 'user' | 'guest';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface Expense {
  id: string;
  date: string; // ISO format: YYYY-MM-DD
  time?: string; // HH:MM 24-hr format (e.g. "14:30") - active from Nov 12, 2026 onwards
  description: string;
  category: Category;
  amount: number; // Stored in Philippine Pesos (PHP)
  createdAt: number;
  userId?: string; // Ownership identification
  order?: number; // Exact sequence index for Nov 11 and before
}

export interface SupabaseExpenseRow {
  id: string;
  user_id?: string | null;
  date: string;
  description: string;
  category: string;
  amount: number;
  created_at: string;
}

export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function rowToExpense(row: SupabaseExpenseRow): Expense {
  const createdAtMs = row.created_at ? new Date(row.created_at).getTime() : Date.now();
  let time: string | undefined = undefined;
  if (row.created_at) {
    try {
      const d = new Date(row.created_at);
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      time = `${hours}:${minutes}`;
    } catch {
      time = undefined;
    }
  }

  return {
    id: row.id,
    date: row.date,
    description: row.description,
    category: (['Food', 'Transportation', 'Shopping', 'Entertainment', 'Utilities', 'Other'].includes(row.category)
      ? row.category
      : 'Other') as Category,
    amount: Number(row.amount),
    createdAt: createdAtMs,
    userId: row.user_id || undefined,
    time,
  };
}

export function expenseToRow(expense: Expense, userId?: string | null): SupabaseExpenseRow {
  let createdAtIso = new Date(expense.createdAt || Date.now()).toISOString();
  if (expense.time && /^\d{2}:\d{2}$/.test(expense.time)) {
    try {
      const combined = new Date(`${expense.date}T${expense.time}:00`);
      if (!isNaN(combined.getTime())) {
        createdAtIso = combined.toISOString();
      }
    } catch {
      // Keep createdAtIso
    }
  }

  const row: SupabaseExpenseRow = {
    id: expense.id && expense.id.length === 36 ? expense.id : generateUUID(),
    date: expense.date,
    description: expense.description.trim(),
    category: expense.category,
    amount: Number(expense.amount),
    created_at: createdAtIso,
  };

  if (userId) {
    row.user_id = userId;
  }

  return row;
}

export interface PresetExpense {
  id: string;
  label: string;
  description: string;
  category: Category;
  amount: number;
}

export interface WeeklySubtotal {
  weekIndex: number;
  label: string;
  dateRange: string;
  startDate: string;
  endDate: string;
  total: number;
  count: number;
  percentageOfMonthly: number;
}

export interface CategorySummary {
  category: Category;
  total: number;
  count: number;
  percentage: number;
}

export interface MonthSummary {
  monthKey: string; // YYYY-MM
  label: string;    // e.g. "November 2026"
  total: number;
  todayTotal: number;
  dailyAverage: number;
  activeDaysCount: number;
  daysElapsed: number;
  totalDaysInMonth: number;
  weeklySubtotals: WeeklySubtotal[];
  categoryBreakdown: CategorySummary[];
  expenseCount: number;
  isLocked?: boolean;
  isFuture?: boolean;
}
