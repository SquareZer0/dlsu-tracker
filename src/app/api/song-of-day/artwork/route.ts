import { getSongOfTheDay } from "@/lib/spotify";

export const dynamic = "force-dynamic";

// Proxies the artwork through our own origin — the client-side canvas needs
// same-origin image data to read/recolor its pixels, and Spotify's CDN
// doesn't send the CORS headers that would allow that cross-origin.
export async function GET() {
  try {
    const song = await getSongOfTheDay();
    if (!song.imageUrl) return new Response(null, { status: 404 });
    const res = await fetch(song.imageUrl);
    if (!res.ok) return new Response(null, { status: 502 });
    const buf = await res.arrayBuffer();
    return new Response(buf, {
      headers: {
        "Content-Type": res.headers.get("content-type") ?? "image/jpeg",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return new Response(null, { status: 502 });
  }
}
