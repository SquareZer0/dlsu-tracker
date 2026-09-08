"use client";
import { useEffect, useState } from "react";
import { CalendarClock } from "lucide-react";
import { useNow } from "@/lib/hooks";
import { Panel } from "./Panel";
import { SectionHeader } from "./SectionHeader";
import { useTheme } from "@/lib/theme-context";
import type { ClassBlock } from "@/lib/types";

export function ScheduleTimeline() {
  const theme = useTheme();
  const now = useNow();
  const [blocks, setBlocks] = useState<ClassBlock[]>([]);

  useEffect(() => { fetch("/api/schedule").then((r) => r.json()).then(setBlocks); }, []);

  const mkTime = (mins: number) => { const d = new Date(now); d.setHours(0, 0, 0, 0); d.setMinutes(mins); return d; };
  const dayStart = mkTime(7 * 60);
  const dayEnd = mkTime(19 * 60);
  const today = blocks
    .filter((b) => b.weekday === now.getDay())
    .map((b) => ({ ...b, start: mkTime(b.startMin), end: mkTime(b.endMin) }));
  const current = today.find((b) => now >= b.start && now < b.end);
  const nowPct = Math.min(100, Math.max(0, ((now.getTime() - dayStart.getTime()) / (dayEnd.getTime() - dayStart.getTime())) * 100));

  return (
    <Panel className="px-5 pt-8 pb-4 mb-8">
      <SectionHeader icon={<CalendarClock size={14} />} label="TODAY'S SCHEDULE" />
      {today.length === 0 ? (
        <p className="text-sm py-3" style={{ color: theme.inkMuted }}>NO CLASSES SCHEDULED TODAY</p>
      ) : (
        <>
          <div className="relative h-10">
            {today.map((s) => {
              const left = ((s.start.getTime() - dayStart.getTime()) / (dayEnd.getTime() - dayStart.getTime())) * 100;
              const width = ((s.end.getTime() - s.start.getTime()) / (dayEnd.getTime() - dayStart.getTime())) * 100;
              const active = current && s.course === current.course;
              return (
                <div key={s.id} className="absolute top-0 h-full flex items-center px-2 text-xs whitespace-nowrap overflow-hidden border"
                  style={{ left: `${left}%`, width: `${width}%`, backgroundColor: active ? theme.accent : "transparent", borderColor: active ? theme.accent : theme.border, color: active ? theme.bg : theme.inkMuted }}>
                  {s.course}
                </div>
              );
            })}
            <div className="absolute top-[-6px]" style={{ left: `${nowPct}%`, transition: "left 0.7s ease-linear" }}>
              <div className="w-px h-[52px]" style={{ backgroundColor: theme.accent }} />
              <div className="w-1.5 h-1.5 rounded-full -ml-[3px] -mt-[3px]" style={{ backgroundColor: theme.accent, animation: "glowPulse 2s ease-in-out infinite" }} />
            </div>
          </div>
          <div className="flex justify-between text-xs mt-2 tabular-nums" style={{ color: theme.inkFaint }}>
            <span>7AM</span><span>10AM</span><span>1PM</span><span>4PM</span><span>7PM</span>
          </div>
        </>
      )}
    </Panel>
  );
}
