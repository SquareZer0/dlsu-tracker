"use client";
import { useEffect, useState } from "react";
import { Circle, ListChecks, Sparkles } from "lucide-react";
import { useNow } from "@/lib/hooks";
import { Panel } from "./Panel";
import { SectionHeader } from "./SectionHeader";
import { StatRow } from "./StatRow";
import { theme, hexA, formatDue, isUrgent, clock } from "@/lib/theme";
import type { Assignment } from "@/lib/types";

function dueDateTime(d: Date) {
  return `${d.toLocaleDateString("en-PH", { month: "short", day: "numeric" }).toUpperCase()} ${clock(d)}`;
}

export function AssignmentsPanel() {
  const now = useNow(30000);
  const [items, setItems] = useState<Assignment[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [pulse, setPulse] = useState(false);

  const load = () => fetch("/api/assignments").then((r) => r.json()).then((data: Assignment[]) => {
    setItems(data);
    setSelectedId((cur) => cur ?? data[0]?.id ?? null);
  });

  useEffect(() => { load(); }, []);

  const selected = items.find((a) => a.id === selectedId) ?? items[0];
  const doneCount = items.filter((a) => a.done).length;

  const toggleDone = async (a: Assignment) => {
    await fetch("/api/assignments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: a.id, done: !a.done }),
    });
    setPulse(true);
    setTimeout(() => setPulse(false), 400);
    load();
  };

  if (!selected) {
    return (
      <Panel className="px-6 py-5 mb-8">
        <p className="text-sm" style={{ color: theme.inkMuted }}>No assignments yet — try Sync Canvas.</p>
      </Panel>
    );
  }

  const selectedDue = new Date(selected.dueAt);

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
      <Panel className="md:col-span-2 px-4 py-4">
        <SectionHeader
          icon={<ListChecks size={14} />} label="ASSIGNMENTS"
          right={<span className="text-xs tabular-nums" style={{ color: theme.inkFaint }}>{doneCount}/{items.length}</span>}
        />
        {items.length > 0 && doneCount === items.length && (
          <div className="flex items-center gap-1.5 text-xs mb-2" style={{ color: theme.accent }}>
            <Sparkles size={13} /> All caught up
          </div>
        )}
        <ul className="hud-scroll overflow-y-auto max-h-[340px] pr-1">
          {items.map((a) => {
            const due = new Date(a.dueAt);
            const urgent = isUrgent(due, now) && !a.done;
            const isSelected = a.id === selectedId;
            return (
              <li key={a.id}>
                <button
                  onClick={() => setSelectedId(a.id)}
                  className="w-full flex items-center gap-2 text-left py-2 px-2 mb-1 transition-colors"
                  style={{ backgroundColor: isSelected ? hexA(theme.accent, 0.16) : "transparent", borderLeft: `2px solid ${isSelected ? theme.accent : "transparent"}` }}
                >
                  <Circle size={8} fill={a.done ? theme.ink : "none"} style={{ color: urgent ? theme.accent : theme.inkMuted, flexShrink: 0 }} />
                  <span className="min-w-0 flex-1">
                    <span className={`block text-xs truncate ${a.done ? "line-through opacity-60" : ""}`} style={{ color: isSelected ? theme.ink : theme.inkMuted }}>
                      <span style={{ color: theme.inkFaint }}>{a.course}</span> · {a.title}
                    </span>
                    <span className="block text-[10px] tracking-wide" style={{ color: urgent ? theme.accent : theme.inkFaint }}>
                      {dueDateTime(due)}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </Panel>

      <Panel className="md:col-span-3 relative overflow-hidden px-6 py-5">
        <div
          className="absolute right-0 top-0 bottom-0 w-40 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(${hexA(theme.ink, 0.5)} 1px, transparent 1px)`,
            backgroundSize: "7px 7px",
            maskImage: "radial-gradient(ellipse 70% 90% at 75% 50%, black 15%, transparent 70%)",
            WebkitMaskImage: "radial-gradient(ellipse 70% 90% at 75% 50%, black 15%, transparent 70%)",
            opacity: 0.5,
          }}
        />
        <div className="relative">
          <p className="text-xs tracking-widest mb-1" style={{ color: theme.inkMuted }}>{selected.course}</p>
          <h2 className={`text-lg font-semibold mb-2 ${selected.done ? "line-through opacity-60" : ""}`}>{selected.title}</h2>
          {selected.note && <p className="text-sm mb-4 max-w-sm" style={{ color: theme.inkMuted }}>{selected.note}</p>}
          <div className="border-t border-dashed pt-3 max-w-sm" style={{ borderColor: theme.border }}>
            <StatRow label="DUE" value={dueDateTime(selectedDue)} />
            <StatRow label="COUNTDOWN" value={formatDue(selectedDue, now)} valueColor={isUrgent(selectedDue, now) && !selected.done ? theme.accent : theme.ink} />
            <StatRow label="STATUS" value={selected.done ? "DONE" : "PENDING"} valueColor={selected.done ? theme.ink : theme.inkMuted} pulse={pulse} />
            {selected.done && (
              <StatRow label="LEAVES LIST" value="24H AFTER MARKING DONE" valueColor={theme.inkFaint} />
            )}
          </div>
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={() => toggleDone(selected)}
              className="text-xs tracking-widest px-3 py-2 border"
              style={{ borderColor: theme.accent, color: selected.done ? theme.inkMuted : theme.accent }}
            >
              {selected.done ? "(↺) MARK PENDING" : "(⏎) MARK DONE"}
            </button>
            {selected.canvasUrl && (
              <a
                href={selected.canvasUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs tracking-widest"
                style={{ color: theme.inkMuted }}
              >
                OPEN IN CANVAS ↗
              </a>
            )}
          </div>
        </div>
      </Panel>
    </div>
  );
}
