"use client";
import { useEffect, useState } from "react";
import { Dumbbell, Check, Timer } from "lucide-react";
import { Panel } from "./Panel";
import { SectionHeader } from "./SectionHeader";
import { useTheme } from "@/lib/theme-context";
import { hexA } from "@/lib/theme";
import { ROUTINE, ROTATION_NOTE, PROGRESSION_NOTE, type WorkoutDay } from "@/lib/workout";

type WorkoutData = {
  activeDay: WorkoutDay;
  inCooldown: boolean;
  cooldownStartedAt: string | null;
  cooldownUntil: string | null;
  checked: string[];
};

const RING_RADIUS = 42;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function formatRemaining(ms: number) {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function WorkoutPanel() {
  const theme = useTheme();
  const [data, setData] = useState<WorkoutData | null>(null);
  const [remaining, setRemaining] = useState(0);

  const load = () => fetch("/api/workout").then((r) => r.json()).then(setData);

  useEffect(() => { load(); }, []);

  // Tick the countdown once a second while in cooldown, and re-fetch once it
  // visually hits zero so the server can perform the authoritative flip.
  useEffect(() => {
    if (!data?.inCooldown || !data.cooldownUntil) return;
    const until = new Date(data.cooldownUntil).getTime();
    const tick = () => {
      const left = until - Date.now();
      setRemaining(left);
      if (left <= 0) load();
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [data?.inCooldown, data?.cooldownUntil]);

  if (!data) {
    return (
      <Panel className="px-4 py-4">
        <SectionHeader icon={<Dumbbell size={14} />} label="WORKOUT" />
      </Panel>
    );
  }

  const { activeDay, inCooldown, checked } = data;
  const routine = ROUTINE[activeDay];
  const checkedSet = new Set(checked);
  const doneCount = routine.exercises.filter((ex) => checkedSet.has(ex.slug)).length;

  const toggle = async (slug: string) => {
    if (inCooldown) return;
    const next = !checkedSet.has(slug);
    setData((prev) => {
      if (!prev) return prev;
      const set = new Set(prev.checked);
      if (next) set.add(slug); else set.delete(slug);
      return { ...prev, checked: [...set] };
    });
    const res = await fetch("/api/workout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ exercise: slug, checked: next }),
    });
    const updated = await res.json();
    setData(updated);
  };

  const totalMs = data.cooldownStartedAt && data.cooldownUntil
    ? new Date(data.cooldownUntil).getTime() - new Date(data.cooldownStartedAt).getTime()
    : 0;
  const fraction = inCooldown && totalMs > 0 ? Math.min(1, Math.max(0, remaining / totalMs)) : 0;

  return (
    <Panel className="px-4 py-4 relative overflow-hidden">
      <SectionHeader
        icon={<Dumbbell size={14} />} label="WORKOUT"
        right={<span className="text-xs tabular-nums" style={{ color: theme.inkFaint }}>{doneCount}/{routine.exercises.length}</span>}
      />

      <p className="text-[10px] tracking-wide mb-3" style={{ color: theme.inkFaint }}>
        {ROTATION_NOTE} · {PROGRESSION_NOTE}
      </p>

      <p className="text-xs tracking-widest mb-3" style={{ color: theme.accent }}>
        {activeDay} · {routine.label.toUpperCase()}
      </p>

      <ul
        style={inCooldown ? { filter: "blur(4px)", opacity: 0.5, pointerEvents: "none" } : undefined}
      >
        {routine.exercises.map((ex) => {
          const isChecked = checkedSet.has(ex.slug);
          return (
            <li key={ex.slug}>
              <button
                onClick={() => toggle(ex.slug)}
                className="w-full flex items-start gap-2.5 text-left py-2"
              >
                <span
                  className="flex items-center justify-center shrink-0 mt-0.5"
                  style={{
                    width: 16, height: 16, border: `1px solid ${isChecked ? theme.accent : theme.border}`,
                    backgroundColor: isChecked ? theme.accent : "transparent",
                  }}
                >
                  {isChecked && <Check size={12} color={theme.bg} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block text-sm ${isChecked ? "line-through opacity-60" : ""}`} style={{ color: theme.ink }}>
                    {ex.name}
                  </span>
                  <span className="block text-[10px] tracking-wide" style={{ color: theme.inkFaint }}>
                    {ex.detail}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {inCooldown && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-2"
          style={{ backgroundColor: hexA(theme.bg, 0.35) }}
        >
          <div className="relative" style={{ width: 96, height: 96 }}>
            <svg width={96} height={96} viewBox="0 0 96 96" className="-rotate-90">
              <circle cx={48} cy={48} r={RING_RADIUS} fill="none" stroke={theme.border} strokeWidth={4} />
              <circle
                cx={48} cy={48} r={RING_RADIUS} fill="none" stroke={theme.accent} strokeWidth={4}
                strokeDasharray={RING_CIRCUMFERENCE}
                strokeDashoffset={RING_CIRCUMFERENCE * (1 - fraction)}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 1s linear" }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <Timer size={22} style={{ color: theme.accent }} />
            </div>
          </div>
          <p className="text-xs tracking-widest" style={{ color: theme.ink }}>COOLDOWN</p>
          <p className="text-lg tabular-nums font-semibold" style={{ color: theme.ink }}>{formatRemaining(remaining)}</p>
          <p className="text-[10px] tracking-wide" style={{ color: theme.inkFaint }}>
            NEXT: {ROUTINE[activeDay === "A" ? "B" : "A"].label.toUpperCase()}
          </p>
        </div>
      )}
    </Panel>
  );
}
