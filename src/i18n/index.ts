import ja from './ja';

export type { Messages } from './ja';

/**
 * UI文字列を返すフック。
 * 現在は日本語固定。v3（Global Edition）で next-intl 等に差し替える。
 *
 * 使い方:
 *   const t = useT();
 *   <span>{t.nav.graph}</span>
 */
export function useT() {
  return ja;
}
