import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kode — The Programming Language Built for AI Agents",
  description: "Token-efficient, full-stack programming language. 48% fewer tokens than Python.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <body className="bg-[#050510] text-zinc-200 min-h-[100dvh] overflow-x-hidden" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
