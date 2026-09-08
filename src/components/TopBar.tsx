"use client";
import { useNow } from "@/lib/hooks";
import { clock, theme } from "@/lib/theme";
import { SyncButton } from "./SyncButton";

export function TopBar({ showBreadcrumb = true }: { showBreadcrumb?: boolean }) {
  const now = useNow();
  return (
    <div
      className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-6 border-b border-dashed text-xs uppercase tracking-widest"
      style={{ borderColor: theme.border }}
    >
      {showBreadcrumb ? (
        <div className="flex flex-wrap gap-x-4 gap-y-1" style={{ color: theme.inkMuted }}>
          <span>/ Assignments:</span><span>/ Exams:</span><span>/ Schedule:</span><span>/ Finance:</span>
        </div>
      ) : <div />}
      <div className="flex items-center gap-3">
        <SyncButton />
        <span className="tabular-nums" style={{ color: theme.ink }}>{clock(now)}</span>
      </div>
    </div>
  );
}
