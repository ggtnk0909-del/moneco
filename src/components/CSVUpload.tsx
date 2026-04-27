'use client';

import { useRef, useState } from 'react';
import { parseCSV, type ParseErrorCode } from '@/lib/csv/parser';
import { saveTransactions, StorageFullError, toMonthStr } from '@/lib/storage/store';
import { useT } from '@/i18n';
import type { Transaction } from '@/types';

interface Props {
  onImported: (month: string, transactions: Transaction[]) => void;
  compact?: boolean;
}

export default function CSVUpload({ onImported, compact }: Props) {
  const t = useT();
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parseErrorMessages: Record<ParseErrorCode, string> = {
    csvParseFailed: t.errors.csvParseFailed,
    noDataRows: t.errors.noDataRows,
    unsupportedFormat: t.errors.unsupportedFormat,
    noValidTransactions: t.errors.noValidTransactions,
  };

  async function handleFile(file: File) {
    setLoading(true);
    setError(null);

    try {
      const buffer = await file.arrayBuffer();
      // UTF-8 として厳格デコードを試み、不正バイト列があれば Shift-JIS にフォールバック。
      // 日本の金融機関CSVは Shift-JIS が多く、file.text() の UTF-8 固定では文字化けする。
      let text: string;
      try {
        text = new TextDecoder('utf-8', { fatal: true }).decode(buffer);
      } catch {
        text = new TextDecoder('shift-jis').decode(buffer);
      }
      const result = parseCSV(text);

      if (!result.ok) {
        setError(parseErrorMessages[result.error]);
        return;
      }

      // 月ごとにグループ化して保存
      const byMonth = new Map<string, Transaction[]>();
      for (const txn of result.transactions) {
        const month = toMonthStr(txn.date);
        if (!byMonth.has(month)) byMonth.set(month, []);
        byMonth.get(month)!.push(txn);
      }

      for (const [month, txns] of byMonth) {
        saveTransactions(month, txns);
      }

      // 最新月を通知
      const latestMonth = [...byMonth.keys()].sort().at(-1)!;
      onImported(latestMonth, byMonth.get(latestMonth)!);

      const skippedMsg = result.skipped > 0 ? `（${result.skipped}件スキップ）` : '';
      const monthCount = byMonth.size;
      // 成功 — エラーは表示しない
      setError(null);
      console.info(`[moneco] ${result.bankName} ${result.transactions.length}件 ${monthCount}ヶ月分 ${skippedMsg}`);
    } catch (e) {
      if (e instanceof StorageFullError) {
        setError(t.errors.storageFull);
      } else {
        setError(t.errors.loadFailed);
        console.error(e);
      }
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <div>
      {compact ? (
        <button
          className="w-full text-xs text-gray-400 py-2 border border-dashed border-gray-200 rounded-md hover:border-gray-400 hover:text-gray-600 transition-colors"
          onClick={() => inputRef.current?.click()}
        >
          {loading ? t.upload.loading : t.upload.addMore}
        </button>
      ) : (
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50 cursor-pointer"
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          <div className="text-3xl mb-2">📂</div>
          <div className="text-sm font-bold text-gray-700 mb-1">
            {loading ? t.upload.loading : t.upload.tap}
          </div>
          <div className="text-xs text-gray-500">{t.upload.bankList}</div>
          <div className="text-xs text-gray-500">{t.upload.cardList}</div>
          <div className="inline-block mt-2 px-3 py-0.5 bg-green-50 border border-green-400 rounded-full text-xs text-green-800">
            {t.upload.privacyBadge}
          </div>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleChange}
      />
      {error && (
        <div className="mt-2 p-3 bg-red-50 border border-red-300 rounded text-xs text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}
