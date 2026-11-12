'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { Cloud, LogOut, ChevronDown, CheckCircle2 } from 'lucide-react';

export default function AuthBar() {
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      setIsOpen(false);
    } finally {
      setIsSigningOut(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs text-zinc-500 font-mono px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800">
          <Cloud className="w-3.5 h-3.5 text-zinc-500" />
          <span>Cloud Ready</span>
        </span>
      </div>
    );
  }

  const initial = (user.email || 'U').charAt(0).toUpperCase();

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs text-zinc-200 transition-all cursor-pointer group"
        aria-label="User account menu"
      >
        <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-[10px] font-bold text-emerald-300">
          {initial}
        </div>
        <div className="hidden sm:flex flex-col text-left max-w-[150px] truncate">
          <span className="font-medium text-xs text-zinc-200 leading-tight truncate">
            {user.email}
          </span>
          <span className="text-[10px] text-emerald-400 flex items-center gap-1 leading-none">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Cloud Synced
          </span>
        </div>
        <div className="inline-flex sm:hidden items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
          <Cloud className="w-2.5 h-2.5 text-emerald-400" />
          <span>Sync</span>
        </div>
        <ChevronDown className="w-3 h-3 text-zinc-500 group-hover:text-zinc-300 transition-transform" />
      </button>

      {/* Account Menu Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-64 rounded-xl bg-zinc-900 border border-zinc-800 p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95">
          <div className="px-3 py-2 border-b border-zinc-800/80 mb-1 space-y-0.5">
            <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
              Signed in as
            </div>
            <div className="text-xs font-semibold text-zinc-100 truncate">
              {user.email}
            </div>
          </div>

          <div className="p-2 space-y-1 text-xs text-zinc-400">
            <div className="flex items-center justify-between py-1">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Supabase Sync</span>
              </span>
              <span className="font-mono text-[10px] text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                Active
              </span>
            </div>
            <div className="text-[11px] text-zinc-500 leading-snug">
              Changes sync in real-time between your phone and laptop.
            </div>
          </div>

          <div className="pt-1 border-t border-zinc-800/80 mt-1">
            <button
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="w-full flex items-center justify-center gap-2 p-2 rounded-lg text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer disabled:opacity-50"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{isSigningOut ? 'Signing out…' : 'Sign Out'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
