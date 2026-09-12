"use client";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

const VOLUME_STORAGE_KEY = "dlsu-tracker-volume";

const MusicContext = createContext<{ playing: boolean; toggle: () => void; volume: number; setVolume: (v: number) => void }>({
  playing: false,
  toggle: () => {},
  volume: 100,
  setVolume: () => {},
});

// Renders the single <audio> element the whole app shares, so it keeps
// playing across page navigation instead of restarting on every route.
export function MusicProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolumeState] = useState(100); // 0-100, remembered across visits like the theme

  useEffect(() => {
    const raw = localStorage.getItem(VOLUME_STORAGE_KEY);
    if (raw === null) return;
    const stored = Number(raw);
    if (Number.isFinite(stored) && stored >= 0 && stored <= 100) setVolumeState(stored);
  }, []);

  // The audio file lives behind the same login gate as everything else, so
  // mounting the tag on /login (before auth) would fetch it unauthenticated,
  // get redirected, and permanently poison the element — a browser doesn't
  // retry a failed media source just because a cookie shows up afterward via
  // client-side navigation. Only rendering it once we're off /login means it
  // mounts fresh, already authenticated, same as CompanionSidebar does.
  const showAudio = pathname !== "/login";

  useEffect(() => {
    if (!showAudio || !audioRef.current) return;
    audioRef.current.volume = volume / 100;
    // Browsers block unrequested autoplay with sound unless the user has
    // already interacted with the page — if that happens, this silently
    // fails and the button just starts in its "paused" state instead.
    audioRef.current.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  }, [showAudio]);

  // Keep the live element in sync whenever the volume changes, not just on mount.
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume / 100;
  }, [volume]);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play().then(() => setPlaying(true)).catch(() => {});
    }
  };

  const setVolume = (v: number) => {
    if (!Number.isFinite(v)) return; // e.g. the number field momentarily cleared mid-edit
    const clamped = Math.max(0, Math.min(100, Math.round(v)));
    setVolumeState(clamped);
    localStorage.setItem(VOLUME_STORAGE_KEY, String(clamped));
  };

  return (
    <MusicContext.Provider value={{ playing, toggle, volume, setVolume }}>
      {showAudio && <audio ref={audioRef} src="/audio/background.m4a" loop />}
      {children}
    </MusicContext.Provider>
  );
}

export function useMusic() {
  return useContext(MusicContext);
}
