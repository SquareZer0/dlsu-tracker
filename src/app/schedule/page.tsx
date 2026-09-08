"use client";
import { TopBar } from "@/components/TopBar";
import { ScheduleTimeline } from "@/components/ScheduleTimeline";
import { BottomTabBar } from "@/components/BottomTabBar";

export default function SchedulePage() {
  return (
    <div className="max-w-5xl mx-auto px-6 md:px-10 py-8">
      <TopBar showBreadcrumb={false} />
      <ScheduleTimeline />
      <BottomTabBar />
    </div>
  );
}
