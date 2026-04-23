'use client';

import { useState, useEffect, useRef } from 'react';
import { DEFAULT_CATEGORIES } from '@/types';
import type { Category } from '@/types';
import {
  loadCustomRules,
  addKeyword,
  removeKeyword,
  addCustomCategory,
  removeCustomCategory,
  allCategories,
  type CustomRules,
} from '@/lib/category/customRules';

export default function CategorySettings() {
  const [rules, setRules] = useState<CustomRules | null>(null);
  const [cats, setCats] = useState<string[]>([]);
  const [openCat, setOpenCat] = useState<string | null>(null);
  const [kwInput, setKwInput] = useState('');
  const [newCatInput, setNewCatInput] = useState('');
  const kwInputRef = useRef<HTMLInputElement>(null);

  function reload() {
    setRules(loadCustomRules());
    setCats(allCategories());
  }

  useEffect(() => { reload(); }, []);

  if (!rules) return null;

  function handleAddKeyword(category: Category) {
    const kw = kwInput.trim();
    if (!kw) return;
    addKeyword(category, kw);
    reload();
    setKwInput('');
    kwInputRef.current?.focus();
  }

  function handleAddCategory() {
    const name = newCatInput.trim();
    if (!name) return;
    addCustomCategory(name);
    reload();
    setNewCatInput('');
  }

  return (
    <div className="space-y-1">
      {cats.map((cat) => {
        const keywords = rules[cat] ?? [];
        const isOpen = openCat === cat;
        const isCustom = !DEFAULT_CATEGORIES.includes(cat);

        return (
          <div key={cat} className="border border-gray-200 rounded-md overflow-hidden">
            <button
              onClick={() => { setOpenCat(isOpen ? null : cat); setKwInput(''); }}
              className="w-full flex items-center justify-between px-3 py-2.5 outline-none text-left"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-800">{cat}</span>
                {keywords.length > 0 && (
                  <span className="text-xs text-gray-400">キーワード {keywords.length}件</span>
                )}
                {isCustom && (
                  <span className="text-xs text-gray-300 border border-gray-200 rounded px-1">カスタム</span>
                )}
              </div>
              <span className="text-gray-400 text-xs">{isOpen ? '▲' : '▼'}</span>
            </button>

            {isOpen && (
              <div className="border-t border-gray-100 bg-gray-50 px-3 py-2 space-y-2">
                {/* キーワード一覧 */}
                {keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {keywords.map((kw) => (
                      <div key={kw} className="flex items-center gap-1 bg-white border border-gray-200 rounded-full px-2 py-0.5">
                        <span className="text-xs text-gray-700">{kw}</span>
                        <button onClick={() => { removeKeyword(cat, kw); reload(); }} className="text-gray-400 text-xs outline-none">✕</button>
                      </div>
                    ))}
                  </div>
                )}

                {/* キーワード追加（その他以外） */}
                {cat !== 'その他' && (
                  <div className="flex gap-2">
                    <input
                      ref={kwInputRef}
                      type="text"
                      value={kwInput}
                      onChange={(e) => setKwInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword(cat)}
                      placeholder="キーワードを追加（例: マツキヨ）"
                      className="flex-1 text-xs border border-gray-200 rounded px-2 py-1.5 outline-none bg-white"
                    />
                    <button onClick={() => handleAddKeyword(cat)} className="text-xs bg-gray-900 text-white px-3 py-1.5 rounded outline-none">追加</button>
                  </div>
                )}

                {/* カスタムカテゴリ削除 */}
                {isCustom && (
                  <button
                    onClick={() => { removeCustomCategory(cat); reload(); if (openCat === cat) setOpenCat(null); }}
                    className="text-xs text-red-400 border border-red-200 px-2 py-1 rounded outline-none"
                  >
                    このカテゴリを削除
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* カテゴリ追加 */}
      <div className="flex gap-2 pt-2">
        <input
          type="text"
          value={newCatInput}
          onChange={(e) => setNewCatInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
          placeholder="新しいカテゴリ名"
          className="flex-1 text-xs border border-gray-200 rounded px-2 py-1.5 outline-none bg-white"
        />
        <button onClick={handleAddCategory} className="text-xs bg-gray-900 text-white px-3 py-1.5 rounded outline-none">追加</button>
      </div>
    </div>
  );
}
