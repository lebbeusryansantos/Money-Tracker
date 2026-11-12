import { supabase } from './supabase';
import { Expense, SupabaseExpenseRow, expenseToRow, rowToExpense } from './types';

export interface ServiceResult<T> {
  data: T | null;
  error: Error | null;
}

/**
 * Fetch all expenses for the authenticated user from Supabase public.expenses
 */
export async function fetchUserExpenses(userId: string): Promise<ServiceResult<Expense[]>> {
  try {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', userId)
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

/**
 * Insert a single new expense into Supabase
 */
export async function createExpenseInCloud(
  expense: Expense,
  userId: string
): Promise<ServiceResult<Expense>> {
  try {
    const row = expenseToRow(expense, userId);
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
 * Update an existing expense in Supabase (scoped to user_id for IDOR security)
 */
export async function updateExpenseInCloud(
  expense: Expense,
  userId: string
): Promise<ServiceResult<Expense>> {
  try {
    const row = expenseToRow(expense, userId);
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
      .eq('user_id', userId)
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
 * Delete an expense from Supabase (scoped to user_id)
 */
export async function deleteExpenseFromCloud(
  id: string,
  userId: string
): Promise<ServiceResult<boolean>> {
  try {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return { data: true, error: null };
  } catch (err: unknown) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

/**
 * Bulk insert expenses (for CSV/JSON import or seed restoration)
 */
export async function bulkInsertExpensesInCloud(
  expenses: Expense[],
  userId: string
): Promise<ServiceResult<Expense[]>> {
  try {
    if (expenses.length === 0) {
      return { data: [], error: null };
    }

    const rows = expenses.map((exp) => expenseToRow(exp, userId));

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
 * Wipe all user expenses from cloud
 */
export async function clearAllUserExpensesInCloud(userId: string): Promise<ServiceResult<boolean>> {
  try {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('user_id', userId);

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return { data: true, error: null };
  } catch (err: unknown) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}
