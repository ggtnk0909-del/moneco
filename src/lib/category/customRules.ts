import { DEFAULT_CATEGORIES } from '@/types';
import type { Category } from '@/types';

const RULES_KEY = 'moneco:category-rules';
const CUSTOM_CATS_KEY = 'moneco:custom-categories';

export type CustomRules = Record<string, string[]>;

// ── カスタムカテゴリ ──────────────────────────────────────────

export function loadCustomCategories(): string[] {
  try {
    const raw = localStorage.getItem(CUSTOM_CATS_KEY);
    if (raw) return JSON.parse(raw) as string[];
  } catch { /* ignore */ }
  return [];
}

export function addCustomCategory(name: string): void {
  const cats = loadCustomCategories();
  const trimmed = name.trim();
  if (!trimmed || [...DEFAULT_CATEGORIES, ...cats].includes(trimmed)) return;
  localStorage.setItem(CUSTOM_CATS_KEY, JSON.stringify([...cats, trimmed]));
}

export function removeCustomCategory(name: string): void {
  const cats = loadCustomCategories().filter((c) => c !== name);
  localStorage.setItem(CUSTOM_CATS_KEY, JSON.stringify(cats));
  const rules = loadCustomRules();
  delete rules[name];
  saveCustomRules(rules);
}

/** デフォルト + カスタムの全カテゴリ（その他は末尾固定） */
export function allCategories(): string[] {
  const custom = loadCustomCategories();
  const defaults = DEFAULT_CATEGORIES.filter((c) => c !== 'その他');
  return [...defaults, ...custom, 'その他'];
}

// ── キーワードルール ──────────────────────────────────────────

export function loadCustomRules(): CustomRules {
  try {
    const raw = localStorage.getItem(RULES_KEY);
    if (raw) return JSON.parse(raw) as CustomRules;
  } catch { /* ignore */ }
  return allCategories().reduce((acc, c) => ({ ...acc, [c]: [] }), {} as CustomRules);
}

export function saveCustomRules(rules: CustomRules): void {
  localStorage.setItem(RULES_KEY, JSON.stringify(rules));
}

export function addKeyword(category: Category, keyword: string): void {
  const rules = loadCustomRules();
  const trimmed = keyword.trim();
  if (!trimmed) return;
  if (!rules[category]) rules[category] = [];
  if (rules[category].includes(trimmed)) return;
  rules[category] = [...rules[category], trimmed];
  saveCustomRules(rules);
}

export function removeKeyword(category: Category, keyword: string): void {
  const rules = loadCustomRules();
  if (!rules[category]) return;
  rules[category] = rules[category].filter((k) => k !== keyword);
  saveCustomRules(rules);
}
