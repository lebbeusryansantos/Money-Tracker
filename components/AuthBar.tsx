'use client';

import React from 'react';
import { Cloud } from 'lucide-react';

export default function AuthBar() {
  return (
    <div className="flex items-center gap-2">
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 font-mono shadow-sm">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <Cloud className="w-3.5 h-3.5 text-emerald-400" />
        <span className="text-[11px] font-medium text-zinc-200">Cloud Synced</span>
      </div>
    </div>
  );
}
