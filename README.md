# DLSU Tracker

Full-stack personal tracker: assignments, exams, a live class schedule, and a
finance tracker. Desktop gets one wide dashboard; mobile gets a home screen
plus bottom-tab pages per widget. Both share the same Next.js API and
database — there's exactly one copy of the data.

## Stack

- Next.js 14 (App Router) + TypeScript + Tailwind
- Prisma, SQLite locally / Turso in production
- ntfy.sh for push notifications, triggered by a GitHub Actions cron
  (Vercel's free-tier cron only runs once a day, which isn't enough for
  15-minute class reminders)

## 1. Local setup

```bash
cd dlsu-tracker
npm install
cp .env.example .env
```

Edit `.env`:
- `PASSCODE` — whatever you want to type to unlock the app
- `AUTH_SECRET` — any long random string
- `NTFY_TOPIC` — keep the generated one, or pick your own unguessable name
- `CANVAS_ICS_URL` — your Canvas calendar feed link
- `CRON_SECRET` — any long random string

Then:

```bash
npm run db:push     # creates dev.db and the tables
npm run db:seed      # loads the assignments/exams/schedule already pulled
npm run dev           # http://localhost:3000
```

Log in with the passcode you set. From there:
- **Sync Canvas** (top of the app) re-pulls your Canvas feed — this runs
  server-side now, so it actually works, unlike the browser-side attempt in
  the design mockup.
- To test notifications locally: `npm run notify:check` (needs `CRON_SECRET`
  set and the dev server running).

## 2. Push to GitHub

I can't push this for you — that needs your own GitHub login, not a token
typed into a chat. From inside `dlsu-tracker/`:

```bash
git init
git add .
git commit -m "Initial commit"
```

Then, on github.com: create a new **private** repository named
`dlsu-tracker` (don't initialize it with a README). GitHub will show you a
remote URL — use it here:

```bash
git branch -M main
git remote add origin https://github.com/<your-username>/dlsu-tracker.git
git push -u origin main
```

(I already ran the first two commands for you in the sandbox — see below.)

## 3. Deploy (Vercel)

1. Import the GitHub repo at vercel.com/new.
2. **Database:** create a free database at [turso.tech](https://turso.tech),
   then in Vercel's project settings → Environment Variables, add:
   - `TURSO_DATABASE_URL`
   - `TURSO_AUTH_TOKEN`
   - `DATABASE_URL` = `file:./dev.db` (unused at runtime once Turso vars are
     set, but Prisma's generator wants something here)
3. Add the rest of your `.env` values as Vercel environment variables too:
   `PASSCODE`, `AUTH_SECRET`, `NTFY_TOPIC`, `CANVAS_ICS_URL`, `CRON_SECRET`.
4. Deploy. Then run the schema against the *production* database once:
   ```bash
   TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... npx prisma db push
   ```
5. Visit your deployed URL, log in, hit **Sync Canvas** once to populate it
   (or re-run the seed script against the Turso DB).

## 4. Wire up ntfy notifications

1. Install the **ntfy** app (iOS/Android) or open ntfy.sh in a browser.
2. Subscribe to your topic (the `NTFY_TOPIC` value from `.env`).
3. In your GitHub repo → Settings → Secrets and variables → Actions, add:
   - `APP_URL` — your deployed Vercel URL (e.g. `https://dlsu-tracker.vercel.app`)
   - `CRON_SECRET` — same value as in Vercel's env vars
4. The workflow in `.github/workflows/notify.yml` runs every 15 minutes once
   it's on GitHub's default branch — no further setup needed. You can also
   trigger it manually from the Actions tab (`workflow_dispatch`) to test it.

You'll get a push when:
- An assignment or exam is 2–3 days from its due date (fires once)
- A class starts within 15 minutes (fires once per class per day)

## Notes / things I simplified for v1

- **Class schedule** is stored in the database (seeded from what we already
  pulled from your Google Calendar), not live-synced. A real Google Calendar
  OAuth integration is a bigger lift — happy to add it later if the weekly
  pattern ever changes.
- **Auth** is a single shared passcode, not per-user accounts — fine for a
  personal tool, not something to reuse for anything multi-user.
