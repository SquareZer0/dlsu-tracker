"use client";
import { useEffect, useRef, useState } from "react";
import { useMusic } from "@/lib/music-context";
import { useTheme } from "@/lib/theme-context";
import { useIsDesktop } from "@/lib/hooks";
import { notch } from "@/lib/theme";

// Desktop: the percentage itself is a plain editable number. Mobile: tapping
// it opens a themed popup with a slider instead, since typing into a tiny
// header field is awkward on a phone keyboard.
export function VolumeControl() {
  const theme = useTheme();
  const isDesktop = useIsDesktop();
  const { volume, setVolume } = useMusic();
  const [open, setOpen] = useState(false);

  // A raw draft string, separate from the committed volume — a fully
  // controlled input bound straight to `volume` would snap back to the old
  // value the instant the field goes empty or invalid mid-edit (e.g.
  // backspacing to retype), fighting whatever the user is trying to type.
  const [draft, setDraft] = useState(String(volume));
  const editingRef = useRef(false);

  useEffect(() => {
    if (!editingRef.current) setDraft(String(volume));
  }, [volume]);

  if (isDesktop === null) return null; // avoid a flash while detecting viewport

  if (isDesktop) {
    return (
      <div className="flex items-center gap-1 px-2 py-1 border" style={{ borderColor: theme.border, color: theme.inkMuted }}>
        <input
          type="number"
          min={0}
          max={100}
          value={draft}
          onFocus={() => { editingRef.current = true; }}
          onChange={(e) => {
            setDraft(e.target.value);
            if (Number.isFinite(e.target.valueAsNumber)) setVolume(e.target.valueAsNumber);
          }}
          onBlur={() => {
            editingRef.current = false;
            setDraft(String(volume)); // snap back to the committed (clamped) value
          }}
          aria-label="Volume percentage"
          className="w-7 bg-transparent outline-none text-right tabular-nums"
          style={{ color: theme.ink }}
        />
        <span>%</span>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Adjust volume"
        className="px-2 py-1 border tabular-nums"
        style={{ borderColor: theme.border, color: theme.inkMuted }}
      >
        {volume}%
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-6"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-xs p-6 border"
            style={{ backgroundColor: theme.panel, borderColor: theme.border, clipPath: notch(14), color: theme.ink }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-xs tracking-widest mb-4" style={{ color: theme.inkMuted }}>VOLUME</p>
            <p className="text-3xl font-semibold tabular-nums mb-4 text-center">{volume}%</p>
            <input
              type="range"
              min={0}
              max={100}
              value={volume}
              onChange={(e) => setVolume(e.target.valueAsNumber)}
              className="w-full"
              style={{ accentColor: theme.accent }}
              aria-label="Volume"
            />
            <button
              onClick={() => setOpen(false)}
              className="mt-5 w-full text-xs tracking-widest py-2 border"
              style={{ borderColor: theme.accent, color: theme.accent }}
            >
              DONE
            </button>
          </div>
        </div>
      )}
    </>
  );
}
