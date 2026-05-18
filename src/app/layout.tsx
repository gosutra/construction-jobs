import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "건설현장 인력 플랫폼",
  description: "건설현장 구직자와 구인업체를 자동으로 연결합니다",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
