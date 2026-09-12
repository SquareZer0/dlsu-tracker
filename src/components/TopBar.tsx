"use client";
import { Moon, Sun, Play, Pause } from "lucide-react";
import { useNow } from "@/lib/hooks";
import { clock } from "@/lib/theme";
import { useTheme, useThemeMode } from "@/lib/theme-context";
import { useMusic } from "@/lib/music-context";
import { SyncButton } from "./SyncButton";
import { VolumeControl } from "./VolumeControl";

export function TopBar({ showBreadcrumb = true }: { showBreadcrumb?: boolean }) {
  const now = useNow();
  const theme = useTheme();
  const { mode, toggle } = useThemeMode();
  const { playing, toggle: toggleMusic } = useMusic();
  return (
    <div
      className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-6 border-b border-dashed text-xs uppercase tracking-widest"
      style={{ borderColor: theme.border }}
    >
      {showBreadcrumb ? (
        <div className="flex flex-wrap gap-x-4 gap-y-1" style={{ color: theme.inkMuted }}>
          <span>/ Assignments:</span><span>/ Exams:</span><span>/ Schedule:</span><span>/ Finance:</span><span>/ Workout:</span>
        </div>
      ) : <div />}
      <div className="flex items-center gap-3">
        <button
          onClick={toggle}
          aria-label={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          className="flex items-center gap-1 px-2 py-1 border"
          style={{ borderColor: theme.border, color: theme.inkMuted }}
        >
          {mode === "dark" ? <Sun size={12} /> : <Moon size={12} />}
        </button>
        <button
          onClick={toggleMusic}
          aria-label={playing ? "Pause music" : "Play music"}
          className="flex items-center gap-1 px-2 py-1 border"
          style={{ borderColor: theme.border, color: theme.inkMuted }}
        >
          {playing ? <Pause size={12} /> : <Play size={12} />}
        </button>
        <VolumeControl />
        <SyncButton />
        <span className="tabular-nums" style={{ color: theme.ink }}>{clock(now)}</span>
      </div>
    </div>
  );
}
