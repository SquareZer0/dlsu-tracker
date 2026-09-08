// Thin CLI wrapper — hits the running dev/prod server's own sync route so the
// upsert logic only lives in one place (src/app/api/sync/canvas/route.ts).
const base = process.env.APP_URL ?? "http://localhost:3000";
fetch(`${base}/api/sync/canvas`, { method: "POST" })
  .then((r) => r.json())
  .then((data) => console.log("Canvas sync:", data))
  .catch((err) => { console.error(err); process.exit(1); });

export {};
