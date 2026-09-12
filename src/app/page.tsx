"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Sunrise, Sun, Sunset, Moon } from "lucide-react";
import { useIsDesktop } from "@/lib/hooks";
import { useTheme } from "@/lib/theme-context";
import { pickGreeting, type Period } from "@/lib/greetings";
import { TopBar } from "@/components/TopBar";
import { NowPanel } from "@/components/NowPanel";
import { SongPanel } from "@/components/SongPanel";
import { AssignmentsPanel } from "@/components/AssignmentsPanel";
import { ExamsPanel } from "@/components/ExamsPanel";
import { FinancePanel } from "@/components/FinancePanel";
import { WorkoutPanel } from "@/components/WorkoutPanel";
import { ScheduleTimeline } from "@/components/ScheduleTimeline";
import { BottomTabBar } from "@/components/BottomTabBar";
import { MiniCalendarPanel } from "@/components/MiniCalendarPanel";
import { GCalSideRail } from "@/components/AgendaPanel";
import type { GCalEvent } from "@/lib/gcal";

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

type GCalResponse = {
  isLive: boolean;
  statusMessage: string;
  todayKey: string;
  tomorrowKey: string;
  eventsByDate: Record<string, { count: number; events: GCalEvent[] }>;
  today: GCalEvent[];
  tomorrow: GCalEvent[];
};

export default function HomePage() {
  const theme = useTheme();
  const isDesktop = useIsDesktop();
  const [greeting] = useState(() => pickGreeting());
  const GreetingIcon = greetingIcons[greeting.period];

  const now = new Date();
  const todayKeyFallback = now.toLocaleDateString("en-CA");
  const tomorrowObj = new Date(now);
  tomorrowObj.setDate(tomorrowObj.getDate() + 1);
  const tomorrowKeyFallback = tomorrowObj.toLocaleDateString("en-CA");

  const [gcalData, setGcalData] = useState<GCalResponse | null>(null);
  const [selectedKey, setSelectedKey] = useState<string>(todayKeyFallback);

  useEffect(() => {
    fetch("/api/gcal")
      .then((r) => r.json())
      .then((data: GCalResponse) => {
        setGcalData(data);
        if (data.todayKey) {
          setSelectedKey(data.todayKey);
        }
      })
      .catch((err) => console.error("Error loading GCal events:", err));
  }, []);

  // null briefly while we detect viewport — avoids flashing the wrong layout
  if (isDesktop === null) return null;

  return (
    <div className="max-w-5xl xl:max-w-[1400px] mx-auto xl:mx-0 px-6 md:px-10 py-8 pb-28 md:pb-8">
      <TopBar showBreadcrumb={isDesktop} />

      <div className="flex flex-col xl:flex-row gap-8 items-start">
        {/* Main Left Column (Preserved identical to original layout) */}
        <div className="flex-1 w-full max-w-5xl min-w-0">
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

          <div className="mb-8">
            <WorkoutPanel />
          </div>
        </div>

        {/* Right Side Rail Column (Mini Calendar + Today & Tomorrow Panels) */}
        <aside className="w-full xl:w-[350px] shrink-0">
          <MiniCalendarPanel
            eventsByDate={gcalData?.eventsByDate ?? {}}
            todayKey={gcalData?.todayKey ?? todayKeyFallback}
            selectedKey={selectedKey}
            onSelectDate={setSelectedKey}
            isLive={gcalData?.isLive ?? false}
            statusMessage={gcalData?.statusMessage}
          />

          <GCalSideRail
            todayEvents={gcalData?.today ?? []}
            tomorrowEvents={gcalData?.tomorrow ?? []}
            selectedKey={selectedKey}
            todayKey={gcalData?.todayKey ?? todayKeyFallback}
            tomorrowKey={gcalData?.tomorrowKey ?? tomorrowKeyFallback}
            selectedEvents={gcalData?.eventsByDate[selectedKey]?.events ?? []}
            onResetDate={() => setSelectedKey(gcalData?.todayKey ?? todayKeyFallback)}
          />
        </aside>
      </div>

      <BottomTabBar />
    </div>
  );
}

