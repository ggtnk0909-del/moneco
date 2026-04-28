'use client';

import { useEffect, useState, useCallback } from 'react';
import { useT } from '@/i18n';
import type { Transaction, MonthSummary } from '@/types';
import {
  loadMonths,
  loadTransactions,
  deleteMonth,
  deleteMonthBySource,
  recoverMeta,
  storageUsageRatio,
  updateTransactionCategory,
  toMonthStr,
} from '@/lib/storage/store';
import { allCategories } from '@/lib/category/customRules';
import CSVUpload from '@/components/CSVUpload';
import MonthlyBarChart from '@/components/BarChart';
import CategoryPieChart from '@/components/PieChart';
import AdBanner from '@/components/AdBanner';
import CategorySettings from '@/components/CategorySettings';
import IOSInstallBanner from '@/components/IOSInstallBanner';
import StorageCapacityBanner from '@/components/StorageCapacityBanner';
import AuthButton from '@/components/AuthButton';

function computeSummary(month: string, transactions: Transaction[]): MonthSummary {
  const expenses = transactions.filter((t) => t.amount > 0);
  // 実際の取引に含まれる全カテゴリを集計（カスタムカテゴリも含む）
  const cats = [...new Set(expenses.map((t) => t.category))];
  const byCategory = Object.fromEntries(
    cats.map((cat) => [
      cat,
      expenses.filter((t) => t.category === cat).reduce((s, t) => s + t.amount, 0),
    ])
  ) as MonthSummary['byCategory'];

  return {
    month,
    total: expenses.reduce((s, t) => s + t.amount, 0),
    count: expenses.length,
    byCategory,
    bySource: {
      bank: expenses.filter((t) => t.source === 'bank').reduce((s, t) => s + t.amount, 0),
      card: expenses.filter((t) => t.source === 'card').reduce((s, t) => s + t.amount, 0),
    },
  };
}

type Tab = 'graph' | 'list' | 'settings';

