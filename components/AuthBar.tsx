'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth, PRESET_USERS } from '@/lib/permissions';
import { Role } from '@/lib/types';
import { ShieldCheck, User, Eye, ChevronDown, Check } from 'lucide-react';

export default function AuthBar() {
  const { currentUser, switchRole } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
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

  const getRoleBadge = (role: Role) => {
    switch (role) {
      case 'admin':
        return {
          label: 'Admin',
          icon: <ShieldCheck className="w-3 h-3 text-emerald-400" />,
          color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        };
      case 'user':
        return {
          label: 'Member',
          icon: <User className="w-3 h-3 text-sky-400" />,
          color: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
        };
      case 'guest':
        return {
          label: 'Guest',
          icon: <Eye className="w-3 h-3 text-zinc-400" />,
          color: 'bg-zinc-800 text-zinc-400 border-zinc-700',
        };
    }
  };

  const badge = getRoleBadge(currentUser.role);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs text-zinc-200 transition-all cursor-pointer group"
      >
        <div className="w-5 h-5 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] font-bold text-zinc-200">
          {currentUser.name.charAt(0)}
        </div>
        <div className="hidden sm:flex flex-col text-left">
          <span className="font-medium text-xs text-zinc-200 leading-tight">
            {currentUser.name}
          </span>
          <span className="text-[10px] text-zinc-500 leading-none">
            {currentUser.role.toUpperCase()}
          </span>
        </div>
        <div
          className={`inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded border ${badge.color}`}
        >
          {badge.icon}
          <span>{badge.label}</span>
        </div>
        <ChevronDown className="w-3 h-3 text-zinc-500 group-hover:text-zinc-300 transition-transform" />
      </button>

      {/* Role Switcher Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-60 rounded-xl bg-zinc-900 border border-zinc-800 p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95">
          <div className="px-2 py-1.5 text-[11px] font-medium text-zinc-500 uppercase tracking-wider border-b border-zinc-800/80 mb-1">
            Simulate Identity / Role
          </div>

          {(['admin', 'user', 'guest'] as Role[]).map((roleKey) => {
            const profile = PRESET_USERS[roleKey];
            const isSelected = currentUser.role === roleKey;
            const rBadge = getRoleBadge(roleKey);

            return (
              <button
                key={roleKey}
                onClick={() => {
                  switchRole(roleKey);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                  isSelected ? 'bg-zinc-800/80 text-white' : 'hover:bg-zinc-800/40 text-zinc-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center text-xs font-semibold text-zinc-300">
                    {profile.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-medium text-zinc-200">{profile.name}</div>
                    <div className="text-[10px] text-zinc-500">{profile.email}</div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[9px] uppercase font-mono px-1.5 py-0.5 rounded border ${rBadge.color}`}
                  >
                    {rBadge.label}
                  </span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                </div>
              </button>
            );
          })}

          <div className="p-2 mt-1 rounded-lg bg-zinc-950/80 border border-zinc-800 text-[10px] text-zinc-400 space-y-0.5">
            <span className="font-semibold text-zinc-300">Authorization Rules:</span>
            <p className="text-zinc-500">
              • <strong>Admin:</strong> Full read/write/delete & system reset.
            </p>
            <p className="text-zinc-500">
              • <strong>User:</strong> Owns and manages their created records only.
            </p>
            <p className="text-zinc-500">
              • <strong>Guest:</strong> Read-only access to protected seed data.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
