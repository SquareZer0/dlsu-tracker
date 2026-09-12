"use client";
import { createContext, useContext, useEffect, useRef, useState } from "react";

const MusicContext = createContext<{ playing: boolean; toggle: () => void }>({
  playing: false,
  toggle: () => {},
});

// Renders the single <audio> element the whole app shares, so it keeps
// playing across page navigation instead of restarting on every route.
export function MusicProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    // Browsers block unrequested autoplay with sound unless the user has
    // already interacted with the page — if that happens, this silently
    // fails and the button just starts in its "paused" state instead.
    audioRef.current?.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  }, []);

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
      <audio ref={audioRef} src="/audio/background.mp3" loop />
      {children}
    </MusicContext.Provider>
  );
}

export function useMusic() {
  return useContext(MusicContext);
}
