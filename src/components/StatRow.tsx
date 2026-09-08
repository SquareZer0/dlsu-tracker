"use client";
import { useTheme } from "@/lib/theme-context";

export function StatRow({
  label, value, valueColor, pulse,
}: { label: string; value: string | number; valueColor?: string; pulse?: boolean }) {
  const theme = useTheme();
  return (
    <div className="flex items-baseline gap-2 text-xs py-1">
      <span style={{ color: theme.inkMuted }}>{label}</span>
      <span className="flex-1 border-b border-dotted" style={{ borderColor: theme.border, marginBottom: 3 }} />
      <span className="tabular-nums" style={{ color: valueColor || theme.ink, animation: pulse ? "pop 0.4s ease" : "none" }}>
        {value}
      </span>
    </div>
  );
}
