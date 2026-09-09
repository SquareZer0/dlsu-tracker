import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// One-time step: visiting this URL sends you to Google's own login page,
// where you approve calendar-event write access. After that, the callback
// below stores a refresh token and nothing manual is needed again.
export async function GET(req: NextRequest) {
  const redirectUri = `${req.nextUrl.origin}/api/google/callback`;
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID ?? "",
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/calendar.events",
    access_type: "offline", // required to get a refresh_token back
    prompt: "consent", // forces the consent screen every time, so a refresh_token is always issued
  });
  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
}
