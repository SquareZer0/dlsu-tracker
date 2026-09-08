import { theme, notch } from "@/lib/theme";

export function Panel({
  children, className = "", style = {},
}: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`border ${className}`}
      style={{ backgroundColor: theme.panel, borderColor: theme.border, clipPath: notch(14), ...style }}
    >
      {children}
    </div>
  );
}
