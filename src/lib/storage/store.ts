import type { Transaction, StorageMeta } from '@/types';

const META_KEY = 'moneco:meta';
const TXN_PREFIX = 'moneco:txns:';

function monthKey(month: string): string {
  return `${TXN_PREFIX}${month}`;
}

/** YYYY-MM-DD → YYYY-MM */
export function toMonthStr(date: string): string {
  return date.slice(0, 7);
}

// --- Meta ---

function readMeta(): StorageMeta {
  try {
    const raw = localStorage.getItem(META_KEY);
    if (!raw) return { months: [] };
    return JSON.parse(raw) as StorageMeta;
  } catch {
    return { months: [] };
  }
}

function writeMeta(meta: StorageMeta): void {
  localStorage.setItem(META_KEY, JSON.stringify(meta));
}

// --- Transactions ---

export function loadTransactions(month: string): Transaction[] {
  try {
    const raw = localStorage.getItem(monthKey(month));
    if (!raw) return [];
    return JSON.parse(raw) as Transaction[];
  } catch {
    return [];
  }
}

/**
 * 指定月のトランザクションを保存。
 * 同じ source（bank/card）のデータは上書き、別 source のデータは保持する。
 * QuotaExceededError を throw するので呼び出し側でハンドリングする。
 */
export function saveTransactions(month: string, transactions: Transaction[]): void {
  const source = transactions[0]?.source;
  const existing = loadTransactions(month);
  const merged = source
    ? [...existing.filter((t) => t.source !== source), ...transactions]
    : transactions;
  const json = JSON.stringify(merged);
  try {
    localStorage.setItem(monthKey(month), json);
  } catch (e) {
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      throw new StorageFullError();
    }
    throw e;
  }

  // meta更新（トランザクション保存成功後のみ）
  const meta = readMeta();
  if (!meta.months.includes(month)) {
    meta.months = [...meta.months, month].sort();
    writeMeta(meta);
  }
}

export class StorageFullError extends Error {
  constructor() {
    super('ストレージの空き容量が不足しています。古い月のデータを削除してください。');
    this.name = 'StorageFullError';
  }
}

// --- Month list ---

export function loadMonths(): string[] {
  const meta = readMeta();
  return meta.months;
}

/**
 * TODO-01: meta/txns整合性リカバリー。
 * アプリ起動時に一度呼ぶ。実際のキーと meta を突き合わせて孤児データを修復する。
 */
export function recoverMeta(): void {
  try {
    const actual: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(TXN_PREFIX)) {
        actual.push(key.slice(TXN_PREFIX.length));
      }
    }
    actual.sort();
    const meta = readMeta();
    const metaSet = new Set(meta.months);
    let dirty = false;
    for (const m of actual) {
      if (!metaSet.has(m)) {
        meta.months.push(m);
        dirty = true;
      }
    }
    if (dirty) {
      meta.months.sort();
      writeMeta(meta);
    }
  } catch {
    // ストレージアクセス不可（プライベートブラウジング等）は無視
  }
}

// --- Capacity ---

/** 使用中バイト数を推定（JSON文字列長の合計） */
export function estimateUsedBytes(): number {
  let total = 0;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i) ?? '';
      const val = localStorage.getItem(key) ?? '';
      total += key.length + val.length;
    }
  } catch {
    // ignore
  }
  return total * 2; // UTF-16 2バイト/char の近似
}

/** 5MB上限に対する使用率 0〜1 */
export function storageUsageRatio(): number {
  return estimateUsedBytes() / (5 * 1024 * 1024);
}

export function deleteMonth(month: string): void {
  localStorage.removeItem(monthKey(month));
  const meta = readMeta();
  meta.months = meta.months.filter((m) => m !== month);
  writeMeta(meta);
}

/** 指定月の特定トランザクションのカテゴリを更新する */
export function updateTransactionCategory(
  month: string,
  txnIndex: number,
  newCategory: string
): void {
  const txns = loadTransactions(month);
  if (txnIndex < 0 || txnIndex >= txns.length) return;
  txns[txnIndex] = { ...txns[txnIndex], category: newCategory };
  localStorage.setItem(monthKey(month), JSON.stringify(txns));
}

/** 指定月の特定 source のデータだけ削除。残った source がなければ月ごと削除。 */
export function deleteMonthBySource(month: string, source: 'bank' | 'card'): void {
  const remaining = loadTransactions(month).filter((t) => t.source !== source);
  if (remaining.length === 0) {
    deleteMonth(month);
  } else {
    localStorage.setItem(monthKey(month), JSON.stringify(remaining));
  }
}
