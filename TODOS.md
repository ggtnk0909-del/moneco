# TODOS — moneco

## TODO-01: meta/txns整合性リカバリーロジック
**What:** アプリ起動時に `moneco:meta` の月リストと実際の `moneco:txns:*` キーを照合し、欠落を修復するリカバリーコード。
**Why:** 書き込み中のクラッシュで meta が更新されないと、月データが存在するのにナビゲーションに出てこない事象が発生する。
**Context:** `lib/storage/store.ts` の `loadAllMonths()` で起動時に一度実行するリカバリー関数を追加する。全キーをスキャンして `moneco:txns:` プレフィックスのキーを列挙し、meta の月リストと照合して欠落があれば meta を更新する。
**Depends on:** localStorage データモデル実装完了

## TODO-02: 銀行フォーマット設定の一元化（YAGNI辺回し）
**What:** `formats/mufg.ts`, `smbc.ts`, `yucho.ts` の3ファイル分割をやめて、設定オブジェクトの配列一本化。
**Why:** 各銀行フォーマットの差異はヘッダー列名のマッピングだけ。ファイル数が減り新フォーマット追加も1行。
**Context:**
```ts
const BANK_FORMATS: BankFormat[] = [
  { id: 'mufg', detect: ['お取引日', '出金金額'], dateCol: 0, amountCol: 2, descCol: 1 },
  { id: 'smbc', detect: ['オペレーション', '金額(円)'], dateCol: 0, amountCol: 3, descCol: 1 },
  { id: 'yucho', detect: ['用い効果日'], dateCol: 0, amountCol: 4, descCol: 2 },
]
```
**Depends on:** 実際の銀行CSVサンプル入手後にカラム番号を確定させること

