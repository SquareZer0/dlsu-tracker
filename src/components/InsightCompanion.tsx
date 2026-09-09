"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { hexA } from "@/lib/theme";
import { useTheme } from "@/lib/theme-context";

// --- pixel sprite -----------------------------------------------------
// Built procedurally (an ellipse for the head, band rules for hair/glasses)
// instead of hand-authored ASCII art, so the silhouette stays symmetric.
const COLS = 15;
const ROWS = 20;
const CELL = 8;
const CX = 7;

type Cell = "H" | "F" | "G" | "E" | "M" | "C" | null;

function buildGrid(blink: boolean, talk: boolean): Cell[][] {
  const grid: Cell[][] = Array.from({ length: ROWS }, () => Array(COLS).fill(null));

  for (let y = 2; y <= 11; y++) {
    for (let x = 0; x < COLS; x++) {
      const dx = x - CX;
      const ry = (y - 6.5) / 5.1;
      const rx = dx / 6.2;
      if (rx * rx + ry * ry <= 1) grid[y][x] = "F";
    }
  }
  // hair cap + sideburns
  for (let y = 2; y <= 4; y++) {
    for (let x = 0; x < COLS; x++) if (grid[y][x] === "F") grid[y][x] = "H";
  }
  for (let y = 5; y <= 10; y++) {
    for (let x = 0; x < COLS; x++) if (grid[y][x] === "F" && Math.abs(x - CX) >= 5) grid[y][x] = "H";
  }
  // ponytails poking out past the head silhouette
  for (let y = 3; y <= 6; y++) {
    grid[y][CX - 7] = "H";
    grid[y][CX + 7] = "H";
  }
  // glasses: two narrow lenses with a visible gap between them and at the
  // outer edges, plus a thin bridge — not one solid bar across the face.
  for (const y of [7, 8]) {
    for (let x = 0; x < COLS; x++) {
      const dx = x - CX;
      if ((dx >= -4 && dx <= -3) || (dx >= 3 && dx <= 4)) grid[y][x] = "G";
    }
  }
  grid[7][CX] = "G";
  // eyes (skipped on the blink frame — reads as closed)
  if (!blink) {
    grid[7][CX - 3] = "E";
    grid[7][CX + 3] = "E";
  }
  // mouth
  if (talk) {
    grid[10][CX - 1] = "M";
    grid[10][CX] = "M";
    grid[10][CX + 1] = "M";
    grid[11][CX] = "M";
  } else {
    grid[10][CX] = "M";
  }
  // shoulders
  for (let y = 13; y <= 17; y++) {
    const width = 3 + (y - 13);
    for (let x = 0; x < COLS; x++) if (Math.abs(x - CX) <= width) grid[y][x] = "C";
  }

  return grid;
}

function Sprite({ blink, talk }: { blink: boolean; talk: boolean }) {
  const theme = useTheme();
  const grid = buildGrid(blink, talk);
  const colors: Record<Exclude<Cell, null>, string> = {
    H: theme.inkMuted,
    F: theme.ink,
    G: theme.accent,
    E: theme.bg,
    M: talk ? theme.accent : theme.inkFaint,
    C: theme.border,
  };

  return (
    <svg
      viewBox={`0 0 ${COLS * CELL} ${ROWS * CELL}`}
      width={COLS * CELL * 1.4}
      height={ROWS * CELL * 1.4}
      shapeRendering="crispEdges"
      style={{ imageRendering: "pixelated" }}
    >
      {grid.map((row, y) =>
        row.map((cell, x) =>
          cell ? <rect key={`${x}-${y}`} x={x * CELL} y={y * CELL} width={CELL} height={CELL} fill={colors[cell]} /> : null
        )
      )}
    </svg>
  );
}

// --- companion behavior -------------------------------------------------
const STATUS_ICONS = ["...", "!", "?!", "?"];

type Phase = "idle" | "thinking" | "streaming";

