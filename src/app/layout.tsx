import type { Metadata } from "next";
import { IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "DLSU Tracker",
  description: "Assignments, exams, schedule, and finances in one place.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${mono.variable} font-mono min-h-screen pb-16 md:pb-0`}>{children}</body>
    </html>
  );
}
