"use client";
import { TopBar } from "@/components/TopBar";
import { WorkoutPanel } from "@/components/WorkoutPanel";
import { BottomTabBar } from "@/components/BottomTabBar";

export default function WorkoutPage() {
  return (
    <div className="max-w-5xl mx-auto xl:mx-0 px-6 md:px-10 py-8">
      <TopBar showBreadcrumb={false} />
      <WorkoutPanel />
      <BottomTabBar />
    </div>
  );
}
