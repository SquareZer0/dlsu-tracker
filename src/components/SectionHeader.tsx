"use client";
import { useTheme } from "@/lib/theme-context";

export function SectionHeader({
  icon, label, right,
}: { icon: React.ReactNode; label: string; right?: React.ReactNode }) {
  const theme = useTheme();
  return (
    <div className="flex items-center justify-between pb-2 mb-3 border-b border-dashed" style={{ borderColor: theme.border }}>
      <div className="flex items-center gap-2 text-xs font-medium tracking-widest" style={{ color: theme.ink }}>
        {icon} {label}
      </div>
      {right}
    </div>
  );
}
