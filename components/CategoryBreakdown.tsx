'use client';

import React from 'react';
import { CategorySummary, Category } from '@/lib/types';
import { CATEGORY_CONFIG, formatCurrency } from '@/lib/utils';
import {
  PieChart,
  UtensilsCrossed,
  Car,
  ShoppingBag,
  Film,
  Zap,
  MoreHorizontal,
} from 'lucide-react';

interface CategoryBreakdownProps {
  categories: CategorySummary[];
  totalMonthlySpent: number;
}

export default function CategoryBreakdown({
  categories,
  totalMonthlySpent,
}: CategoryBreakdownProps) {
  const getCategoryIcon = (cat: Category) => {
    switch (cat) {
      case 'Food':
        return <UtensilsCrossed className="w-3.5 h-3.5" />;
      case 'Transportation':
        return <Car className="w-3.5 h-3.5" />;
      case 'Shopping':
        return <ShoppingBag className="w-3.5 h-3.5" />;
      case 'Entertainment':
        return <Film className="w-3.5 h-3.5" />;
      case 'Utilities':
        return <Zap className="w-3.5 h-3.5" />;
      default:
        return <MoreHorizontal className="w-3.5 h-3.5" />;
    }
  };

  const activeCategories = categories.filter((c) => c.total > 0);

  return (
    <div className="rounded-xl bg-zinc-900/60 border border-zinc-800/80 p-4 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PieChart className="w-4 h-4 text-zinc-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
            Category Breakdown
          </h3>
        </div>
        <span className="text-xs font-mono text-zinc-500">
          {activeCategories.length} active {activeCategories.length === 1 ? 'category' : 'categories'}
        </span>
      </div>

      {/* Stacked Proportional Distribution Bar */}
      {totalMonthlySpent > 0 ? (
        <div className="space-y-1.5">
          <div className="w-full h-3 rounded-full overflow-hidden flex bg-zinc-950 border border-zinc-800/80 p-0.5">
            {activeCategories.map((item) => {
              const config = CATEGORY_CONFIG[item.category];
              return (
                <div
                  key={item.category}
                  title={`${item.category}: ${item.percentage}% (${formatCurrency(item.total)})`}
                  style={{
                    width: `${item.percentage}%`,
                    backgroundColor: config.accentHex,
                  }}
                  className="h-full first:rounded-l-full last:rounded-r-full transition-all duration-300 hover:opacity-85"
                />
              );
            })}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-zinc-400">
            {activeCategories.map((item) => {
              const config = CATEGORY_CONFIG[item.category];
              return (
                <div key={item.category} className="flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: config.accentHex }}
                  />
                  <span>{item.category}</span>
                  <span className="font-mono text-zinc-500">{item.percentage}%</span>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Itemized Categories List */}
      <div className="space-y-2.5">
        {categories.map((item) => {
          const config = CATEGORY_CONFIG[item.category];
          const hasSpend = item.total > 0;

          return (
            <div
              key={item.category}
              className={`p-2.5 rounded-lg border transition-all ${
                hasSpend
                  ? 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700/80'
                  : 'bg-zinc-950/20 border-zinc-900/50 opacity-40'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-6 h-6 rounded flex items-center justify-center border ${config.badgeBg} ${config.border} ${config.textColor}`}
                  >
                    {getCategoryIcon(item.category)}
                  </div>
                  <div>
                    <span className="text-xs font-medium text-zinc-200">
                      {item.category}
                    </span>
                    <span className="text-[11px] text-zinc-500 font-mono ml-2">
                      {item.count} {item.count === 1 ? 'item' : 'items'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-zinc-100 tabular-nums">
                    {formatCurrency(item.total)}
                  </span>
                  <span className="text-[11px] font-mono text-zinc-500 w-10 text-right">
                    {item.percentage}%
                  </span>
                </div>
              </div>

              {/* Individual Progress bar */}
              <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${item.percentage}%`,
                    backgroundColor: config.accentHex,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

