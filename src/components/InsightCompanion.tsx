// Ported from InsightCompanion.reference.tsx — frame engine, blink loop,
// SETS table, and the overall structure are unchanged. Colors now come
// from the theme (were hardcoded to dark-mode values, invisible in light
// mode) and a Send button was added for mobile.
//
// The sprite briefly went through a CSS mask (recolor a fixed-color PNG
// via the theme) instead of a plain <img> — swapping mask-image on every
// frame tick (~150ms) turned out to be a flaky repaint in practice
// (intermittently invisible frames, "glitching out"). Back to a plain
// <img> (exactly the original, proven-stable technique) with a CSS
// filter for the light-mode recolor instead — filter only needs to
// change on a theme toggle, not every frame.
// Sprite PNGs live at /public/sprites/{idle1,idle2,idle3,blink,talk1,talk2,talk3}.png.

"use client";
import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { hexA } from "@/lib/theme";
import { useTheme, useThemeMode } from "@/lib/theme-context";

const SPRITE = (name: string) => `/sprites/${name}.png`;

const SETS = {
  idle:  { frames: [SPRITE("idle1"), SPRITE("idle2"), SPRITE("idle1"), SPRITE("idle3")], interval: 150 },
  chill: { frames: [SPRITE("idle1"), SPRITE("idle3"), SPRITE("idle3"), SPRITE("idle1"), SPRITE("idle2"), SPRITE("idle1")], interval: 230 },
  talkUrgent:  { frames: [SPRITE("talk1"), SPRITE("talk2"), SPRITE("talk3"), SPRITE("talk2"), SPRITE("talk1"), SPRITE("talk3")], interval: 95 },
  talkCalm:    { frames: [SPRITE("talk1"), SPRITE("talk3"), SPRITE("talk1"), SPRITE("talk2")], interval: 170 },
  talkNeutral: { frames: [SPRITE("talk1"), SPRITE("talk2"), SPRITE("talk1"), SPRITE("talk3")], interval: 130 },
} as const;

type SetKey = keyof typeof SETS;
type Topic = "workload" | "budget" | "schedule";

// Temporary, session-only scrollback — the last few replies to *your*
// questions stay visible above the sprite instead of fading a few
// seconds after typing. Unprompted asides (you === "") never graduate
// here — they just vanish once their linger time is up.
type Exchange = { id: number; you: string; text: string; border: string; shadow: string; done: boolean };
const MAX_HISTORY = 6;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Same diagonal-cut corner the dashboard's own panels use (see
// lib/theme.ts's notch()) — reproduced locally since this component is
// intentionally self-contained/inline-styled.
const notch = (size = 8) =>
  `polygon(0 0, calc(100% - ${size}px) 0, 100% ${size}px, 100% 100%, 0 100%)`;

