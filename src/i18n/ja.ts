const ja = {
  appName: 'moneco',

  nav: {
    graph: 'グラフ',
    list: '明細',
    settings: '設定',
  },

  upload: {
    tap: '銀行CSVをタップしてアップロード',
    addMore: '+ CSVを追加',
    loading: '読み込み中...',
    bankList: '三菱UFJ・三井住友・ゆうちょ銀行',
    cardList: '楽天・三井住友・JCB・イオン・dカード',
    privacyBadge: '✓ データはデバイスから出ません',
    hint: '💡 登録不要。CSVをドロップするだけでグラフが表示されます。',
  },

  summary: {
    thisMonth: '今月の支出',
    vsLastMonth: (diff: number) =>
      `${diff > 0 ? '▲' : '▼'} 先月比 ${diff > 0 ? '+' : ''}¥${Math.abs(diff).toLocaleString()}`,
    bank: '銀行',
    card: 'カード',
    all: 'すべて',
  },

  chart: {
    monthlyTitle: '月別支出推移（円）',
    olderMonths: '‹ 前の月',
    newerMonths: '次の月 ›',
    bank: '銀行',
    card: 'カード',
    monthLabel: (m: number) => `${m}月`,
    byCategory: 'カテゴリ別（今月）',
    total: '合計',
  },

  list: {
    noData: 'この月のデータがありません',
    noDataHint: 'グラフタブからCSVを読み込んでください',
  },

  settings: {
    categoryTitle: 'カテゴリ設定',
    categoryDescription:
      'カテゴリごとにキーワードを追加すると、明細の自動分類精度が上がります。',
    keywordCount: (n: number) => `キーワード ${n}件`,
    customBadge: 'カスタム',
    keywordPlaceholder: 'キーワードを追加（例: マツキヨ）',
    add: '追加',
    deleteCategory: 'このカテゴリを削除',
    newCategoryPlaceholder: '新しいカテゴリ名',
    dataTitle: 'データ管理',
    localOnly: 'すべてのデータはこのデバイスにのみ保存されます。',
    noServer: 'サーバーには何も送信されません。',
    savedMonths: '保存済み月',
    deleteMonth: '月ごと削除',
    deleteSource: '削除',
    confirmDelete: '削除する',
    cancelDelete: '戻す',
    deleteAll: 'すべてのデータを削除',
    confirmDeleteAll: 'すべて削除する',
    cancelDeleteAll: 'キャンセル',
    bankCount: (n: number) => `銀行 ${n}件`,
    cardCount: (n: number) => `カード ${n}件`,
    monthLabel: (year: string, month: number) => `${year}年${month}月`,
  },

  banners: {
    iosTitle: 'ホーム画面に追加するとデータが保持されます',
    iosBody: 'Safari の「共有」→「ホーム画面に追加」でアプリとして使えます。',
    iosDismiss: '閉じる',
    storage: (pct: number, isCritical: boolean) =>
      `ストレージ使用量: ${pct}%${isCritical ? '（空き容量不足）' : '（残りわずか）'}`,
    adPlaceholder: '広告スペース（320×50）',
  },

  errors: {
    csvParseFailed: 'CSVの読み込みに失敗しました。',
    noDataRows: 'データ行がありません。',
    unsupportedFormat:
      'このCSVフォーマットは現在未対応です。三菱UFJ・三井住友・ゆうちょのCSVをお使いください。',
    noValidTransactions: '有効な取引データが見つかりませんでした。',
    storageFull:
      'ストレージの空き容量が不足しています。古い月のデータを削除してください。',
    loadFailed: '読み込みに失敗しました。',
  },
};

export type Messages = typeof ja;
export default ja;
