import { supabase } from './supabase';
import { Expense, SupabaseExpenseRow, expenseToRow, rowToExpense } from './types';

export interface ServiceResult<T> {
  data: T | null;
  error: Error | null;
}

/**
 * Fetch all expenses from Supabase public.expenses without user_id filter
 */
export async function fetchCloudExpenses(): Promise<ServiceResult<Expense[]>> {
  try {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    const expenses: Expense[] = (data as SupabaseExpenseRow[]).map(rowToExpense);
    return { data: expenses, error: null };
  } catch (err: unknown) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

// Backward-compatible alias
export const fetchUserExpenses = fetchCloudExpenses;

/**
 * Insert a single new expense into Supabase public.expenses
 */
export async function createExpenseInCloud(
  expense: Expense
): Promise<ServiceResult<Expense>> {
  try {
    const row = expenseToRow(expense);
    const { data, error } = await supabase
      .from('expenses')
      .insert(row)
      .select()
      .single();

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return { data: rowToExpense(data as SupabaseExpenseRow), error: null };
  } catch (err: unknown) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

/**
 * Update an existing expense in Supabase public.expenses
 */
export async function updateExpenseInCloud(
  expense: Expense
): Promise<ServiceResult<Expense>> {
  try {
    const row = expenseToRow(expense);
    const { data, error } = await supabase
      .from('expenses')
      .update({
        date: row.date,
        description: row.description,
        category: row.category,
        amount: row.amount,
        created_at: row.created_at,
      })
      .eq('id', expense.id)
      .select()
      .single();

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return { data: rowToExpense(data as SupabaseExpenseRow), error: null };
  } catch (err: unknown) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

/**
 * Delete an expense from Supabase public.expenses by id
 */
export async function deleteExpenseFromCloud(
  id: string
): Promise<ServiceResult<boolean>> {
  try {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id);

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return { data: true, error: null };
  } catch (err: unknown) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

/**
 * Bulk insert expenses (for CSV/JSON import or initial mock data seed)
 */
export async function bulkInsertExpensesInCloud(
  expenses: Expense[]
): Promise<ServiceResult<Expense[]>> {
  try {
    if (expenses.length === 0) {
      return { data: [], error: null };
    }

    const rows = expenses.map((exp) => expenseToRow(exp));

    const { data, error } = await supabase
      .from('expenses')
      .insert(rows)
      .select();

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    const inserted: Expense[] = (data as SupabaseExpenseRow[]).map(rowToExpense);
    return { data: inserted, error: null };
  } catch (err: unknown) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

/**
 * Wipe all expenses from Supabase public.expenses
 */
export async function clearAllExpensesInCloud(): Promise<ServiceResult<boolean>> {
  try {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return { data: true, error: null };
  } catch (err: unknown) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

// Backward-compatible alias
export const clearAllUserExpensesInCloud = clearAllExpensesInCloud;
