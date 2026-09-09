"use client";
import { usePathname } from "next/navigation";
import InsightCompanion from "./InsightCompanion";

// Thin visibility wrapper around the ported InsightCompanion — hidden on
// the login screen and on narrow viewports where a fixed 320px column
// would break the mobile layout. InsightCompanion itself is untouched.
export function CompanionSidebar() {
  const pathname = usePathname();
  if (pathname === "/login") return null;
  return (
    <div className="hidden xl:block shrink-0">
      <InsightCompanion />
    </div>
  );
}
