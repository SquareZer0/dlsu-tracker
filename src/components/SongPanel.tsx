"use client";
import { useEffect, useRef, useState } from "react";
import { Music2 } from "lucide-react";
import { Panel } from "./Panel";
import { theme } from "@/lib/theme";

type Song = { title: string; artist: string; hasArtwork: boolean; spotifyUrl: string | null };

// Compact card meant to sit beside the greeting heading, not as its own
// full-width section — full width on mobile (stacks below the greeting),
// fixed width alongside it on desktop.
export function SongPanel() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [song, setSong] = useState<Song | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/song-of-day")
      .then((r) => r.json())
      .then((data) => (data.error ? setError(data.error) : setSong(data)))
      .catch(() => setError("Couldn't reach the server."));
  }, []);

  // Ben-Day dots: sample each grid cell's average brightness from the
  // original photo, then draw a single dot per cell sized to that
  // brightness — bright patches get big dots, dark patches shrink toward
  // nothing, same two tones as the rest of the app instead of full color.
  useEffect(() => {
    if (!song?.hasArtwork || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = new Image();
    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      // draw the original into an offscreen canvas purely to sample it
      const off = document.createElement("canvas");
      off.width = canvas.width;
      off.height = canvas.height;
      const offCtx = off.getContext("2d");
      if (!offCtx) return;
      offCtx.drawImage(img, 0, 0);
      const { data } = offCtx.getImageData(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = theme.panel;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = theme.ink;

      const cellSize = Math.max(4, Math.round(canvas.width / 50));
      for (let y = 0; y < canvas.height; y += cellSize) {
        for (let x = 0; x < canvas.width; x += cellSize) {
          let total = 0, count = 0;
          const yMax = Math.min(y + cellSize, canvas.height);
          const xMax = Math.min(x + cellSize, canvas.width);
          for (let yy = y; yy < yMax; yy++) {
            for (let xx = x; xx < xMax; xx++) {
              const idx = (yy * canvas.width + xx) * 4;
              total += 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
              count++;
            }
          }
          const avgLum = total / count / 255;
          const radius = (cellSize / 2) * avgLum * 0.95;
          if (radius > 0.6) {
            ctx.beginPath();
            ctx.arc(x + cellSize / 2, y + cellSize / 2, radius, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    };
    img.src = "/api/song-of-day/artwork";
  }, [song]);

  const content = (
    <>
      <div className="flex items-center gap-1.5 mb-2 text-[10px] tracking-widest" style={{ color: theme.inkFaint }}>
        <Music2 size={11} /> SONG OF THE DAY
      </div>
      {error ? (
        <p className="text-xs" style={{ color: theme.accent }}>{error}</p>
      ) : !song ? (
        <p className="text-xs" style={{ color: theme.inkFaint }}>Loading…</p>
      ) : (
        <>
          {song.hasArtwork ? (
            <canvas ref={canvasRef} className="w-full aspect-square border mb-2" style={{ borderColor: theme.border }} />
          ) : (
            <div className="w-full aspect-square border mb-2 flex items-center justify-center" style={{ borderColor: theme.border }}>
              <Music2 size={20} style={{ color: theme.inkFaint }} />
            </div>
          )}
          <p className="text-sm font-medium truncate">{song.title}</p>
          <p className="text-xs truncate" style={{ color: theme.inkMuted }}>{song.artist}</p>
        </>
      )}
    </>
  );

  return (
    <Panel className="w-full md:w-64 shrink-0 px-4 py-4">
      {song?.spotifyUrl ? (
        <a href={song.spotifyUrl} target="_blank" rel="noopener noreferrer" className="block">
          {content}
        </a>
      ) : (
        content
      )}
    </Panel>
  );
}

