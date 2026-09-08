"use client";
import { TopBar } from "@/components/TopBar";
import { AssignmentsPanel } from "@/components/AssignmentsPanel";
import { BottomTabBar } from "@/components/BottomTabBar";

export default function AssignmentsPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 md:px-10 py-8">
      <TopBar showBreadcrumb={false} />
      <AssignmentsPanel />
      <BottomTabBar />
    </div>
  );
}
