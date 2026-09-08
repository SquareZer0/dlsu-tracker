"use client";
import Link from "next/link";
import { useState } from "react";
import { Sunrise, Sun, Sunset, Moon } from "lucide-react";
import { useIsDesktop } from "@/lib/hooks";
import { theme } from "@/lib/theme";
import { pickGreeting, type Period } from "@/lib/greetings";
import { TopBar } from "@/components/TopBar";
import { NowPanel } from "@/components/NowPanel";
import { SongPanel } from "@/components/SongPanel";
import { AssignmentsPanel } from "@/components/AssignmentsPanel";
import { ExamsPanel } from "@/components/ExamsPanel";
import { FinancePanel } from "@/components/FinancePanel";
import { ScheduleTimeline } from "@/components/ScheduleTimeline";
import { BottomTabBar } from "@/components/BottomTabBar";

const links = [
  { href: "/assignments", label: "Assignments" },
  { href: "/exams", label: "Exams" },
  { href: "/finance", label: "Finance" },
  { href: "/schedule", label: "Schedule" },
];

const greetingIcons: Record<Period, typeof Sun> = {
  morning: Sunrise,
  afternoon: Sun,
  evening: Sunset,
  night: Moon,
};

export default function HomePage() {
  const isDesktop = useIsDesktop();
  const [greeting] = useState(() => pickGreeting());
  const GreetingIcon = greetingIcons[greeting.period];

  // null briefly while we detect viewport — avoids flashing the wrong layout
  if (isDesktop === null) return null;

  return (
    <div className="max-w-5xl mx-auto px-6 md:px-10 py-8">
      <TopBar showBreadcrumb={isDesktop} />
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1 flex flex-col min-w-0">
          <h1 className="flex items-center gap-3 text-2xl md:text-3xl font-semibold tracking-tight mb-4" style={{ color: theme.ink }}>
            {greeting.text}
            <GreetingIcon size={24} style={{ color: theme.inkMuted }} />
          </h1>
          <NowPanel />
        </div>
        <SongPanel />
      </div>
      {isDesktop ? (
        <>
          <AssignmentsPanel />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <ExamsPanel />
            <FinancePanel />
          </div>
          <ScheduleTimeline />
        </>
      ) : (
        <div className="grid grid-cols-2 gap-3 mb-8">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="border px-4 py-5 text-xs tracking-widest text-center uppercase"
              style={{ borderColor: theme.border, color: theme.ink }}>
              {l.label}
            </Link>
          ))}
        </div>
      )}
      <BottomTabBar />
    </div>
  );
}