export default function InsightCompanion() {
  const theme = useTheme();
  const { mode } = useThemeMode();

  // Colors, not just the glyph/frame-set choice, so this is computed per
  // render off the live theme — a message keeps whatever color it was
  // tagged with at creation time even across a theme toggle, same as the
  // rest of the ephemeral scrollback.
  const TOPICS: Record<Topic, { accent: string; glyph: string; set: SetKey; border: string; shadow: string }> = {
    workload: { accent: theme.accent, glyph: "!", set: "talkUrgent", border: theme.accent, shadow: `0 0 10px ${hexA(theme.accent, 0.3)}` },
    budget: { accent: theme.ink, glyph: "?", set: "talkCalm", border: theme.border, shadow: "none" },
    schedule: { accent: theme.ink, glyph: "?!", set: "talkNeutral", border: theme.border, shadow: "none" },
  };

  const [spriteSrc, setSpriteSrc] = useState(SPRITE("idle1"));
  const [tag, setTag] = useState("idle");
  const [glyph, setGlyph] = useState<{ sym: string; color: string; show: boolean }>({ sym: "!", color: theme.ink, show: false });
  // The current reply lives in `activeMsg` — a single prominent bubble
  // right above the sprite. Once it's held on screen a while, it graduates
  // into `history` (smaller, muted, scrollable) and activeMsg clears.
  const [activeMsg, setActiveMsg] = useState<Exchange | null>(null);
  const [history, setHistory] = useState<Exchange[]>([]);
  const [query, setQuery] = useState("");
  const historyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = historyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [history]);

  // active set is a ref, not state — the frame loop reads it every tick
  // without needing to restart the effect/interval on every state change.
  const active = useRef<SetKey>("idle");
  const frameIdx = useRef(0);
  const setActive = (key: SetKey) => { active.current = key; frameIdx.current = 0; };
  const busy = useRef(false); // true while a reply (asked or ambient) is in flight

  // continuous frame engine
  useEffect(() => {
    let alive = true;
    (async () => {
      while (alive) {
        const set = SETS[active.current];
        setSpriteSrc(set.frames[frameIdx.current % set.frames.length]);
        frameIdx.current++;
        await sleep(set.interval);
      }
    })();
    return () => { alive = false; };
  }, []);

  // independent involuntary blink
  useEffect(() => {
    let alive = true;
    (async () => {
      while (alive) {
        await sleep(2800 + Math.random() * 3200);
        setSpriteSrc(SPRITE("blink"));
        await sleep(90);
        // next frame-engine tick overwrites this naturally
      }
    })();
    return () => { alive = false; };
  }, []);

  async function flashGlyph(sym: string, color: string, dur: number) {
    setGlyph({ sym, color, show: true });
    await sleep(dur);
    setGlyph((g) => ({ ...g, show: false }));
  }

  async function idlePhase() {
    const chilling = Math.random() < 0.4;
    setTag(chilling ? "chilling" : "idle");
    setActive(chilling ? "chill" : "idle");
    await sleep(chilling ? 3200 : 1600 + Math.random() * 900);
  }

  // Streams the reply from /api/companion. The model tags its own topic as
  // a leading {"topic":"..."} line — buffered until the first newline,
  // then everything after that line is the real message, typed into the
  // single active bubble as tokens actually arrive (no simulated per-char
  // delay). Once done, it lingers there, then graduates into `history`.
  async function talkPhaseStream(question: string, you: string) {
    busy.current = true;
    setTag("talking");
    setActive("idle");
    await flashGlyph("...", theme.ink, 850 + Math.random() * 300);

    let raw = "";
    let topic: Topic | null = null;
    let bodyStart = 0;
    let errored = false;
    const id = Date.now();

    try {
      const res = await fetch("/api/companion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "query", message: question }),
      });
      if (!res.body) throw new Error("no stream");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        raw += decoder.decode(value, { stream: true });
        if (topic === null) {
          const nl = raw.indexOf("\n");
          if (nl === -1) continue; // still buffering the tag line
          const match = raw.slice(0, nl).match(/"topic"\s*:\s*"(\w+)"/);
          topic = match && match[1] in TOPICS ? (match[1] as Topic) : "schedule";
          bodyStart = nl + 1;
          const t = TOPICS[topic];
          setTag(`talking · ${topic}`);
          setActive(t.set);
          setActiveMsg({ id, you, text: "", border: t.border, shadow: t.shadow, done: false });
        }
        const text = raw.slice(bodyStart);
        setActiveMsg((m) => (m && m.id === id ? { ...m, text } : m));
      }
    } catch {
      errored = true;
    }

    const resolved = topic ?? "schedule";
    const t = TOPICS[resolved];
    const finalText = errored ? "connection dropped." : raw.slice(bodyStart) || "...";
    const finished: Exchange = { id, you, text: finalText, border: t.border, shadow: t.shadow, done: true };
    setActiveMsg(finished);
    setActive("idle");

    await sleep(2500); // lingers as the single prominent bubble

    setActiveMsg((m) => (m && m.id === id ? null : m)); // graduate — unless a newer reply already took over
    if (you) {
      // only replies to something you actually asked stick around —
      // unprompted asides just disappear once their linger time is up.
      setHistory((h) => [...h, finished].slice(-MAX_HISTORY));
    }

    await sleep(400);
    await flashGlyph(t.glyph, t.accent, 700);
    busy.current = false;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim() || busy.current) return;
    const q = query.trim();
    setQuery("");
    await talkPhaseStream(q, q);
  }

  // Every few minutes, unprompted, glance at the dashboard and say
  // something about it — reuses the exact same streamed reply + topic
  // tagging as a real question, just with a self-generated prompt.
  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    const loop = () => {
      timer = setTimeout(async () => {
        if (!alive) return;
        if (!busy.current) {
          await talkPhaseStream(
            "(unprompted aside — don't wait for me to ask) Glance at my dashboard and say one short, playful thing about whatever stands out right now: a deadline, my balance, today's schedule, anything.",
            ""
          );
        }
        if (alive) loop();
      }, 150000 + Math.random() * 180000); // every ~2.5-5.5 min
    };
    loop();
    return () => { alive = false; clearTimeout(timer); };
  }, []);

  return (
    <div style={{
      width: "100%", height: "100%", position: "relative",
      fontFamily: "'Courier New', monospace", color: theme.ink,
      background: "transparent", overflow: "hidden", pointerEvents: "none",
    }}>
      <div style={{ position: "absolute", top: 14, left: 14, fontSize: 11, color: theme.inkFaint, letterSpacing: 1 }}>
        / COMPANION
      </div>
      <div style={{ position: "absolute", top: 14, right: 14, fontSize: 10, color: theme.inkFaint, letterSpacing: 1, textTransform: "uppercase" }}>
        {tag}
      </div>

      <div style={{
        position: "absolute", left: 22, bottom: 330, fontSize: 20,
        color: glyph.color, opacity: glyph.show ? 1 : 0, transition: "opacity .35s ease",
      }}>
        {glyph.sym}
      </div>

      {/* One flex column, bottom-anchored just above the sprite, so a
          single bubble sits right above her by default. Older,
          "graduated" exchanges (muted, capped height, own scroll) stack
          above the current one instead of overlapping it. */}
      <div style={{
        position: "absolute", left: 16, right: 16, top: 46, bottom: 330,
        display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 12,
        pointerEvents: "auto",
      }}>
        {history.length > 0 && (
          <div
            ref={historyRef}
            className="hud-scroll"
            style={{
              // justify-content:flex-end on a scrolling flex container clips
              // content pushed above the top instead of making it scrollable
              // (scrollTop can't go negative) — plain top-to-bottom flow plus
              // the scrollTop-to-bottom effect below is the correct pattern.
              maxHeight: 200, overflowY: "auto", display: "flex", flexDirection: "column",
              gap: 8, opacity: 0.6, flexShrink: 0,
            }}
          >
            {history.map((ex) => (
              <div key={ex.id}>
                {ex.you && (
                  <div style={{ fontSize: 10, color: theme.inkFaint, textAlign: "right", marginBottom: 2 }}>
                    &gt; {ex.you}
                  </div>
                )}
                <div style={{
                  border: `1px solid ${ex.border}`, clipPath: notch(6), padding: 8,
                  fontSize: 12, lineHeight: 1.5, whiteSpace: "pre-wrap",
                }}>
                  {ex.text}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* The current reply — a single prominent bubble. Lingers here,
            then talkPhaseStream graduates it into the scrollback above. */}
        {activeMsg && (
          <div style={{ flexShrink: 0 }}>
            {activeMsg.you && (
              <div style={{ fontSize: 11, color: theme.inkMuted, textAlign: "right", marginBottom: 4 }}>
                &gt; {activeMsg.you}
              </div>
            )}
            <div style={{
              border: `1px solid ${activeMsg.border}`, clipPath: notch(10), boxShadow: activeMsg.shadow, padding: 12,
              fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-wrap",
            }}>
              {activeMsg.text}
              {!activeMsg.done && <span style={{ color: activeMsg.border }}>▋</span>}
            </div>
            {/* speech-bubble tail, pointing down toward the sprite */}
            <div style={{
              width: 0, height: 0, marginLeft: 18,
              borderLeft: "6px solid transparent", borderRight: "6px solid transparent",
              borderTop: `7px solid ${activeMsg.border}`,
            }} />
          </div>
        )}
      </div>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={spriteSrc}
        alt=""
        style={{
          position: "absolute", left: 14, bottom: 90, width: 220, imageRendering: "pixelated",
          // Sprite frames are baked-in cream dots (dark-mode color). In
          // light mode that's invisible against a light background, so
          // invert to dark dots instead — approximate, not an exact
          // theme.ink match, but a static filter (changes only on theme
          // toggle) is far more robust than trying to recolor per-frame.
          filter: mode === "light" ? "invert(1)" : "none",
        }}
      />

      <div style={{ position: "absolute", bottom: 60, left: 20, right: 20, borderTop: `1px dotted ${theme.border}` }} />

      <form onSubmit={handleSubmit} style={{ position: "absolute", bottom: 24, left: 24, right: 24, pointerEvents: "auto", display: "flex", alignItems: "center", gap: 8 }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="> ask something..."
          style={{
            flex: 1, minWidth: 0, background: "transparent", border: "none", outline: "none",
            fontFamily: "'Courier New', monospace", fontSize: 13, color: theme.ink,
          }}
        />
        <button
          type="submit"
          aria-label="Send"
          disabled={!query.trim()}
          style={{
            background: "transparent", border: "none", padding: 0, flexShrink: 0,
            color: query.trim() ? theme.accent : theme.inkFaint,
            cursor: query.trim() ? "pointer" : "default",
            display: "flex", alignItems: "center",
          }}
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
