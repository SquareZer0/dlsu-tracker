"use client";
import { useEffect, useRef, useState } from "react";
import { Music2 } from "lucide-react";
import { Panel } from "./Panel";
import { SectionHeader } from "./SectionHeader";
import { theme } from "@/lib/theme";

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.substring(0, 2), 16), parseInt(h.substring(2, 4), 16), parseInt(h.substring(4, 6), 16)];
}

type Song = { title: string; artist: string; hasArtwork: boolean };

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

  // Recolors the artwork onto the same two tones used everywhere else in the
  // app, mapped from each pixel's brightness — done client-side on a canvas
  // so no image-processing dependency is needed on the server.
  useEffect(() => {
    if (!song?.hasArtwork || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = new Image();
    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const dark = hexToRgb(theme.panel);
      const light = hexToRgb(theme.ink);
      const d = imageData.data;
      for (let i = 0; i < d.length; i += 4) {
        const lum = (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) / 255;
        d[i] = dark[0] + (light[0] - dark[0]) * lum;
        d[i + 1] = dark[1] + (light[1] - dark[1]) * lum;
        d[i + 2] = dark[2] + (light[2] - dark[2]) * lum;
      }
      ctx.putImageData(imageData, 0, 0);
    };
    img.src = "/api/song-of-day/artwork";
  }, [song]);

  return (
    <Panel className="px-4 py-4 mb-8">
      <SectionHeader icon={<Music2 size={14} />} label="SONG OF THE DAY" />
      {error ? (
        <p className="text-xs" style={{ color: theme.accent }}>{error}</p>
      ) : !song ? (
        <p className="text-xs" style={{ color: theme.inkFaint }}>Loading…</p>
      ) : (
        <div className="flex items-center gap-4">
          {song.hasArtwork ? (
            <canvas ref={canvasRef} className="w-20 h-20 border" style={{ borderColor: theme.border }} />
          ) : (
            <div className="w-20 h-20 border flex items-center justify-center shrink-0" style={{ borderColor: theme.border }}>
              <Music2 size={24} style={{ color: theme.inkFaint }} />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{song.title}</p>
            <p className="text-xs truncate" style={{ color: theme.inkMuted }}>{song.artist}</p>
          </div>
        </div>
      )}
    </Panel>
  );
}
