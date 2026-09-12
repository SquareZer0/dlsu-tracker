"use client";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

const MusicContext = createContext<{ playing: boolean; toggle: () => void }>({
  playing: false,
  toggle: () => {},
});

// Renders the single <audio> element the whole app shares, so it keeps
// playing across page navigation instead of restarting on every route.
export function MusicProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  // The audio file lives behind the same login gate as everything else, so
  // mounting the tag on /login (before auth) would fetch it unauthenticated,
  // get redirected, and permanently poison the element — a browser doesn't
  // retry a failed media source just because a cookie shows up afterward via
  // client-side navigation. Only rendering it once we're off /login means it
  // mounts fresh, already authenticated, same as CompanionSidebar does.
  const showAudio = pathname !== "/login";

  useEffect(() => {
    if (!showAudio) return;
    // Browsers block unrequested autoplay with sound unless the user has
    // already interacted with the page — if that happens, this silently
    // fails and the button just starts in its "paused" state instead.
    audioRef.current?.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  }, [showAudio]);

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

  return (
    <MusicContext.Provider value={{ playing, toggle }}>
      {showAudio && <audio ref={audioRef} src="/audio/background.m4a" loop />}
      {children}
    </MusicContext.Provider>
  );
}

export function useMusic() {
  return useContext(MusicContext);
}
