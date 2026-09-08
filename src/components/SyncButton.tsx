"use client";
import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { useTheme } from "@/lib/theme-context";

export function SyncButton() {
  const theme = useTheme();
  const [pulling, setPulling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sync = async () => {
    setPulling(true);
    setError(null);
    try {
      const res = await fetch("/api/sync/canvas", { method: "POST" });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? `Sync failed (${res.status})`);
        return;
      }
      window.location.reload();
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setPulling(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={sync}
        disabled={pulling}
        className="flex items-center gap-1.5 text-xs tracking-widest px-3 py-1.5 border"
        style={{ borderColor: error ? theme.accent : theme.border, color: theme.inkMuted }}
      >
        <RefreshCw size={12} className={pulling ? "animate-spin" : ""} />
        {pulling ? "SYNCING…" : "(R) SYNC CANVAS"}
      </button>
      {error && <span className="text-[10px] max-w-[200px] text-right" style={{ color: theme.accent }}>{error}</span>}
    </div>
  );
}
