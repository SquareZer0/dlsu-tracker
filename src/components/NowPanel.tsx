"use client";
import { useEffect, useState } from "react";
import { useNow } from "@/lib/hooks";
import { Panel } from "./Panel";
import { StatRow } from "./StatRow";
import { theme, hexA, clock } from "@/lib/theme";
import type { ClassBlock, Assignment } from "@/lib/types";

export function NowPanel() {
  const now = useNow();
  const [blocks, setBlocks] = useState<ClassBlock[]>([]);
  const [pending, setPending] = useState(0);

  useEffect(() => {
    fetch("/api/schedule").then((r) => r.json()).then(setBlocks);
    fetch("/api/assignments").then((r) => r.json()).then((a: Assignment[]) => setPending(a.filter((x) => !x.done).length));
  }, []);

  const mkTime = (mins: number) => { const d = new Date(now); d.setHours(0, 0, 0, 0); d.setMinutes(mins); return d; };
  const today = blocks
    .filter((b) => b.weekday === now.getDay())
    .map((b) => ({ ...b, start: mkTime(b.startMin), end: mkTime(b.endMin) }));
  const current = today.find((b) => now >= b.start && now < b.end);
  const next = today.find((b) => b.start > now);
  const classPct = current ? ((now.getTime() - current.start.getTime()) / (current.end.getTime() - current.start.getTime())) * 100 : 0;
  const segments = 28;
  const filled = Math.round((classPct / 100) * segments);

  return (
    <Panel className="relative overflow-hidden flex-1 flex flex-col px-6 py-6">
      <div
        className="absolute inset-x-0 top-0 h-16 pointer-events-none"
        style={{ background: `linear-gradient(to bottom, transparent, ${hexA(theme.ink, 0.06)}, transparent)`, animation: "scan 7s linear infinite" }}
      />
      <div className="relative flex-1 flex flex-col justify-between">
        <div>
          <p className="text-xs tracking-widest mb-1" style={{ color: theme.inkMuted }}>NOW</p>
          <h1 className="text-2xl md:text-3xl font-semibold uppercase tracking-tight">
            {today.length === 0 ? "No classes today" : current ? current.course : "Free period"}
          </h1>
          <p className="text-sm mt-1 mb-4" style={{ color: theme.inkMuted }}>
            {today.length === 0
              ? "Nothing on the weekly pattern for today."
              : current
              ? `${current.room ? current.room + " · " : ""}in session until ${clock(current.end)}`
              : next ? `Next: ${next.course} at ${clock(next.start)}` : "Nothing left scheduled today."}
          </p>
          {current && (
            <div className="flex gap-[2px] mb-4">
              {Array.from({ length: segments }).map((_, i) => (
                <div key={i} className="h-2 flex-1" style={{ backgroundColor: i < filled ? theme.accent : theme.border }} />
              ))}
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-x-8 max-w-md">
          <StatRow label="ASSIGNMENTS PENDING" value={pending} />
          <StatRow label="TERM WEEK" value="02" />
        </div>
      </div>
    </Panel>
  );
}
