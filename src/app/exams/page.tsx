"use client";
import { TopBar } from "@/components/TopBar";
import { ExamsPanel } from "@/components/ExamsPanel";
import { BottomTabBar } from "@/components/BottomTabBar";

export default function ExamsPage() {
  return (
    <div className="max-w-5xl mx-auto xl:mx-0 px-6 md:px-10 py-8">
      <TopBar showBreadcrumb={false} />
      <ExamsPanel />
      <BottomTabBar />
    </div>
  );
}
