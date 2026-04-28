'use client';

import { useState, useEffect } from 'react';
import { useT } from '@/i18n';
import type { MonthSummary } from '@/types';
import { loadFixedCategories } from '@/lib/category/fixedCosts';

interface Props {
  currentSummary: MonthSummary;
}

export default function BudgetSummary({ currentSummary }: Props) {
  const t = useT();
  const [fixedCats, setFixedCats] = useState<Set<string>>(new Set());

  useEffect(() => {
    setFixedCats(loadFixedCategories());
  }, []);

  if (fixedCats.size === 0) return null;

  const fixedTotal = [...fixedCats].reduce(
    (sum, cat) => sum + (currentSummary.byCategory[cat] ?? 0),
    0
  );
  const variableTotal = currentSummary.total - fixedTotal;
  const forecastTotal = fixedTotal + variableTotal;

  return (
    <div className="border border-gray-200 rounded-md p-3 space-y-2">
      <div className="text-xs text-gray-500 font-medium">{t.budget.title}</div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">{t.budget.fixed}</span>
        <span className="text-sm font-bold tabular-nums text-gray-900">
          ¥{fixedTotal.toLocaleString()}
        </span>
      </div>
      <div className="space-y-0.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">{t.budget.variable}</span>
          <span className="text-sm font-bold tabular-nums text-gray-900">
            ¥{variableTotal.toLocaleString()}
          </span>
        </div>
        <div className="text-xs text-gray-400 text-right">
          {t.budget.forecast(forecastTotal)}
        </div>
      </div>
    </div>
  );
}
