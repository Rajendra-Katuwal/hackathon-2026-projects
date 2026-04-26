import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CareSync AI",
  description: "AI-powered care coordination dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className="min-h-full bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}