export function InsightCompanion() {
  const theme = useTheme();
  const pathname = usePathname();
  const [wide, setWide] = useState(false);
  const [blink, setBlink] = useState(false);
  const [statusIcon, setStatusIcon] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [bubbleText, setBubbleText] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const talkTick = useRef(false);
  const [talkFrame, setTalkFrame] = useState(false);

  // Only show where there's actually empty rail space beside the dashboard.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1500px)");
    setWide(mq.matches);
    const handler = (e: MediaQueryListEvent) => setWide(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Idle blink loop.
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const loop = () => {
      timeout = setTimeout(() => {
        setBlink(true);
        setTimeout(() => setBlink(false), 140);
        loop();
      }, 2500 + Math.random() * 3500);
    };
    loop();
    return () => clearTimeout(timeout);
  }, []);

  // Random idle status glyph, only while nothing is happening.
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const loop = () => {
      timeout = setTimeout(() => {
        if (phase === "idle") {
          setStatusIcon(STATUS_ICONS[Math.floor(Math.random() * STATUS_ICONS.length)]);
          setTimeout(() => setStatusIcon(null), 1600);
        }
        loop();
      }, 4000 + Math.random() * 5000);
    };
    loop();
    return () => clearTimeout(timeout);
  }, [phase]);

  // Mouth-flap while a reply is streaming in.
  useEffect(() => {
    if (phase !== "streaming") return;
    const t = setInterval(() => {
      talkTick.current = !talkTick.current;
      setTalkFrame(talkTick.current);
    }, 160);
    return () => clearInterval(t);
  }, [phase]);

  // Show the cached daily digest once, on load.
  useEffect(() => {
    fetch("/api/companion")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.text) {
          setBubbleText(data.text);
          setTimeout(() => setBubbleText((cur) => (cur === data.text ? null : cur)), 9000);
        }
      })
      .catch(() => {});
  }, []);

  if (!wide || pathname === "/login") return null;

  const ask = async (e: React.FormEvent) => {
    e.preventDefault();
    const question = input.trim();
    if (!question || phase !== "idle") return;
    setInput("");
    setStatusIcon(null);
    setPhase("thinking");
    setBubbleText("...");

    try {
      const res = await fetch("/api/companion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "query", message: question }),
      });
      if (!res.body) throw new Error("no stream");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      let first = true;
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (first) {
          acc = "";
          setPhase("streaming");
          first = false;
        }
        acc += decoder.decode(value, { stream: true });
        setBubbleText(acc);
      }
    } catch {
      setBubbleText("connection dropped.");
    } finally {
      setPhase("idle");
      setTalkFrame(false);
    }
  };

  const showBubble = bubbleText !== null;

  return (
    <aside
      className="fixed left-0 top-0 h-screen w-36 flex-col items-center justify-between py-6 z-10"
      style={{ display: "flex", backgroundColor: theme.bg }}
    >
      <div />

      <div className="flex flex-col items-center gap-2 relative px-2">
        {showBubble && (
          <div
            className="absolute bottom-full mb-3 w-32 border border-dashed px-2 py-1.5 text-[10.5px] leading-snug"
            style={{ borderColor: theme.border, backgroundColor: theme.panel, color: theme.ink }}
          >
            {bubbleText}
            {phase !== "idle" && <span style={{ color: theme.accent }}>▋</span>}
          </div>
        )}
        {!showBubble && statusIcon && (
          <div className="absolute bottom-full mb-1 text-xs" style={{ color: theme.inkFaint }}>
            {statusIcon}
          </div>
        )}
        <div
          style={{
            backgroundImage: `radial-gradient(${hexA(theme.ink, 0.4)} 1px, transparent 1.4px)`,
            backgroundSize: "6px 6px",
          }}
        >
          <div style={{ animation: "companionBreathe 3.2s ease-in-out infinite" }}>
            <Sprite blink={blink} talk={phase === "streaming" && talkFrame} />
          </div>
        </div>
      </div>

      <form onSubmit={ask} className="w-full px-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="> ask something..."
          disabled={phase !== "idle"}
          className="w-full bg-transparent outline-none text-[11px] py-1 border-b border-dashed"
          style={{ borderColor: theme.border, color: theme.ink }}
        />
      </form>

      <style jsx>{`
        @keyframes companionBreathe {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(1.03); }
        }
      `}</style>
    </aside>
  );
}
