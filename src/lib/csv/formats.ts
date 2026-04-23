/**
 * 銀行・クレジットカードCSVフォーマット設定
 *
 * detect: ヘッダー行に含まれるキーワード。すべてのキーワードが存在すればそのフォーマットと判定。
 * dateCol / descCol / amountCol: 0始まりの列インデックス。
 * expenseCol / incomeCol: 出金・入金が別列の場合（銀行系）。
 * type: 'bank' | 'card' — カードは支出のみなので incomeCol 不要。
 */
export interface BankFormat {
  id: string;
  name: string;
  type: 'bank' | 'card';
  detect: string[];
  dateCol: number;
  descCol: number;
  /** 正負統合済みの金額列（正=支出, 負=収入）。別列の場合は undefined */
  amountCol?: number;
  /** 出金列（正値）*/
  expenseCol?: number;
  /** 入金列（正値）*/
  incomeCol?: number;
  /** 日付フォーマット: 'YYYY/MM/DD' | 'YYYY年MM月DD日' | 'YYYYMMDD' */
  dateFormat: 'YYYY/MM/DD' | 'YYYY年MM月DD日' | 'YYYYMMDD';
  headerRows?: number; // スキップする先頭行数（デフォルト1）
}

export const BANK_FORMATS: BankFormat[] = [
  // ── 銀行 ──────────────────────────────────────────
  {
    id: 'mufg',
    name: '三菱UFJ銀行',
    type: 'bank',
    detect: ['日付', '摘要', '出金'],
    dateCol: 0,
    descCol: 1,
    expenseCol: 2,
    incomeCol: 3,
    dateFormat: 'YYYY/MM/DD',
  },
  {
    id: 'smbc-bank',
    name: '三井住友銀行',
    type: 'bank',
    detect: ['取引年月日', '取引内容', '出金金額'],
    dateCol: 0,
    descCol: 1,
    expenseCol: 2,
    incomeCol: 3,
    dateFormat: 'YYYY/MM/DD',
  },
  {
    id: 'yucho',
    name: 'ゆうちょ銀行',
    type: 'bank',
    detect: ['年月日', '摘要', '払出金額'],
    dateCol: 0,
    descCol: 2,
    expenseCol: 3,
    incomeCol: 4,
    dateFormat: 'YYYY/MM/DD',
  },

  // ── クレジットカード ───────────────────────────────
  {
    id: 'rakuten-card',
    name: '楽天カード',
    type: 'card',
    // ヘッダー例: 利用日,利用店名・商品名,利用者,支払方法,利用金額,支払手数料,支払総額
    detect: ['利用日', '利用店名', '利用金額'],
    dateCol: 0,
    descCol: 1,
    amountCol: 4,
    dateFormat: 'YYYY/MM/DD',
  },
  {
    id: 'smbc-card',
    name: '三井住友カード',
    type: 'card',
    // ヘッダー例: 年月日,お支払い区分,お店の名前,ご利用金額,ご請求額
    detect: ['年月日', 'お店の名前', 'ご利用金額'],
    dateCol: 0,
    descCol: 2,
    amountCol: 3,
    dateFormat: 'YYYY/MM/DD',
  },
  {
    id: 'jcb-card',
    name: 'JCBカード',
    type: 'card',
    // ヘッダー例: 利用日,店舗名,利用金額(円),割賦手数料(円),支払金額(円)
    detect: ['利用日', '店舗名', '利用金額'],
    dateCol: 0,
    descCol: 1,
    amountCol: 2,
    dateFormat: 'YYYY/MM/DD',
  },
  {
    id: 'aeon-card',
    name: 'イオンカード',
    type: 'card',
    // ヘッダー例: 利用年月日,内容,利用金額(円),今回お支払い額(円)
    detect: ['利用年月日', '内容', '利用金額'],
    dateCol: 0,
    descCol: 1,
    amountCol: 2,
    dateFormat: 'YYYY/MM/DD',
  },
  {
    id: 'dcard',
    name: 'dカード',
    type: 'card',
    // ヘッダー例: ご利用年月日,ご利用店名,ご利用金額(円)
    detect: ['ご利用年月日', 'ご利用店名', 'ご利用金額'],
    dateCol: 0,
    descCol: 1,
    amountCol: 2,
    dateFormat: 'YYYY/MM/DD',
  },
];

export function detectFormat(headers: string[]): BankFormat | null {
  const joined = headers.join('\t');
  for (const fmt of BANK_FORMATS) {
    if (fmt.detect.every((kw) => joined.includes(kw))) {
      return fmt;
    }
  }
  return null;
}

/** "YYYY/MM/DD" or "YYYY年MM月DD日" or "YYYYMMDD" → "YYYY-MM-DD" */
export function parseDate(raw: string, fmt: BankFormat['dateFormat']): string | null {
  const s = raw.trim();
  if (fmt === 'YYYY/MM/DD') {
    const m = s.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
    if (!m) return null;
    return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
  }
  if (fmt === 'YYYY年MM月DD日') {
    const m = s.match(/^(\d{4})年(\d{1,2})月(\d{1,2})日$/);
    if (!m) return null;
    return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
  }
  if (fmt === 'YYYYMMDD') {
    const m = s.match(/^(\d{4})(\d{2})(\d{2})$/);
    if (!m) return null;
    return `${m[1]}-${m[2]}-${m[3]}`;
  }
  return null;
}

/** カンマ・円記号・スペースを除去して数値化 */
export function parseAmount(raw: string): number {
  const cleaned = raw.replace(/[,，¥￥\s]/g, '');
  if (cleaned === '' || cleaned === '-') return 0;
  return parseInt(cleaned, 10) || 0;
}
