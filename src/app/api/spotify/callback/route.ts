import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const errorParam = req.nextUrl.searchParams.get("error");
  if (errorParam) return NextResponse.json({ error: `Spotify login was not completed: ${errorParam}` }, { status: 400 });
  if (!code) return NextResponse.json({ error: "No authorization code returned by Spotify." }, { status: 400 });

  const redirectUri = `${req.nextUrl.origin}/api/spotify/callback`;
  const creds = Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString("base64");
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { Authorization: `Basic ${creds}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: redirectUri }).toString(),
  });
  if (!res.ok) {
    const detail = await res.text();
    return NextResponse.json({ error: `Spotify token exchange failed (${res.status})`, detail }, { status: 502 });
  }
  const data = await res.json();

  await prisma.settings.upsert({
    where: { id: 1 },
    update: { spotifyRefreshToken: data.refresh_token },
    create: { id: 1, spotifyRefreshToken: data.refresh_token },
  });

  const home = req.nextUrl.clone();
  home.pathname = "/";
  home.search = "";
  return NextResponse.redirect(home);
}
