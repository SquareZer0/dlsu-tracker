import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const errorParam = req.nextUrl.searchParams.get("error");
  if (errorParam) return NextResponse.json({ error: `Google login was not completed: ${errorParam}` }, { status: 400 });
  if (!code) return NextResponse.json({ error: "No authorization code returned by Google." }, { status: 400 });

  const redirectUri = `${req.nextUrl.origin}/api/google/callback`;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }).toString(),
  });
  if (!res.ok) {
    const detail = await res.text();
    return NextResponse.json({ error: `Google token exchange failed (${res.status})`, detail }, { status: 502 });
  }
  const data = await res.json();
  if (!data.refresh_token) {
    return NextResponse.json(
      {
        error:
          "Google didn't return a refresh token. Revoke DLSU Tracker's access at myaccount.google.com/permissions and try again — Google only issues one on a fresh consent.",
      },
      { status: 502 }
    );
  }

  await prisma.settings.upsert({
    where: { id: 1 },
    update: { googleRefreshToken: data.refresh_token },
    create: { id: 1, googleRefreshToken: data.refresh_token },
  });

  const home = req.nextUrl.clone();
  home.pathname = "/";
  home.search = "";
  return NextResponse.redirect(home);
}
