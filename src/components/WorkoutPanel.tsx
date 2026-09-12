"use client";
import { useEffect, useState } from "react";
import { Dumbbell, Check } from "lucide-react";
import { Panel } from "./Panel";
import { SectionHeader } from "./SectionHeader";
import { useTheme } from "@/lib/theme-context";
import { ROUTINE, type WorkoutDay } from "@/lib/workout";

const DAYS: WorkoutDay[] = ["A", "B", "C"];

export function WorkoutPanel() {
  const theme = useTheme();
  const [day, setDay] = useState<WorkoutDay>("A");
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const load = () =>
    fetch("/api/workout")
      .then((r) => r.json())
      .then((data: { checked: string[] }) => setChecked(new Set(data.checked)));

  useEffect(() => { load(); }, []);

  const routine = ROUTINE[day];
  const doneCount = routine.exercises.filter((ex) => checked.has(`${day}:${ex.slug}`)).length;

  const toggle = async (slug: string) => {
    const key = `${day}:${slug}`;
    const next = !checked.has(key);
    setChecked((prev) => {
      const copy = new Set(prev);
      if (next) copy.add(key); else copy.delete(key);
      return copy;
    });
    await fetch("/api/workout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ day, exercise: slug, checked: next }),
    });
  };

  return (
    <Panel className="px-4 py-4">
      <SectionHeader
        icon={<Dumbbell size={14} />} label="WORKOUT"
        right={<span className="text-xs tabular-nums" style={{ color: theme.inkFaint }}>{doneCount}/{routine.exercises.length}</span>}
      />

      <div className="flex gap-2 mb-3">
        {DAYS.map((d) => (
          <button
            key={d}
            onClick={() => setDay(d)}
            className="flex-1 text-xs tracking-widest py-1.5 border"
            style={{
              borderColor: d === day ? theme.accent : theme.border,
              color: d === day ? theme.accent : theme.inkMuted,
            }}
          >
            {d} · {ROUTINE[d].label.toUpperCase()}
          </button>
        ))}
      </div>

      <ul>
        {routine.exercises.map((ex) => {
          const isChecked = checked.has(`${day}:${ex.slug}`);
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
    </Panel>
  );
}
