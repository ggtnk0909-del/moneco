'use client';

import { storageUsageRatio } from '@/lib/storage/store';
import { useT } from '@/i18n';

interface Props {
  onDismiss: () => void;
}

export default function StorageCapacityBanner({ onDismiss }: Props) {
  const t = useT();
  const ratio = storageUsageRatio();
  if (ratio < 0.8) return null;

  const pct = Math.round(ratio * 100);
  const isCritical = ratio >= 0.95;

  return (
    <div
      className={`px-4 py-2 text-xs flex items-center justify-between ${
        isCritical
          ? 'bg-red-50 border-b border-red-200 text-red-700'
          : 'bg-yellow-50 border-b border-yellow-200 text-yellow-800'
      }`}
    >
      <span>{t.banners.storage(pct, isCritical)}</span>
      <button onClick={onDismiss} className="ml-2 opacity-60">
        ✕
      </button>
    </div>
  );
}
