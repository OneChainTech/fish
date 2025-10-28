import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { AppShell } from "@/components/layout/AppShell";
import { PWAInstaller } from "@/components/PWAInstaller";

export const metadata: Metadata = {
  title: "有口",
  applicationName: "有口",
  description: "拍照识鱼、解锁专属图鉴进度的移动端应用",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-192.png", sizes: "192x192" }],
    shortcut: [
      { url: "/icons/icon-192.png" },
      { url: "/icons/icon-512.png" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="bg-slate-50 text-slate-900">
        <PWAInstaller />
        <AppShell>{children}</AppShell>
        <SpeedInsights />
      </body>
    </html>
  );
}
