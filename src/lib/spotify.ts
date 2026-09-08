// As of Spotify's Development Mode restrictions, an app-only (Client
// Credentials) token can't read playlist contents at all anymore — the
// request has to be authenticated as the playlist's own owner. That's what
// the one-time login at /api/spotify/login accomplishes: it stores a
// refresh token in Settings, and everything here runs off that from then on.
import { prisma } from "@/lib/prisma";

async function refreshAccessToken(): Promise<string> {
  const settings = await prisma.settings.findUnique({ where: { id: 1 } });
  const refreshToken = settings?.spotifyRefreshToken;
  if (!refreshToken) throw new Error("Spotify not connected yet — visit /api/spotify/login once.");

  const creds = Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString("base64");
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { Authorization: `Basic ${creds}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken }).toString(),
  });
  if (!res.ok) throw new Error(`Spotify token refresh failed (${res.status}) — may need to reconnect at /api/spotify/login.`);
  const data = await res.json();

  // Spotify sometimes rotates the refresh token itself — persist the new one if so.
  if (data.refresh_token && data.refresh_token !== refreshToken) {
    await prisma.settings.update({ where: { id: 1 }, data: { spotifyRefreshToken: data.refresh_token } });
  }
  return data.access_token as string;
}

type Track = { name: string; artist: string; imageUrl: string | null };

async function getPlaylistTracks(): Promise<Track[]> {
  const playlistId = process.env.SPOTIFY_PLAYLIST_ID;
  if (!playlistId) throw new Error("SPOTIFY_PLAYLIST_ID not set");
  const token = await refreshAccessToken();
  const tracks: Track[] = [];
  // /items replaces the deprecated /tracks endpoint as of Spotify's Feb 2026 migration.
  let url: string | null =
    `https://api.spotify.com/v1/playlists/${playlistId}/items?fields=items(item(name,artists(name),album(images))),next&limit=100`;

  while (url) {
    const res: Response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error(`Spotify playlist request failed (${res.status})`);
    const data = await res.json();
    for (const entry of data.items ?? []) {
      const t = entry.item ?? entry.track; // defensive: fall back to the old field name if needed
      if (!t) continue;
      tracks.push({
        name: t.name,
        artist: (t.artists ?? []).map((a: any) => a.name).join(", "),
        imageUrl: t.album?.images?.[0]?.url ?? null,
      });
    }
    url = data.next ?? null;
  }
  return tracks;
}

// Deterministic per calendar day, not truly random — same pick for everyone
// on the same day, and it changes at UTC midnight without needing to store
// "today's pick" anywhere.
function seededIndex(seed: number, max: number) {
  const x = Math.sin(seed) * 10000;
  return Math.floor((x - Math.floor(x)) * max);
}

export async function getSongOfTheDay(): Promise<Track> {
  const tracks = await getPlaylistTracks();
  if (tracks.length === 0) throw new Error("Playlist has no tracks");
  const dayIndex = Math.floor(Date.now() / 86400000);
  return tracks[seededIndex(dayIndex, tracks.length)];
}