export default function Home() {
  const t = useT();
  const [months, setMonths] = useState<string[]>([]);
  const [currentMonth, setCurrentMonth] = useState<string>('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summaries, setSummaries] = useState<MonthSummary[]>([]);       // 全データ（支出欄用）
  const [chartSummaries, setChartSummaries] = useState<MonthSummary[]>([]); // フィルター済み（チャート用）
  const [showCapacityBanner, setShowCapacityBanner] = useState(false);
  const [tab, setTab] = useState<Tab>('graph');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'bank' | 'card'>('all');
  const [confirmDelete, setConfirmDelete] = useState<
    { type: 'month'; month: string } | { type: 'source'; month: string; source: 'bank' | 'card' } | { type: 'all' } | null
  >(null);
  const [editingTxnIdx, setEditingTxnIdx] = useState<number | null>(null);
  const [chartWindowEnd, setChartWindowEnd] = useState(-1); // -1 = 未初期化（最新月に追従）

  // 起動時リカバリー + 初期ロード
  useEffect(() => {
    recoverMeta();
    const ms = loadMonths();
    setMonths(ms);
    if (ms.length > 0) {
      const latest = ms.at(-1)!;
      setCurrentMonth(latest);
      setTransactions(loadTransactions(latest));
    }
    setShowCapacityBanner(storageUsageRatio() >= 0.8);
  }, []);

  // months 変更時: チャートウィンドウを最新月にリセット
  useEffect(() => {
    setChartWindowEnd(months.length - 1);
  }, [months]);

  // currentMonth 変更時: 全データのサマリーを更新（支出欄用）
  useEffect(() => {
    if (!currentMonth) return;
    const txns = loadTransactions(currentMonth);
    setTransactions(txns);
    setSummaries(months.map((m) => computeSummary(m, loadTransactions(m))));
  }, [currentMonth, months]);

  // チャートウィンドウ or sourceFilter 変更時: フィルター済みサマリーを更新（チャート用）
  useEffect(() => {
    if (!currentMonth || months.length === 0) return;
    const winEnd = chartWindowEnd >= 0 ? Math.min(chartWindowEnd, months.length - 1) : months.length - 1;
    const winStart = Math.max(0, winEnd - 5);
    const window = months.slice(winStart, winEnd + 1);
    setChartSummaries(window.map((m) => {
      const all = loadTransactions(m);
      const filtered = sourceFilter === 'all' ? all : all.filter((t) => t.source === sourceFilter);
      return computeSummary(m, filtered);
    }));
  }, [currentMonth, months, sourceFilter, chartWindowEnd]);

  const refreshAfterDelete = useCallback((deletedMonth?: string) => {
    const ms = loadMonths();
    setMonths(ms);
    if (ms.length === 0) {
      setCurrentMonth('');
      setTransactions([]);
      setSummaries([]);
      setChartSummaries([]);
    } else if (deletedMonth && deletedMonth === currentMonth && !ms.includes(deletedMonth)) {
      setCurrentMonth(ms.at(-1)!);
    }
    setConfirmDelete(null);
  }, [currentMonth]);

  const handleDeleteMonth = useCallback((month: string) => {
    deleteMonth(month);
    refreshAfterDelete(month);
  }, [refreshAfterDelete]);

  const handleDeleteBySource = useCallback((month: string, source: 'bank' | 'card') => {
    deleteMonthBySource(month, source);
    refreshAfterDelete(month);
  }, [refreshAfterDelete]);

  const handleDeleteAll = useCallback(() => {
    months.forEach((m) => deleteMonth(m));
    setMonths([]);
    setCurrentMonth('');
    setTransactions([]);
    setSummaries([]);
    setChartSummaries([]);
    setConfirmDelete(null);
  }, [months]);

  const refreshCurrentMonth = useCallback(() => {
    const txns = loadTransactions(currentMonth);
    setTransactions(txns);
    setSummaries(months.map((m) => computeSummary(m, loadTransactions(m))));
    const winEnd = chartWindowEnd >= 0 ? Math.min(chartWindowEnd, months.length - 1) : months.length - 1;
    const winStart = Math.max(0, winEnd - 5);
    setChartSummaries(months.slice(winStart, winEnd + 1).map((m) => {
      const all = loadTransactions(m);
      const filtered = sourceFilter === 'all' ? all : all.filter((t) => t.source === sourceFilter);
      return computeSummary(m, filtered);
    }));
  }, [currentMonth, months, sourceFilter, chartWindowEnd]);

  const handleImported = useCallback(
    (month: string, txns: Transaction[]) => {
      const ms = loadMonths();
      setMonths(ms);
      setCurrentMonth(month);
      setTransactions(txns);
      setShowCapacityBanner(storageUsageRatio() >= 0.8);
    },
    []
  );

  const currentSummary = summaries.find((s) => s.month === currentMonth);
  const prevSummary = summaries.find(
    (s) => s.month === months[months.indexOf(currentMonth) - 1]
  );
  const diff = currentSummary && prevSummary
    ? currentSummary.total - prevSummary.total
    : null;

  const hasData = months.length > 0;

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      <div className="w-full max-w-sm bg-white min-h-screen flex flex-col shadow-lg">
        {/* Header */}
        <header className="bg-gray-900 text-white px-4 py-3 flex items-center justify-between">
          <span className="text-lg font-black tracking-tight">{t.appName}</span>
          <AuthButton />
        </header>

        {/* Banners */}
        <IOSInstallBanner />
        {showCapacityBanner && (
          <StorageCapacityBanner onDismiss={() => setShowCapacityBanner(false)} />
        )}

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          {tab === 'graph' && (
            <div className="p-4 space-y-4">
              {/* Upload zone */}
              <CSVUpload onImported={handleImported} compact={hasData} />

              {/* Summary cards */}
              {hasData ? (
                <>
                  {/* サマリーカード（常に全データ） */}
                  <div className="border border-gray-200 rounded-md p-3">
                    <div className="text-xs text-gray-500 mb-1 text-center">{t.summary.thisMonth}</div>
                    <div className="text-lg font-bold text-gray-900 text-center tabular-nums">
                      ¥{(currentSummary?.total ?? 0).toLocaleString()}
                    </div>
                    {diff !== null && (
                      <div className={`text-xs text-center ${diff > 0 ? 'text-red-500' : 'text-green-600'}`}>
                        {t.summary.vsLastMonth(diff)}
                      </div>
                    )}
                    {currentSummary && (currentSummary.bySource.bank > 0 || currentSummary.bySource.card > 0) && (
                      <div className="flex gap-2 mt-2 pt-2 border-t border-gray-100">
                        {currentSummary.bySource.bank > 0 && (
                          <div className="flex-1 text-center">
                            <div className="flex items-center justify-center gap-1 mb-0.5">
                              <div className="w-2 h-2 rounded-sm bg-gray-900" />
                              <span className="text-xs text-gray-500">{t.summary.bank}</span>
                            </div>
                            <div className="text-sm font-bold text-gray-800 tabular-nums">
                              ¥{currentSummary.bySource.bank.toLocaleString()}
                            </div>
                          </div>
                        )}
                        {currentSummary.bySource.card > 0 && (
                          <div className="flex-1 text-center">
                            <div className="flex items-center justify-center gap-1 mb-0.5">
                              <div className="w-2 h-2 rounded-sm bg-gray-500" />
                              <span className="text-xs text-gray-500">{t.summary.card}</span>
                            </div>
                            <div className="text-sm font-bold text-gray-800 tabular-nums">
                              ¥{currentSummary.bySource.card.toLocaleString()}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* フィルターチップ + バーチャート */}
                  {chartSummaries.length > 0 && (() => {
                    const winEnd = chartWindowEnd >= 0 ? Math.min(chartWindowEnd, months.length - 1) : months.length - 1;
                    const winStart = Math.max(0, winEnd - 5);
                    const canOlder = winStart > 0;
                    const canNewer = winEnd < months.length - 1;

                    function shiftWindow(newEnd: number) {
                      const clampedEnd = Math.min(Math.max(newEnd, Math.min(5, months.length - 1)), months.length - 1);
                      setChartWindowEnd(clampedEnd);
                      const newStart = Math.max(0, clampedEnd - 5);
                      const newWindow = months.slice(newStart, clampedEnd + 1);
                      if (!newWindow.includes(currentMonth)) {
                        // 見えなくなった方向に応じて端の月を選択
                        setCurrentMonth(newEnd < winEnd ? months[clampedEnd] : months[newStart]);
                      }
                    }

                    return (
                      <div>
                        {/* 月ウィンドウナビゲーション */}
                        {months.length > 6 && (
                          <div className="flex items-center justify-between mb-2 px-1">
                            <button
                              onClick={() => shiftWindow(winEnd - 1)}
                              disabled={!canOlder}
                              className="text-xs text-gray-400 disabled:opacity-30 outline-none py-2 px-3"
                            >
                              {t.chart.olderMonths}
                            </button>
                            <span className="text-xs text-gray-300">
                              {months[winStart].slice(0, 7).replace('-', '/')} 〜 {months[winEnd].slice(0, 7).replace('-', '/')}
                            </span>
                            <button
                              onClick={() => shiftWindow(winEnd + 1)}
                              disabled={!canNewer}
                              className="text-xs text-gray-400 disabled:opacity-30 outline-none py-2 px-3"
                            >
                              {t.chart.newerMonths}
                            </button>
                          </div>
                        )}
                        {currentSummary && currentSummary.bySource.bank > 0 && currentSummary.bySource.card > 0 && (
                          <div className="flex gap-2 mb-3">
                            {(['all', 'bank', 'card'] as const).map((f) => (
                              <button
                                key={f}
                                onClick={() => setSourceFilter(f)}
                                className={`px-3 py-1 rounded-full text-xs font-medium border outline-none ${
                                  sourceFilter === f
                                    ? 'bg-gray-900 text-white border-gray-900'
                                    : 'bg-white text-gray-500 border-gray-300'
                                }`}
                              >
                                {f === 'all' ? t.summary.all : f === 'bank' ? t.summary.bank : t.summary.card}
                              </button>
                            ))}
                          </div>
                        )}
                        <MonthlyBarChart
                          data={chartSummaries}
                          currentMonth={currentMonth}
                          onMonthSelect={setCurrentMonth}
                        />
                      </div>
                    );
                  })()}

                  {/* Pie chart（フィルター済み） */}
                  {chartSummaries.find((s) => s.month === currentMonth) && (
                    <CategoryPieChart summary={chartSummaries.find((s) => s.month === currentMonth)!} />
                  )}

                  {/* Ad */}
                  <AdBanner />
                </>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-xs text-yellow-800">
                  {t.upload.hint}
                </div>
              )}
            </div>
          )}

          {tab === 'list' && (
            <div className="p-4">
              {/* 月選択 */}
              {hasData && (() => {
                const idx = months.indexOf(currentMonth);
                const canPrev = idx > 0;
                const canNext = idx < months.length - 1;
                const [y, m] = currentMonth ? currentMonth.split('-') : ['', ''];
                return (
                  <div className="flex items-center justify-center gap-4 mb-4 py-2 border-b border-gray-100">
                    <button
                      onClick={() => canPrev && setCurrentMonth(months[idx - 1])}
                      disabled={!canPrev}
                      className="w-11 h-11 flex items-center justify-center rounded-full border border-gray-200 text-gray-500 disabled:opacity-30 outline-none"
                    >
                      ‹
                    </button>
                    <span className="text-sm font-medium text-gray-700 w-24 text-center">
                      {t.settings.monthLabel(y, parseInt(m, 10))}
                    </span>
                    <button
                      onClick={() => canNext && setCurrentMonth(months[idx + 1])}
                      disabled={!canNext}
                      className="w-11 h-11 flex items-center justify-center rounded-full border border-gray-200 text-gray-500 disabled:opacity-30 outline-none"
                    >
                      ›
                    </button>
                  </div>
                );
              })()}
              {transactions.length === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <div className="text-gray-300 text-3xl">📂</div>
                  <div className="text-sm text-gray-500">{t.list.noData}</div>
                  <div className="text-xs text-gray-400">{t.list.noDataHint}</div>
                </div>
              ) : (
                <div className="space-y-1">
                  {[...transactions]
                    .map((t, i) => ({ t, i }))
                    .filter(({ t }) => t.amount > 0)
                    .sort((a, b) => b.t.date.localeCompare(a.t.date))
                    .map(({ t, i }) => (
                      <div
                        key={i}
                        className="flex items-center justify-between py-2 border-b border-gray-100"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-gray-400">{t.date}</div>
                          <div className="text-sm text-gray-700 truncate">{t.desc}</div>
                          {editingTxnIdx === i ? (
                            <select
                              autoFocus
                              value={t.category}
                              onChange={(e) => {
                                updateTransactionCategory(toMonthStr(t.date), i, e.target.value);
                                setEditingTxnIdx(null);
                                refreshCurrentMonth();
                              }}
                              onBlur={() => setEditingTxnIdx(null)}
                              className="text-xs border border-gray-300 rounded px-1 py-0.5 bg-white outline-none mt-0.5"
                            >
                              {allCategories().map((cat) => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                          ) : (
                            <button
                              onClick={() => setEditingTxnIdx(i)}
                              className="text-xs text-gray-400 border border-gray-200 rounded px-1.5 py-0.5 mt-0.5 outline-none"
                            >
                              {t.category}
                            </button>
                          )}
                        </div>
                        <div className="text-sm font-medium text-gray-900 ml-2 tabular-nums">
                          ¥{t.amount.toLocaleString()}
                        </div>
                      </div>
                    ))}
                </div>
              )}
              <AdBanner />
            </div>
          )}

          {tab === 'settings' && (
            <div className="p-4 space-y-6">
              {/* カテゴリ設定 */}
              <div>
                <div className="text-sm font-bold text-gray-700 mb-1">{t.settings.categoryTitle}</div>
                <p className="text-xs text-gray-400 mb-3">{t.settings.categoryDescription}</p>
                <CategorySettings />
              </div>

              {/* データ管理 */}
              <div>
                <div className="text-sm font-bold text-gray-700 mb-1">{t.settings.dataTitle}</div>
                <div className="text-xs text-gray-500 space-y-1 mb-3">
                  <p>{t.settings.localOnly}</p>
                  <p>{t.settings.noServer}</p>
                </div>
              </div>
              <div>
                  <div className="text-xs font-bold text-gray-600 mb-2">{t.settings.savedMonths}</div>
                  {[...months].reverse().map((m) => {
                    const txns = loadTransactions(m);
                    const hasBank = txns.some((t) => t.source === 'bank');
                    const hasCard = txns.some((t) => t.source === 'card');
                    const bankCount = txns.filter((t) => t.source === 'bank').length;
                    const cardCount = txns.filter((t) => t.source === 'card').length;
                    const isConfirmMonth = confirmDelete?.type === 'month' && confirmDelete.month === m;
                    const isConfirmBank = confirmDelete?.type === 'source' && confirmDelete.month === m && confirmDelete.source === 'bank';
                    const isConfirmCard = confirmDelete?.type === 'source' && confirmDelete.month === m && confirmDelete.source === 'card';

                    return (
                      <div key={m} className="py-2 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">
                            {t.settings.monthLabel(m.slice(0, 4), parseInt(m.slice(5), 10))}
                          </span>
                          {isConfirmMonth ? (
                            <div className="flex gap-1">
                              <button onClick={() => handleDeleteMonth(m)} className="px-2 py-1 text-xs bg-red-600 text-white rounded outline-none">{t.settings.confirmDelete}</button>
                              <button onClick={() => setConfirmDelete(null)} className="px-2 py-1 text-xs border border-gray-300 text-gray-500 rounded outline-none">{t.settings.cancelDelete}</button>
                            </div>
                          ) : (
                            <button onClick={() => setConfirmDelete({ type: 'month', month: m })} className="text-xs text-gray-400 border border-gray-200 px-2 py-1 rounded outline-none">
                              {t.settings.deleteMonth}
                            </button>
                          )}
                        </div>

                        {/* source 別削除（両方ある場合のみ） */}
                        {hasBank && hasCard && (
                          <div className="mt-1.5 flex gap-2">
                            <div className="flex items-center gap-1.5 flex-1">
                              <div className="w-2 h-2 rounded-sm bg-gray-900 flex-shrink-0" />
                              <span className="text-xs text-gray-500">{t.settings.bankCount(bankCount)}</span>
                              {isConfirmBank ? (
                                <div className="flex gap-1 ml-auto">
                                  <button onClick={() => handleDeleteBySource(m, 'bank')} className="px-2 py-0.5 text-xs bg-red-600 text-white rounded outline-none">{t.settings.confirmDelete}</button>
                                  <button onClick={() => setConfirmDelete(null)} className="px-2 py-0.5 text-xs border border-gray-300 text-gray-500 rounded outline-none">{t.settings.cancelDelete}</button>
                                </div>
                              ) : (
                                <button onClick={() => setConfirmDelete({ type: 'source', month: m, source: 'bank' })} className="ml-auto text-xs text-gray-400 border border-gray-200 px-2 py-0.5 rounded outline-none">{t.settings.deleteSource}</button>
                              )}
                            </div>
                          </div>
                        )}
                        {hasBank && hasCard && (
                          <div className="mt-1 flex gap-2">
                            <div className="flex items-center gap-1.5 flex-1">
                              <div className="w-2 h-2 rounded-sm bg-gray-500 flex-shrink-0" />
                              <span className="text-xs text-gray-500">{t.settings.cardCount(cardCount)}</span>
                              {isConfirmCard ? (
                                <div className="flex gap-1 ml-auto">
                                  <button onClick={() => handleDeleteBySource(m, 'card')} className="px-2 py-0.5 text-xs bg-red-600 text-white rounded outline-none">{t.settings.confirmDelete}</button>
                                  <button onClick={() => setConfirmDelete(null)} className="px-2 py-0.5 text-xs border border-gray-300 text-gray-500 rounded outline-none">{t.settings.cancelDelete}</button>
                                </div>
                              ) : (
                                <button onClick={() => setConfirmDelete({ type: 'source', month: m, source: 'card' })} className="ml-auto text-xs text-gray-400 border border-gray-200 px-2 py-0.5 rounded outline-none">{t.settings.deleteSource}</button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  <div className="mt-4">
                    {confirmDelete?.type === 'all' ? (
                      <div className="flex gap-2">
                        <button
                          onClick={handleDeleteAll}
                          className="flex-1 py-2 text-sm bg-red-600 text-white rounded outline-none"
                        >
                          {t.settings.confirmDeleteAll}
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="flex-1 py-2 text-sm border border-gray-300 text-gray-500 rounded outline-none"
                        >
                          {t.settings.cancelDeleteAll}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete({ type: 'all' })}
                        className="w-full py-2 text-sm text-red-500 border border-red-200 rounded outline-none"
                      >
                        {t.settings.deleteAll}
                      </button>
                    )}
                  </div>
                </div>
              <AdBanner />
            </div>
          )}
        </main>

        {/* Bottom nav */}
        <nav className="border-t border-gray-200 flex">
          {(
            [
              { key: 'graph', icon: '📊', label: t.nav.graph },
              { key: 'list', icon: '📋', label: t.nav.list },
              { key: 'settings', icon: '⚙️', label: t.nav.settings },
            ] as const
          ).map(({ key, icon, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 py-2 text-center outline-none ${
                tab === key ? 'text-gray-900 font-bold' : 'text-gray-400'
              }`}
            >
              <div className="text-lg">{icon}</div>
              <div className="text-xs">{label}</div>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
