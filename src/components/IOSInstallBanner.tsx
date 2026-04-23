'use client';

import { useEffect, useState } from 'react';

/**
 * iOS Safari でのみ表示するホーム画面追加バナー。
 * localStorage は Safari とホーム画面PWAで完全に分離されているため、
 * データ入力前にPWAインストールを促す必要がある。
 */
export default function IOSInstallBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const dismissed = sessionStorage.getItem('moneco:ios-banner-dismissed');
    if (isIOS && !isStandalone && !dismissed) {
      setShow(true);
    }
  }, []);

  if (!show) return null;

  return (
    <div className="bg-blue-50 border-b border-blue-200 px-4 py-3 text-xs text-blue-800">
      <div className="font-bold mb-0.5">ホーム画面に追加するとデータが保持されます</div>
      <div>Safari の「共有」→「ホーム画面に追加」でアプリとして使えます。</div>
      <button
        className="mt-1.5 underline"
        onClick={() => {
          sessionStorage.setItem('moneco:ios-banner-dismissed', '1');
          setShow(false);
        }}
      >
        閉じる
      </button>
    </div>
  );
}
