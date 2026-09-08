import { NextResponse } from "next/server";
import * as ical from "node-ical";

export const dynamic = "force-dynamic";

export type GCalEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  startTime: string;
  endTime: string;
  location: string | null;
  description: string | null;
  isAllDay: boolean;
  dateKey: string; // YYYY-MM-DD
};

// Date formatter helpers for Manila timezone (UTC+8)
function toManilaDateKey(date: Date): string {
  // YYYY-MM-DD in en-CA format gives ISO date in local time
  return date.toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
}

function formatClockTime(date: Date): string {
  return date.toLocaleTimeString("en-PH", {
    timeZone: "Asia/Manila",
    hour: "numeric",
    minute: "2-digit",
  }).toUpperCase();
}

function generateSampleEvents(now: Date): GCalEvent[] {
  const events: GCalEvent[] = [];
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();

  const mkEv = (
    day: number,
    startH: number,
    startM: number,
    endH: number,
    endM: number,
    title: string,
    location: string | null = null,
    isAllDay = false
  ): GCalEvent => {
    const s = new Date(y, m, day, startH, startM, 0);
    const e = new Date(y, m, day, endH, endM, 0);
    return {
      id: `sample-${day}-${startH}-${title.replace(/\s+/g, "-")}`,
      title,
      start: s.toISOString(),
      end: e.toISOString(),
      startTime: isAllDay ? "ALL DAY" : formatClockTime(s),
      endTime: isAllDay ? "" : formatClockTime(e),
      location,
      description: null,
      isAllDay,
      dateKey: toManilaDateKey(s),
    };
  };

  // Today's events (Wed, Sep 9)
  events.push(
    mkEv(d, 10, 0, 12, 0, "LCLSONE (Lasallian Journey)", "LS330"),
    mkEv(d, 13, 0, 14, 30, "STADVDB Group Sync", "Gokongwei Discussion Rm 2"),
    mkEv(d, 16, 0, 17, 30, "CSOPESY Study Session", "Library 6th Flr")
  );

  // Tomorrow's events (Thu, Sep 10)
  events.push(
    mkEv(d + 1, 11, 0, 12, 30, "CSOPESY Lecture", "G207"),
    mkEv(d + 1, 14, 30, 16, 0, "SPANONE (F2F)", "MM601"),
    mkEv(d + 1, 17, 0, 18, 0, "Thesis Team Standup", "Google Meet")
  );

  // Friday (Thu + 1)
  events.push(
    mkEv(d + 2, 11, 0, 12, 30, "STADVDB Lecture", "Online"),
    mkEv(d + 2, 14, 30, 16, 0, "CCINOV8 Innovation Lab", "M316"),
    mkEv(d + 2, 16, 15, 17, 45, "LCENWRD Technical Writing", "L207"),
    mkEv(d + 2, 19, 0, 21, 0, "College Game Night", "Razon Sports Complex")
  );

  // Other days in the month to showcase density gradients
  events.push(
    mkEv(d - 5, 9, 0, 10, 0, "Term 1 Consultation"),
    mkEv(d - 4, 10, 0, 12, 0, "LCLSONE"),
    mkEv(d - 2, 11, 0, 12, 30, "CSOPESY"),
    mkEv(d - 2, 14, 30, 16, 0, "SPANONE"),
    mkEv(d - 1, 11, 0, 12, 30, "STADVDB"),
    mkEv(d - 1, 14, 30, 16, 0, "CCINOV8"),
    mkEv(d - 1, 16, 15, 17, 45, "LCENWRD"),
    mkEv(d - 1, 18, 0, 19, 0, "Org Meeting"),
    mkEv(d + 5, 8, 0, 17, 0, "Hackathon Qualifiers", "Henry Sy Hall", true),
    mkEv(d + 6, 11, 0, 12, 30, "CSOPESY"),
    mkEv(d + 7, 10, 0, 12, 0, "Midterm Review"),
    mkEv(d + 7, 14, 0, 15, 30, "Consultation Hour"),
    mkEv(d + 12, 8, 0, 11, 0, "H01 Query Defense", "G301"),
    mkEv(d + 12, 13, 0, 15, 0, "Group Project Work"),
    mkEv(d + 12, 16, 0, 17, 0, "Adviser Meeting"),
    mkEv(d + 12, 17, 30, 19, 0, "Study Sprint"),
    mkEv(d + 12, 19, 30, 21, 0, "Code Review"),
    mkEv(d + 14, 9, 0, 12, 0, "Midterm Exam Block", "G207")
  );

  return events;
}

