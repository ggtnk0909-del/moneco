'use client';

import { useState } from 'react';
import { PieChart as RePieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import type { MonthSummary, Category } from '@/types';
import { useT } from '@/i18n';

const SELECTED_COLOR = '#1a1a1a';
// 項目色はインデックス1から（0番=#1a1a1aは選択色として予約）
const ITEM_COLORS = ['#484848', '#686868', '#888888', '#aaaaaa', '#cccccc'];
const OTHER_COLOR = '#e0e0e0';

function colorByIndex(index: number, name: string): string {
  if (name === 'その他') return OTHER_COLOR;
  return ITEM_COLORS[Math.min(index, ITEM_COLORS.length - 1)];
}

interface Props {
  summary: MonthSummary;
}

export default function CategoryPieChart({ summary }: Props) {
  const t = useT();
  const [active, setActive] = useState<string | null>(null);

  const data = Object.keys(summary.byCategory)
    .map((cat) => ({ name: cat, value: summary.byCategory[cat] ?? 0 }))
    .filter((d) => d.value > 0)
    .sort((a, b) => {
      if (a.name === 'その他') return 1;
      if (b.name === 'その他') return -1;
      return b.value - a.value;
    });

  if (data.length === 0) return null;

  const total = data.reduce((s, d) => s + d.value, 0);
  const activeEntry = data.find((d) => d.name === active);

  return (
    <div>
      <div className="text-xs font-bold text-gray-500 mb-2">{t.chart.byCategory}</div>

      {/* 固定表示エリア */}
      <div className="h-8 mb-2 flex items-center">
        {activeEntry ? (
          <div className="flex items-center gap-1.5">
            <div
              className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
              style={{ background: SELECTED_COLOR }}
            />
            <span className="text-xs font-bold text-gray-800">{activeEntry.name}</span>
            <span className="text-xs text-gray-600 ml-1 tabular-nums">
              ¥{activeEntry.value.toLocaleString()}
            </span>
            <span className="text-xs text-gray-400">
              ({Math.round((activeEntry.value / total) * 100)}%)
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-400">{t.chart.total}</span>
            <span className="text-xs font-bold text-gray-700 tabular-nums">¥{total.toLocaleString()}</span>
          </div>
        )}
      </div>

      <div className="flex gap-3 items-center">
        <div style={{ width: 90, height: 90, flexShrink: 0, overflow: 'visible' }}>
          <ResponsiveContainer width={90} height={90}>
            <RePieChart style={{ overflow: 'visible' }}>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={22}
                outerRadius={40}
                paddingAngle={1}
                dataKey="value"
                style={{ outline: 'none' }}
              >
                {data.map((entry, i) => (
                  <Cell
                    key={entry.name}
                    fill={active === entry.name ? SELECTED_COLOR : colorByIndex(i, entry.name)}
                    style={{ outline: 'none', cursor: 'pointer' }}
                    onClick={() => setActive(entry.name === active ? null : entry.name)}
                  />
                ))}
              </Pie>
            </RePieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 space-y-1">
          {data.map((entry, i) => (
            <div key={entry.name} className="flex items-center gap-1.5">
              <div
                className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                style={{ background: active === entry.name ? SELECTED_COLOR : colorByIndex(i, entry.name) }}
              />
              <span className="text-xs text-gray-600 flex-1">{entry.name}</span>
              <span className="text-xs text-gray-400">
                {Math.round((entry.value / total) * 100)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
