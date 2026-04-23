'use client';

interface Props {
  month: string;        // "YYYY-MM"
  availableMonths: string[];
  onChange: (month: string) => void;
}

export default function MonthNav({ month, availableMonths, onChange }: Props) {
  const idx = availableMonths.indexOf(month);
  const canPrev = idx > 0;
  const canNext = idx < availableMonths.length - 1;

  const [year, m] = month.split('-');
  const label = `${year}年${parseInt(m, 10)}月`;

  return (
    <div className="flex items-center gap-2 text-sm">
      <button
        onClick={() => canPrev && onChange(availableMonths[idx - 1])}
        disabled={!canPrev}
        className="px-2 py-0.5 rounded bg-white/20 border border-white/40 disabled:opacity-30"
      >
        ‹
      </button>
      <span className="font-medium">{label}</span>
      <button
        onClick={() => canNext && onChange(availableMonths[idx + 1])}
        disabled={!canNext}
        className="px-2 py-0.5 rounded bg-white/20 border border-white/40 disabled:opacity-30"
      >
        ›
      </button>
    </div>
  );
}
