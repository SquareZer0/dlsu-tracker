import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono } from "next/font/google";
import { ThemeProvider } from "@/lib/theme-context";
import { MusicProvider } from "@/lib/music-context";
import { CompanionSidebar } from "@/components/CompanionSidebar";
import "./globals.css";

const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "DLSU Tracker",
  description: "Assignments, exams, schedule, and finances in one place.",
  appleWebApp: { title: "DLSU Tracker", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#181310",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${mono.variable} font-mono min-h-screen pb-16 md:pb-0`}>
        <ThemeProvider>
          <MusicProvider>
            {/* CompanionSidebar is position:fixed (stays put while the page
                scrolls) — the xl:ml-64 below just reserves its 256px width
                so dashboard content doesn't render underneath it. */}
            <CompanionSidebar />
            <div className="xl:ml-64 min-w-0">{children}</div>
          </MusicProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
