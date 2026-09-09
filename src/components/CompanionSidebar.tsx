"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Bot, X } from "lucide-react";
import { useIsXl } from "@/lib/hooks";
import { useTheme } from "@/lib/theme-context";
import { notch } from "@/lib/theme";
import InsightCompanion from "./InsightCompanion";

// At xl+ the companion docks as a fixed 256px sidebar (original layout).
// Below xl there's no room for a permanent column, so it becomes a
// floating toggle button that opens the same component full-screen.
export function CompanionSidebar() {
  const pathname = usePathname();
  const theme = useTheme();
  const isXl = useIsXl();
  const [open, setOpen] = useState(false);

  if (pathname === "/login" || isXl === null) return null;

  if (isXl) {
    return (
      <div className="fixed top-0 left-0 z-40" style={{ width: 256, height: "100vh" }}>
        <InsightCompanion />
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close companion" : "Open companion"}
        className="xl:hidden fixed right-4 z-[60] flex items-center justify-center border bottom-20 md:bottom-6"
        style={{
          width: 48, height: 48,
          backgroundColor: theme.panel, borderColor: theme.border, color: theme.ink,
          clipPath: notch(10),
        }}
      >
        {open ? <X size={20} /> : <Bot size={20} />}
      </button>
      {open && (
        <div className="xl:hidden fixed inset-0 z-50" style={{ backgroundColor: theme.bg }}>
          <InsightCompanion />
        </div>
      )}
    </>
  );
}
