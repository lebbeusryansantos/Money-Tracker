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
