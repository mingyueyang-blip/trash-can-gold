import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "炼金炉 · The Alchemy Cube",
  description: "只管投喂，剩下的交给 AI。个人知识中转站。",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "炼金炉",
  },
};

export const viewport: Viewport = {
  themeColor: "#E0C3FC",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="apple-touch-icon" href="/icon.svg" />
      </head>
      <body className="antialiased min-h-screen bg-gradient-to-br from-[#E0C3FC] to-[#8EC5FC]">
        {children}
      </body>
    </html>
  );
}
