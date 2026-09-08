"use client";
import { TopBar } from "@/components/TopBar";
import { FinancePanel } from "@/components/FinancePanel";
import { BottomTabBar } from "@/components/BottomTabBar";

export default function FinancePage() {
  return (
    <div className="max-w-5xl mx-auto px-6 md:px-10 py-8">
      <TopBar showBreadcrumb={false} />
      <FinancePanel />
      <BottomTabBar />
    </div>
  );
}