export async function GET(req: Request) {
  const url = process.env.GOOGLE_CALENDAR_ICS_URL;
  const now = new Date();

  const todayKey = toManilaDateKey(now);
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowKey = toManilaDateKey(tomorrow);

  let rawEvents: GCalEvent[] = [];
  let isLive = false;
  let statusMessage = "";

  if (url && url.startsWith("http")) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "DLSU-Tracker-Client/1.0" },
        cache: "no-store",
      });

      if (res.ok) {
        const text = await res.text();
        if (text.includes("BEGIN:VCALENDAR")) {
          const parsed = ical.parseICS(text);
          const windowStart = new Date(now);
          windowStart.setDate(windowStart.getDate() - 35);
          const windowEnd = new Date(now);
          windowEnd.setDate(windowEnd.getDate() + 45);

          for (const key in parsed) {
            const ev: any = parsed[key];
            if (ev.type !== "VEVENT" || !ev.start || !ev.summary) continue;

            const duration = ev.end ? ev.end.getTime() - ev.start.getTime() : 3600000;
            const isAllDay =
              ev.datetype === "date" ||
              (ev.start && ev.end && duration >= 86400000 && ev.start.getHours() === 0 && ev.start.getMinutes() === 0);

            // Handle recurring events
            if (ev.rrule) {
              const occurrences = ev.rrule.between(windowStart, windowEnd, true);
              for (const occ of occurrences) {
                const occStart = new Date(occ);
                const occEnd = new Date(occStart.getTime() + duration);
                const dateKey = toManilaDateKey(occStart);

                rawEvents.push({
                  id: `${ev.uid ?? key}-${occStart.getTime()}`,
                  title: ev.summary,
                  start: occStart.toISOString(),
                  end: occEnd.toISOString(),
                  startTime: isAllDay ? "ALL DAY" : formatClockTime(occStart),
                  endTime: isAllDay ? "" : formatClockTime(occEnd),
                  location: ev.location || null,
                  description: ev.description || null,
                  isAllDay,
                  dateKey,
                });
              }
            } else {
              const s = new Date(ev.start);
              const e = ev.end ? new Date(ev.end) : new Date(s.getTime() + 3600000);
              const dateKey = toManilaDateKey(s);

              rawEvents.push({
                id: ev.uid ?? key,
                title: ev.summary,
                start: s.toISOString(),
                end: e.toISOString(),
                startTime: isAllDay ? "ALL DAY" : formatClockTime(s),
                endTime: isAllDay ? "" : formatClockTime(e),
                location: ev.location || null,
                description: ev.description || null,
                isAllDay,
                dateKey,
              });
            }
          }
          isLive = true;
          statusMessage = "Connected to Google Calendar.";
        } else {
          statusMessage = "Google Calendar link returned invalid iCal data.";
        }
      } else {
        statusMessage = `Google Calendar returned status ${res.status}. DLSU accounts require the 'Secret address in iCal format' (/private-.../basic.ics), not the public URL.`;
      }
    } catch (err: any) {
      statusMessage = `Failed to reach Google Calendar: ${err.message}`;
    }
  } else {
    statusMessage = "GOOGLE_CALENDAR_ICS_URL not configured. Add your 'Secret address in iCal format' in .env or Vercel.";
    // Only generate sample preview if no URL was provided at all
    rawEvents = generateSampleEvents(now);
  }

  // Calculate event density map
  const eventsByDate: Record<string, { count: number; events: GCalEvent[] }> = {};
  for (const ev of rawEvents) {
    if (!eventsByDate[ev.dateKey]) {
      eventsByDate[ev.dateKey] = { count: 0, events: [] };
    }
    eventsByDate[ev.dateKey].count++;
    eventsByDate[ev.dateKey].events.push(ev);
  }

  // Sort events within each date chronologically
  for (const k in eventsByDate) {
    eventsByDate[k].events.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  }

  const todayEvents = eventsByDate[todayKey]?.events ?? [];
  const tomorrowEvents = eventsByDate[tomorrowKey]?.events ?? [];

  return NextResponse.json({
    isLive,
    statusMessage,
    todayKey,
    tomorrowKey,
    eventsByDate,
    today: todayEvents,
    tomorrow: tomorrowEvents,
  });
}
