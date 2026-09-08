"use client";
import { useEffect, useState } from "react";
import { GraduationCap } from "lucide-react";
import { useNow } from "@/lib/hooks";
import { Panel } from "./Panel";
import { SectionHeader } from "./SectionHeader";
import { StatRow } from "./StatRow";
import { formatDue, isUrgent } from "@/lib/theme";
import { useTheme } from "@/lib/theme-context";
import type { Exam } from "@/lib/types";

export function ExamsPanel() {
  const theme = useTheme();
  const now = useNow(30000);
  const [exams, setExams] = useState<Exam[]>([]);

  useEffect(() => { fetch("/api/exams").then((r) => r.json()).then(setExams); }, []);

  return (
    <Panel className="px-4 py-4">
      <SectionHeader icon={<GraduationCap size={14} />} label="EXAMS" />
      {exams.length === 0 && <p className="text-xs" style={{ color: theme.inkFaint }}>NO EXAMS YET</p>}
      {exams.map((e) => {
        const due = new Date(e.dueAt);
        return (
          <div key={e.id} className="mb-3 last:mb-0">
            <p className="text-sm">{e.title} <span style={{ color: theme.inkFaint }}>· {e.course}</span></p>
            <StatRow label="DUE" value={formatDue(due, now)} valueColor={isUrgent(due, now) ? theme.accent : theme.inkMuted} />
          </div>
        );
      })}
    </Panel>
  );
}
