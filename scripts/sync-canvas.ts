// Thin CLI wrapper — hits the running dev/prod server's cron sync route so the
// upsert logic only lives in one place (src/lib/canvasSync.ts). Uses the
// bearer-secret cron route (not the cookie-protected one the UI button
// calls) since a plain script has no browser session to authenticate with.
const base = process.env.APP_URL ?? "http://localhost:3000";
fetch(`${base}/api/cron/sync-canvas`, {
  method: "POST",
  headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
})
  .then((r) => r.json())
  .then((data) => console.log("Canvas sync:", data))
  .catch((err) => { console.error(err); process.exit(1); });

export {};
