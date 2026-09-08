import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// One-time step: visiting this URL sends you to Spotify's own login page,
// where you approve read-only access to your playlists. After that, the
// callback below stores a refresh token and nothing manual is needed again.
export async function GET(req: NextRequest) {
  const redirectUri = `${req.nextUrl.origin}/api/spotify/callback`;
  const params = new URLSearchParams({
    client_id: process.env.SPOTIFY_CLIENT_ID ?? "",
    response_type: "code",
    redirect_uri: redirectUri,
    scope: "playlist-read-private",
  });
  return NextResponse.redirect(`https://accounts.spotify.com/authorize?${params.toString()}`);
}
