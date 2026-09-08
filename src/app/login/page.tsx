"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { theme, notch } from "@/lib/theme";

export default function LoginPage() {
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState(false);
  const router = useRouter();

  const submit = async () => {
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passcode }),
    });
    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      setError(true);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: theme.bg, color: theme.ink, fontFamily: "'IBM Plex Mono', monospace" }}
    >
      <div
        className="w-full max-w-xs border p-6"
        style={{ backgroundColor: theme.panel, borderColor: theme.border, clipPath: notch(14) }}
      >
        <p className="text-xs tracking-widest mb-1" style={{ color: theme.inkMuted }}>DLSU TRACKER</p>
        <h1 className="text-lg font-semibold mb-4 uppercase">Enter Passcode</h1>
        <input
          type="password"
          value={passcode}
          onChange={(e) => { setPasscode(e.target.value); setError(false); }}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          className="w-full text-sm px-2 py-2 outline-none border mb-3"
          style={{ backgroundColor: theme.bg, borderColor: error ? theme.accent : theme.border, color: theme.ink }}
          autoFocus
        />
        {error && <p className="text-xs mb-3" style={{ color: theme.accent }}>WRONG PASSCODE</p>}
        <button
          onClick={submit}
          className="w-full text-xs tracking-widest px-3 py-2 border"
          style={{ borderColor: theme.accent, color: theme.accent }}
        >
          (⏎) UNLOCK
        </button>
      </div>
    </div>
  );
}
