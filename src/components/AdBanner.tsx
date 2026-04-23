'use client';

import { useEffect, useRef } from 'react';

// TODO: 取得後にこの値を実際のパブリッシャーIDに置き換える
const PUBLISHER_ID = 'ca-pub-XXXXXXXXXXXXXXXXX';
const IS_PLACEHOLDER = PUBLISHER_ID === 'ca-pub-XXXXXXXXXXXXXXXXX';

export default function AdBanner() {
  const ref = useRef<HTMLModElement>(null);

  useEffect(() => {
    if (IS_PLACEHOLDER) return;
    try {
      // @ts-expect-error adsbygoogle is injected by AdSense script
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // ignore
    }
  }, []);

  if (IS_PLACEHOLDER) {
    return (
      <div className="w-full h-14 bg-gray-100 border border-dashed border-gray-300 rounded flex items-center justify-center">
        <span className="text-xs text-gray-400">広告スペース（320×50）</span>
      </div>
    );
  }

  return (
    <ins
      ref={ref}
      className="adsbygoogle block"
      style={{ display: 'block', width: '100%', height: 50 }}
      data-ad-client={PUBLISHER_ID}
      data-ad-slot="AUTO"
      data-ad-format="horizontal"
      data-full-width-responsive="false"
    />
  );
}
