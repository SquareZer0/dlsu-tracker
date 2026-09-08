"use client";
import { notch } from "@/lib/theme";
import { useTheme } from "@/lib/theme-context";

export function Panel({
  children, className = "", style = {},
}: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  const theme = useTheme();
  return (
    <div
      className={`border ${className}`}
      style={{ backgroundColor: theme.panel, borderColor: theme.border, clipPath: notch(14), ...style }}
    >
      {children}
    </div>
  );
}
