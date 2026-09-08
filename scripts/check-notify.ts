// Thin CLI wrapper for manually triggering the notify check locally.
// In production this same endpoint is called by .github/workflows/notify.yml.
const base = process.env.APP_URL ?? "http://localhost:3000";
fetch(`${base}/api/cron/notify`, {
  method: "POST",
  headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
})
  .then((r) => r.json())
  .then((data) => console.log("Notify check:", data))
  .catch((err) => { console.error(err); process.exit(1); });

export {};
