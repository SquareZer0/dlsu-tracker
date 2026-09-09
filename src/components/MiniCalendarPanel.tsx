"use client";
import { useState } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { Panel } from "./Panel";
import { hexA } from "@/lib/theme";
import { useTheme } from "@/lib/theme-context";
import type { GCalEvent } from "@/lib/gcal";

type MiniCalendarPanelProps = {
  eventsByDate: Record<string, { count: number; events: GCalEvent[] }>;
  todayKey: string;
  selectedKey: string;
  onSelectDate: (dateKey: string) => void;
  isLive: boolean;
  statusMessage?: string;
};

const WEEKDAYS = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];

export function MiniCalendarPanel({
  eventsByDate,
  todayKey,
  selectedKey,
  onSelectDate,
  isLive,
  statusMessage,
}: MiniCalendarPanelProps) {
  const theme = useTheme();
  // Current displayed month in the calendar
  const [viewDate, setViewDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  // Navigation helpers
  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));
  const jumpToday = () => {
    const d = new Date();
    setViewDate(new Date(d.getFullYear(), d.getMonth(), 1));
    onSelectDate(todayKey);
  };

  const monthName = viewDate.toLocaleDateString("en-US", { month: "short" }).toUpperCase();

  // Compute grid days
  // Monday is 1, Sunday is 0 in JS Date -> normalize so Monday is index 0
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const startOffset = (firstDayOfMonth + 6) % 7; // days to pad before 1st of month

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  // Grid cells (total 35 or 42)
  type DayCell = {
    dayNum: number;
    dateKey: string;
    isCurrentMonth: boolean;
    isToday: boolean;
    isSelected: boolean;
    count: number;
  };

  const cells: DayCell[] = [];

  // Previous month padding
  for (let i = startOffset - 1; i >= 0; i--) {
    const dayNum = daysInPrevMonth - i;
    const d = new Date(year, month - 1, dayNum);
    const dateKey = d.toLocaleDateString("en-CA");
    cells.push({
      dayNum,
      dateKey,
      isCurrentMonth: false,
      isToday: dateKey === todayKey,
      isSelected: dateKey === selectedKey,
      count: eventsByDate[dateKey]?.count ?? 0,
    });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(year, month, i);
    const dateKey = d.toLocaleDateString("en-CA");
    cells.push({
      dayNum: i,
      dateKey,
      isCurrentMonth: true,
      isToday: dateKey === todayKey,
      isSelected: dateKey === selectedKey,
      count: eventsByDate[dateKey]?.count ?? 0,
    });
  }

  // Next month padding to fill out 35 or 42 cells
  const remaining = 35 - cells.length > 0 ? 35 - cells.length : (42 - cells.length > 0 ? 42 - cells.length : 0);
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, month + 1, i);
    const dateKey = d.toLocaleDateString("en-CA");
    cells.push({
      dayNum: i,
      dateKey,
      isCurrentMonth: false,
      isToday: dateKey === todayKey,
      isSelected: dateKey === selectedKey,
      count: eventsByDate[dateKey]?.count ?? 0,
    });
  }

  // Helper for dot gradient based on count
  const renderDot = (count: number, isCurrentMonth: boolean) => {
    if (!isCurrentMonth) {
      return <div className="w-1.5 h-1.5 rounded-full opacity-40 mt-1" style={{ backgroundColor: theme.inkFaint }} />;
    }

    if (count === 0) {
      return (
        <div
          className="w-1.5 h-1.5 rounded-full mt-1 border"
          style={{ borderColor: theme.border, backgroundColor: "transparent" }}
        />
      );
    }

    if (count <= 2) {
      return (
        <div
          className="w-1.5 h-1.5 rounded-full mt-1"
          style={{
            background: `radial-gradient(circle, ${theme.ink} 10%, #7A7258 100%)`,
            boxShadow: `0 0 3px ${hexA(theme.ink, 0.3)}`,
          }}
        />
      );
    }

    if (count <= 4) {
      return (
        <div
          className="w-2 h-2 rounded-full mt-1"
          style={{
            background: `radial-gradient(circle, #F3EBD4 0%, ${theme.ink} 70%, #A69B73 100%)`,
            boxShadow: `0 0 6px ${hexA(theme.ink, 0.6)}`,
          }}
        />
      );
    }

    // 5+ events: high-density radiant accent
    return (
      <div
        className="w-2 h-2 rounded-full mt-1"
        style={{
          background: `radial-gradient(circle, #FFA07A 0%, ${theme.accent} 70%, #8A2D12 100%)`,
          boxShadow: `0 0 8px ${hexA(theme.accent, 0.8)}`,
        }}
      />
    );
  };

  return (
    <Panel className="px-4 py-4 mb-4">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-3 border-b border-dashed pb-2" style={{ borderColor: theme.border }}>
        <div className="flex items-center gap-2">
          <CalendarIcon size={14} style={{ color: theme.ink }} />
          <span className="text-xs font-semibold tracking-wider" style={{ color: theme.ink }}>
            {monthName} {year}
          </span>
          <span
            className="text-[9px] px-1.5 py-0.5 border uppercase tracking-wider"
            style={{
              borderColor: isLive ? theme.border : theme.accent,
              color: isLive ? theme.inkMuted : theme.accent,
            }}
          >
            {isLive ? "GCAL LIVE" : "GCAL READY"}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={jumpToday}
            title="Jump to Today"
            className="p-1 hover:text-white transition-colors"
            style={{ color: theme.inkMuted }}
          >
            <RotateCcw size={12} />
          </button>
          <button
            onClick={prevMonth}
            title="Previous Month"
            className="p-1 hover:text-white transition-colors"
            style={{ color: theme.inkMuted }}
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={nextMonth}
            title="Next Month"
            className="p-1 hover:text-white transition-colors"
            style={{ color: theme.inkMuted }}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Status Warning Banner if not live */}
      {!isLive && statusMessage && (
        <div
          className="mb-3 px-2 py-1.5 border text-[10px] leading-snug font-mono"
          style={{
            borderColor: theme.accent,
            backgroundColor: hexA(theme.accent, 0.12),
            color: theme.ink,
          }}
        >
          <span className="font-bold" style={{ color: theme.accent }}>[GCAL ALERT] </span>
          {statusMessage}
        </div>
      )}

      {/* Weekday Row */}
      <div className="grid grid-cols-7 text-center mb-1">
        {WEEKDAYS.map((wd) => (
          <div key={wd} className="text-[10px] tracking-widest font-mono py-1" style={{ color: theme.inkFaint }}>
            {wd}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {cells.map((cell) => {
          return (
            <button
              key={cell.dateKey}
              onClick={() => onSelectDate(cell.dateKey)}
              className={`flex flex-col items-center justify-center py-1.5 rounded transition-all group relative ${
                cell.isSelected ? "scale-105" : "hover:scale-105"
              }`}
              style={{
                backgroundColor: cell.isSelected
                  ? hexA(theme.accent, 0.16)
                  : cell.isToday
                  ? hexA(theme.ink, 0.08)
                  : "transparent",
                border: cell.isSelected
                  ? `1px solid ${theme.accent}`
                  : cell.isToday
                  ? `1px solid ${theme.ink}`
                  : "1px solid transparent",
              }}
            >
              <span
                className={`text-[11px] font-mono leading-none ${
                  cell.isCurrentMonth
                    ? cell.isToday
                      ? "font-bold"
                      : "font-normal"
                    : "opacity-30"
                }`}
                style={{
                  color: cell.isSelected
                    ? theme.accent
                    : cell.isToday
                    ? theme.ink
                    : cell.isCurrentMonth
                    ? theme.inkMuted
                    : theme.inkFaint,
                }}
              >
                {cell.dayNum}
              </span>
              {renderDot(cell.count, cell.isCurrentMonth)}
            </button>
          );
        })}
      </div>

      {/* Dot Intensity Legend */}
      <div
        className="flex items-center justify-between border-t border-dashed mt-3 pt-2 text-[9px] font-mono"
        style={{ borderColor: theme.border, color: theme.inkFaint }}
      >
        <span>ACTIVITY:</span>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full border" style={{ borderColor: theme.border }} />
          <span>0</span>
        </div>
        <div className="flex items-center gap-1">
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: theme.inkMuted }}
          />
          <span>1-2</span>
        </div>
        <div className="flex items-center gap-1">
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: theme.ink, boxShadow: `0 0 4px ${hexA(theme.ink, 0.5)}` }}
          />
          <span>3-4</span>
        </div>
        <div className="flex items-center gap-1">
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: theme.accent, boxShadow: `0 0 6px ${hexA(theme.accent, 0.7)}` }}
          />
          <span>5+</span>
        </div>
      </div>
    </Panel>
  );
}
