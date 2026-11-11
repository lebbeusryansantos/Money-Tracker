import { createContext, useContext } from 'react';
import { Expense, UserProfile, Role } from './types';
import { isRecordEditable } from './dateUtils';

export const PRESET_USERS: Record<Role, UserProfile> = {
  admin: {
    id: 'usr-admin-1',
    name: 'Ryan Santos',
    email: 'lrvsantos@mymail.mapua.edu.ph',
    role: 'admin',
  },
  user: {
    id: 'usr-user-1',
    name: 'Standard User',
    email: 'user@tracker.local',
    role: 'user',
  },
  guest: {
    id: 'usr-guest-1',
    name: 'Guest Explorer',
    email: 'guest@tracker.local',
    role: 'guest',
  },
};

export const DEFAULT_USER = PRESET_USERS.admin;
export const SEED_OWNER_ID = PRESET_USERS.admin.id;

/**
 * Authorization Guard: checks whether a user has permission to mutate (edit/delete) an expense.
 * Defends against IDOR by validating user ownership and role.
 */
export function checkExpensePermission(
  user: UserProfile,
  expense: Expense,
  action: 'edit' | 'delete'
): { allowed: boolean; reason?: string } {
  // Date lock check
  if (!isRecordEditable(expense.date)) {
    return {
      allowed: false,
      reason: 'This transaction falls within a locked or future period and cannot be modified.',
    };
  }

  // Admin has global oversight
  if (user.role === 'admin') {
    return { allowed: true };
  }

  // Guest users cannot modify protected/seed expenses
  if (user.role === 'guest') {
    if (!expense.userId || expense.userId === SEED_OWNER_ID) {
      return {
        allowed: false,
        reason: 'Guest Mode: Seed and system transactions are read-only. Switch to Admin or User profile to modify.',
      };
    }
    if (expense.userId !== user.id) {
      return {
        allowed: false,
        reason: 'Access Denied: You do not own this transaction.',
      };
    }
    return { allowed: true };
  }

  // Standard user ownership check (IDOR Prevention)
  const isOwner = expense.userId === user.id;
  if (!isOwner) {
    return {
      allowed: false,
      reason: 'Access Denied: You are not authorized to modify another user’s transaction.',
    };
  }

  return { allowed: true };
}

/**
 * Checks whether user has permission to wipe or restore system seed data
 */
export function canResetSystemData(user: UserProfile): { allowed: boolean; reason?: string } {
  if (user.role !== 'admin') {
    return {
      allowed: false,
      reason: 'Permission Denied: Only Admin role can reset or wipe the shared database.',
    };
  }
  return { allowed: true };
}

/**
 * Auth Context
 */
export interface AuthContextType {
  currentUser: UserProfile;
  setCurrentUser: (user: UserProfile) => void;
  switchRole: (role: Role) => void;
  isAdmin: boolean;
  isGuest: boolean;
  canEditExpense: (expense: Expense) => boolean;
  canDeleteExpense: (expense: Expense) => boolean;
  canResetData: () => boolean;
}

export const AuthContext = createContext<AuthContextType>({
  currentUser: DEFAULT_USER,
  setCurrentUser: () => {},
  switchRole: () => {},
  isAdmin: true,
  isGuest: false,
  canEditExpense: () => true,
  canDeleteExpense: () => true,
  canResetData: () => true,
});

export const useAuth = () => useContext(AuthContext);
