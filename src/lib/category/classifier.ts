import type { Category } from '@/types';
import { CATEGORY_RULES } from './rules';
import { loadCustomRules, type CustomRules } from './customRules';

/**
 * 全角英数字 → 半角、カタカナ → ひらがな に正規化。
 * 日本の銀行明細は混在エンコーディングが多いため、正規化後にマッチングする。
 */
export function normalizeDesc(desc: string): string {
  return desc
    .normalize('NFKC') // 全角英数 → 半角、全角スペース → 半角
    .replace(/[\u30A1-\u30F6]/g, (ch) =>
      String.fromCharCode(ch.charCodeAt(0) - 0x60) // カタカナ → ひらがな
    )
    .toLowerCase();
}

/**
 * 1件分類。バッチ処理では customRules を呼び出し元で一度だけロードして渡すこと。
 */
export function classify(rawDesc: string, customRules?: CustomRules): Category {
  const normalized = normalizeDesc(rawDesc);
  const rules = customRules ?? loadCustomRules();

  // ユーザー定義キーワードを先に評価（デフォルトより優先）
  for (const [category, keywords] of Object.entries(rules) as [Category, string[]][]) {
    for (const kw of keywords) {
      if (normalized.includes(normalizeDesc(kw))) {
        return category;
      }
    }
  }

  // デフォルトルール
  for (const rule of CATEGORY_RULES) {
    for (const pattern of rule.patterns) {
      if (pattern.test(normalized)) {
        return rule.category;
      }
    }
  }
  return 'その他';
}
