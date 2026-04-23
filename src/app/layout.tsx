import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "moneco",
  description: "銀行CSVをアップロードするだけで支出グラフが表示されます。登録不要、データはデバイスから出ません。",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full">
      <body className="min-h-full flex flex-col bg-gray-100">{children}</body>
    </html>
  );
}
