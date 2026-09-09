// Mirrors lib/spotify.ts's pattern: a one-time login (see /api/google/login)
// stores a refresh token in Settings, and every write from then on runs off
// that. Scoped to calendar.events only (not full calendar access).
import { prisma } from "@/lib/prisma";

async function refreshAccessToken(): Promise<string> {
  const settings = await prisma.settings.findUnique({ where: { id: 1 } });
  const refreshToken = settings?.googleRefreshToken;
  if (!refreshToken) throw new Error("Google Calendar not connected yet — visit /api/google/login once.");

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }).toString(),
  });
  if (!res.ok) throw new Error(`Google token refresh failed (${res.status}) — may need to reconnect at /api/google/login.`);
  const data = await res.json();
  return data.access_token as string;
}

export type NewCalendarEvent = {
  title: string;
  start: string; // ISO 8601 with offset, e.g. 2026-09-10T15:00:00+08:00
  end: string;
  location?: string;
};

export async function createCalendarEvent(ev: NewCalendarEvent) {
  const token = await refreshAccessToken();
  const res = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      summary: ev.title,
      location: ev.location || undefined,
      description: "Added via DLSU Tracker companion",
      start: { dateTime: ev.start },
      end: { dateTime: ev.end },
    }),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Google Calendar event creation failed (${res.status}): ${detail}`);
  }
  return res.json() as Promise<{ htmlLink: string }>;
}
