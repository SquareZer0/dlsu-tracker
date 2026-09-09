"use client";
import { Clock, MapPin, Sparkles, AlertCircle } from "lucide-react";
import { Panel } from "./Panel";
import { hexA } from "@/lib/theme";
import { useTheme } from "@/lib/theme-context";
import type { GCalEvent } from "@/lib/gcal";

type AgendaPanelProps = {
  title: string;
  subtitle: string;
  events: GCalEvent[];
  isToday?: boolean;
  onResetDate?: () => void;
  showReset?: boolean;
};

export function AgendaCard({
  title,
  subtitle,
  events,
  isToday = false,
  onResetDate,
  showReset = false,
}: AgendaPanelProps) {
  const theme = useTheme();
  const now = new Date();

  const isEventLive = (ev: GCalEvent) => {
    if (!isToday || ev.isAllDay) return false;
    const s = new Date(ev.start).getTime();
    const e = new Date(ev.end).getTime();
    const cur = now.getTime();
    return cur >= s && cur <= e;
  };

  return (
    <Panel className="px-4 py-4 mb-4">
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-dashed pb-2 mb-3" style={{ borderColor: theme.border }}>
        <div>
          <p className="text-[10px] tracking-widest uppercase font-mono" style={{ color: theme.inkMuted }}>
            {title}
          </p>
          <h3 className="text-xs font-semibold tracking-wider uppercase" style={{ color: theme.ink }}>
            {subtitle}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono px-1.5 py-0.5 border" style={{ borderColor: theme.border, color: theme.inkFaint }}>
            {events.length} {events.length === 1 ? "EVENT" : "EVENTS"}
          </span>
          {showReset && onResetDate && (
            <button
              onClick={onResetDate}
              className="text-[9px] font-mono tracking-wider px-2 py-0.5 border transition-colors hover:text-white"
              style={{ borderColor: theme.accent, color: theme.accent }}
            >
              TODAY
            </button>
          )}
        </div>
      </div>

      {/* Events List */}
      {events.length === 0 ? (
        <div className="py-4 text-center">
          <p className="text-xs font-mono tracking-wide" style={{ color: theme.inkFaint }}>
            NO EVENTS SCHEDULED
          </p>
          <p className="text-[10px] mt-1" style={{ color: theme.inkMuted }}>
            Free block on this date.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5 hud-scroll max-h-[220px] overflow-y-auto pr-1">
          {events.map((ev) => {
            const live = isEventLive(ev);
            return (
              <div
                key={ev.id}
                className="p-2.5 border transition-all"
                style={{
                  borderColor: live ? theme.accent : theme.border,
                  backgroundColor: live ? hexA(theme.accent, 0.1) : hexA(theme.bg, 0.4),
                }}
              >
                {/* Time & Live indicator */}
                <div className="flex items-center justify-between mb-1 text-[10px] font-mono">
                  <span
                    className="flex items-center gap-1 font-medium"
                    style={{ color: live ? theme.accent : theme.ink }}
                  >
                    <Clock size={11} />
                    {ev.isAllDay ? "ALL DAY" : `${ev.startTime} – ${ev.endTime}`}
                  </span>
                  {live && (
                    <span
                      className="flex items-center gap-1 text-[9px] px-1 py-0.2 tracking-widest font-semibold uppercase animate-pulse"
                      style={{ color: theme.accent }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.accent }} />
                      IN PROGRESS
                    </span>
                  )}
                </div>

                {/* Event Title */}
                <h4
                  className="text-xs font-medium leading-snug line-clamp-2"
                  style={{ color: theme.ink }}
                >
                  {ev.title}
                </h4>

                {/* Location */}
                {ev.location && (
                  <div
                    className="flex items-center gap-1 mt-1 text-[10px] truncate"
                    style={{ color: theme.inkMuted }}
                  >
                    <MapPin size={10} className="shrink-0" />
                    <span className="truncate">{ev.location}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
}

type GCalSideRailProps = {
  todayEvents: GCalEvent[];
  tomorrowEvents: GCalEvent[];
  selectedKey: string;
  todayKey: string;
  tomorrowKey: string;
  selectedEvents: GCalEvent[];
  onResetDate: () => void;
};

export function GCalSideRail({
  todayEvents,
  tomorrowEvents,
  selectedKey,
  todayKey,
  tomorrowKey,
  selectedEvents,
  onResetDate,
}: GCalSideRailProps) {
  const isSelectedCustom = selectedKey !== todayKey && selectedKey !== tomorrowKey;

  // Format date helper
  const formatDateLabel = (isoDate: string) => {
    try {
      const [y, m, d] = isoDate.split("-").map(Number);
      const date = new Date(y, m - 1, d);
      return date.toLocaleDateString("en-PH", {
        weekday: "short",
        month: "short",
        day: "numeric",
      }).toUpperCase();
    } catch {
      return isoDate;
    }
  };

  return (
    <div className="flex flex-col">
      {isSelectedCustom ? (
        <>
          <AgendaCard
            title="SELECTED DATE"
            subtitle={formatDateLabel(selectedKey)}
            events={selectedEvents}
            showReset={true}
            onResetDate={onResetDate}
          />
          <AgendaCard
            title="TODAY'S SCHEDULE"
            subtitle={formatDateLabel(todayKey)}
            events={todayEvents}
            isToday={true}
          />
        </>
      ) : (
        <>
          {/* Panel for Today */}
          <AgendaCard
            title="TODAY'S SCHEDULE"
            subtitle={formatDateLabel(todayKey)}
            events={todayEvents}
            isToday={true}
          />

          {/* Panel for Tomorrow */}
          <AgendaCard
            title="TOMORROW'S AGENDA"
            subtitle={formatDateLabel(tomorrowKey)}
            events={tomorrowEvents}
          />
        </>
      )}
    </div>
  );
}
