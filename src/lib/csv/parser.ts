import Papa from 'papaparse';
import type { Transaction } from '@/types';
import { detectFormat, parseDate, parseAmount } from './formats';
import { classify } from '../category/classifier';
import { loadCustomRules } from '../category/customRules';

export type ParseResult =
  | { ok: true; transactions: Transaction[]; bankName: string; skipped: number }
  | { ok: false; error: string };

export function parseCSV(text: string): ParseResult {
  // BOM除去
  const cleaned = text.replace(/^\uFEFF/, '');

  const result = Papa.parse<string[]>(cleaned, {
    skipEmptyLines: true,
  });

  if (result.errors.length > 0 && result.data.length === 0) {
    return { ok: false, error: 'CSVの読み込みに失敗しました。' };
  }

  const rows = result.data as string[][];
  if (rows.length < 2) {
    return { ok: false, error: 'データ行がありません。' };
  }

  const headers = rows[0];
  const fmt = detectFormat(headers);
  if (!fmt) {
    return {
      ok: false,
      error:
        'このCSVフォーマットは現在未対応です。三菱UFJ・三井住友・ゆうちょのCSVをお使いください。',
    };
  }

  const headerRows = fmt.headerRows ?? 1;
  const dataRows = rows.slice(headerRows);
  const transactions: Transaction[] = [];
  let skipped = 0;
  const customRules = loadCustomRules(); // ループ前に1回だけロード

  for (const row of dataRows) {
    // 空行スキップ
    if (row.every((cell) => cell.trim() === '')) continue;

    const rawDate = row[fmt.dateCol]?.trim() ?? '';
    const rawDesc = row[fmt.descCol]?.trim() ?? '';

    const date = parseDate(rawDate, fmt.dateFormat);
    if (!date) {
      skipped++;
      continue;
    }

    let amount: number;
    if (fmt.amountCol !== undefined) {
      amount = parseAmount(row[fmt.amountCol] ?? '');
    } else {
      const expense = parseAmount(row[fmt.expenseCol ?? 0] ?? '');
      const income = parseAmount(row[fmt.incomeCol ?? 0] ?? '');
      // expense: 正値=支出, income: 正値=収入 → amount正=支出
      amount = expense > 0 ? expense : income > 0 ? -income : 0;
    }

    if (amount === 0) {
      skipped++;
      continue;
    }

    const category = classify(rawDesc, customRules);
    transactions.push({ date, amount, desc: rawDesc, category, source: fmt.type });
  }

  if (transactions.length === 0) {
    return { ok: false, error: '有効な取引データが見つかりませんでした。' };
  }

  return {
    ok: true,
    transactions,
    bankName: fmt.name,
    skipped,
  };
}
