// Shared design tokens for the monochrome HUD look, used by every component.
export const theme = {
  bg: "#181310",
  panel: "#201A14",
  border: "#4A4332",
  ink: "#C9BE96",
  inkMuted: "#8C8468",
  inkFaint: "#5C5642",
  accent: "#C1502E",
  dot: "rgba(201,190,150,0.05)",
};

export function hexA(hex: string, a: number) {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

export const notch = (size = 14) =>
  `polygon(0 0, calc(100% - ${size}px) 0, 100% ${size}px, 100% 100%, ${size}px 100%, 0 calc(100% - ${size}px))`;

export function dayDiff(target: Date, now: Date) {
  const t = new Date(target); t.setHours(0, 0, 0, 0);
  const n = new Date(now); n.setHours(0, 0, 0, 0);
  return Math.round((t.getTime() - n.getTime()) / 86400000);
}

export function formatDue(target: Date, now: Date) {
  const d = dayDiff(target, now);
  if (d < 0) return "OVERDUE";
  if (d === 0) return "DUE TODAY";
  if (d === 1) return "DUE TOMORROW";
  return `DUE IN ${d} DAYS`;
}

export const isUrgent = (target: Date, now: Date) => dayDiff(target, now) <= 1;

export const peso = (n: number) =>
  Math.abs(n).toLocaleString("en-PH", { minimumFractionDigits: 2 });

export const clock = (d: Date) =>
  d.toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit" }).toUpperCase();
