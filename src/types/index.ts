export type Category = string;

export const DEFAULT_CATEGORIES: Category[] = [
  '食費',
  '交通費',
  '光熱費・通信',
  '日用品',
  '娯楽・外食',
  '医療',
  'その他',
];

// 実行時にカスタムカテゴリを含む全カテゴリを返す関数は customRules.ts で提供
export const CATEGORIES = DEFAULT_CATEGORIES; // 後方互換用エイリアス

export interface Transaction {
  date: string;      // "YYYY-MM-DD"
  amount: number;    // positive = expense, negative = income
  desc: string;      // raw description
  category: Category;
  source: 'bank' | 'card';
}

export interface MonthSummary {
  month: string;     // "YYYY-MM"
  total: number;
  count: number;
  byCategory: Record<string, number>;
  bySource: { bank: number; card: number };
}

export interface StorageMeta {
  months: string[];  // sorted "YYYY-MM" list
}
