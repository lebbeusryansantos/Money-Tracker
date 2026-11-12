'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from './supabase';
import { Expense, UserProfile } from './types';
import { isRecordEditable } from './dateUtils';

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  currentUser: UserProfile;
  isLoading: boolean;
  isConfigured: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | Error | null }>;
  signUp: (
    email: string,
    password: string
  ) => Promise<{ error: AuthError | Error | null; data?: unknown; needsEmailConfirmation?: boolean }>;
  signOut: () => Promise<void>;
  canResetData: () => boolean;
}

const GUEST_PROFILE: UserProfile = {
  id: '',
  name: 'Guest',
  email: '',
  role: 'guest',
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  currentUser: GUEST_PROFILE,
  isLoading: true,
  isConfigured: false,
  signIn: async () => ({ error: new Error('Auth not initialized') }),
  signUp: async () => ({ error: new Error('Auth not initialized') }),
  signOut: async () => {},
  canResetData: () => false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isConfigured = isSupabaseConfigured();

  useEffect(() => {
    let mounted = true;

    async function initSession() {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (mounted) {
          if (error) {
            console.warn('Supabase getSession error:', error.message);
          }
          setSession(data.session);
          setUser(data.session?.user ?? null);
        }
      } catch (err) {
        console.warn('Failed to retrieve Supabase session:', err);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    initSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (mounted) {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const currentUser: UserProfile = useMemo(() => {
    if (!user) return GUEST_PROFILE;
    const namePart = user.email ? user.email.split('@')[0] : 'User';
    return {
      id: user.id,
      name: namePart.charAt(0).toUpperCase() + namePart.slice(1),
      email: user.email || '',
      role: 'user',
    };
  }, [user]);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) return { error };
      setSession(data.session);
      setUser(data.user);
      return { error: null };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });
      if (error) return { error };
      const needsEmailConfirmation = Boolean(data.user && !data.session);
      return { error: null, data, needsEmailConfirmation };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Sign out error:', err);
    } finally {
      setUser(null);
      setSession(null);
    }
  };

  const canResetData = () => Boolean(user);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        currentUser,
        isLoading,
        isConfigured,
        signIn,
        signUp,
        signOut,
        canResetData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

/**
 * Authorization Guard: checks whether a user has permission to mutate (edit/delete) an expense.
 * Defends against IDOR by validating user ownership and date locking.
 */
export function checkExpensePermission(
  user: UserProfile | User | null,
  expense: Expense,
  action?: 'edit' | 'delete'
): { allowed: boolean; reason?: string } {
  // Date lock check
  if (!isRecordEditable(expense.date)) {
    return {
      allowed: false,
      reason: `This transaction falls within a locked or future period and cannot be ${
        action === 'delete' ? 'deleted' : 'modified'
      }.`,
    };
  }

  if (!user) {
    return {
      allowed: false,
      reason: 'Please sign in to perform this action.',
    };
  }

  const userId = 'id' in user ? user.id : '';
  if (!userId) {
    return {
      allowed: false,
      reason: 'Please sign in to modify expenses.',
    };
  }

  // IDOR Prevention: verify ownership if userId is attached
  if (expense.userId && expense.userId !== userId) {
    return {
      allowed: false,
      reason: 'Access Denied: You are not authorized to modify another user’s transaction.',
    };
  }

  return { allowed: true };
}

export function canResetSystemData(user: UserProfile | User | null): { allowed: boolean; reason?: string } {
  if (!user) {
    return {
      allowed: false,
      reason: 'Please sign in to manage cloud data.',
    };
  }
  return { allowed: true };
}
