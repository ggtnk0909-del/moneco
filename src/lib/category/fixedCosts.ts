const FIXED_KEY = 'moneco:fixed-categories';

export function loadFixedCategories(): Set<string> {
  try {
    const raw = localStorage.getItem(FIXED_KEY);
    if (raw) return new Set(JSON.parse(raw) as string[]);
  } catch { /* ignore */ }
  return new Set();
}

export function toggleFixedCategory(category: string): void {
  const fixed = loadFixedCategories();
  if (fixed.has(category)) {
    fixed.delete(category);
  } else {
    fixed.add(category);
  }
  localStorage.setItem(FIXED_KEY, JSON.stringify([...fixed]));
}
