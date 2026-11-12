'use client';

import React, { createContext, useContext } from 'react';
import { Expense, UserProfile } from './types';
import { isRecordEditable } from './dateUtils';

export interface AuthContextType {
  currentUser: UserProfile;
  isLoading: boolean;
  isConfigured: boolean;
  canResetData: () => boolean;
}

const DEFAULT_PROFILE: UserProfile = {
  id: '',
  name: 'Personal Tracker',
  email: '',
  role: 'user',
};

const AuthContext = createContext<AuthContextType>({
  currentUser: DEFAULT_PROFILE,
  isLoading: false,
  isConfigured: true,
  canResetData: () => true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <AuthContext.Provider
      value={{
        currentUser: DEFAULT_PROFILE,
        isLoading: false,
        isConfigured: true,
        canResetData: () => true,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

/**
 * Authorization Guard: validates date locking and immutability rules.
 * Supports both signatures: (expense, action) and (user, expense, action).
 */
export function checkExpensePermission(
  first: Expense | UserProfile | null | undefined,
  second?: Expense | 'edit' | 'delete',
  third?: 'edit' | 'delete'
): { allowed: boolean; reason?: string } {
  const expense: Expense | undefined =
    second && typeof second === 'object' && 'date' in second
      ? (second as Expense)
      : first && typeof first === 'object' && 'date' in first
      ? (first as Expense)
      : undefined;

  const action: 'edit' | 'delete' =
    third || (typeof second === 'string' ? second : 'edit');

  if (!expense || !isRecordEditable(expense.date)) {
    return {
      allowed: false,
      reason: `This transaction falls within a locked or future period and cannot be ${
        action === 'delete' ? 'deleted' : 'modified'
      }.`,
    };
  }

  return { allowed: true };
}

export function canResetSystemData(): { allowed: boolean; reason?: string } {
  return { allowed: true };
}
