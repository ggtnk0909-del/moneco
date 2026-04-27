'use client';

import {
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { MonthSummary } from '@/types';
import { useT } from '@/i18n';

interface Props {
  data: MonthSummary[];
  currentMonth: string;
  onMonthSelect: (month: string) => void;
}

function formatYen(v: number) {
  if (v >= 10000) return `${(v / 10000).toFixed(0)}万`;
  return `${v.toLocaleString()}`;
}

const BANK_COLOR_CURRENT = '#111111';
const BANK_COLOR_OTHER   = '#999999';
const CARD_COLOR_CURRENT = '#555555';
const CARD_COLOR_OTHER   = '#cccccc';

export default function MonthlyBarChart({ data, currentMonth, onMonthSelect }: Props) {
  const t = useT();
  const chartData = data.map((d) => ({
    month: t.chart.monthLabel(parseInt(d.month.slice(5), 10)),
    bank: d.bySource.bank,
    card: d.bySource.card,
    key: d.month,
    isCurrent: d.month === currentMonth,
  }));

  return (
    <div>
      <div className="text-xs font-bold text-gray-500 mb-1">{t.chart.monthlyTitle}</div>
      <div className="flex items-center gap-3 mb-2">
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded-sm" style={{ background: BANK_COLOR_CURRENT }} />
          <span className="text-xs text-gray-500">{t.chart.bank}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded-sm" style={{ background: CARD_COLOR_CURRENT }} />
          <span className="text-xs text-gray-500">{t.chart.card}</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={120}>
        <ReBarChart
          data={chartData}
          margin={{ top: 16, right: 4, left: 4, bottom: 0 }}
        >
          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e5e7eb" />
          <Tooltip
            formatter={(value, name) => [
              typeof value === 'number' ? `¥${value.toLocaleString()}` : value,
              name === 'bank' ? t.chart.bank : t.chart.card,
            ]}
            contentStyle={{ fontSize: 11, padding: '4px 8px' }}
            cursor={{ fill: 'rgba(0,0,0,0.04)' }}
          />
          <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis
            tickFormatter={formatYen}
            tick={{ fontSize: 9 }}
            axisLine={false}
            tickLine={false}
            width={32}
          />
          <Bar
            dataKey="bank"
            stackId="a"
            shape={(props: { x?: number; y?: number; width?: number; height?: number; payload?: { isCurrent?: boolean; key?: string } }) => {
              const isCurrent = Boolean(props.payload?.isCurrent);
              return (
                <rect
                  x={Number(props.x)}
                  y={Number(props.y)}
                  width={Number(props.width)}
                  height={Number(props.height)}
                  fill={isCurrent ? BANK_COLOR_CURRENT : BANK_COLOR_OTHER}
                  style={{ outline: 'none', cursor: 'pointer' }}
                  onClick={() => props.payload?.key && onMonthSelect(props.payload.key)}
                />
              );
            }}
          />
          <Bar
            dataKey="card"
            stackId="a"
            shape={(props: { x?: number; y?: number; width?: number; height?: number; payload?: { isCurrent?: boolean; key?: string } }) => {
              const isCurrent = Boolean(props.payload?.isCurrent);
              return (
                <rect
                  x={Number(props.x)}
                  y={Number(props.y)}
                  width={Number(props.width)}
                  height={Number(props.height)}
                  rx={2}
                  ry={2}
                  fill={isCurrent ? CARD_COLOR_CURRENT : CARD_COLOR_OTHER}
                  style={{ outline: 'none', cursor: 'pointer' }}
                  onClick={() => props.payload?.key && onMonthSelect(props.payload.key)}
                />
              );
            }}
          />
        </ReBarChart>
      </ResponsiveContainer>
    </div>
  );
}
