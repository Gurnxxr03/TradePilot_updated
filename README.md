# TradePilot

An AI-powered finance mentor app. Originally designed in Stitch, now a working full-stack app with
real accounts, a live AI chat mentor, and several interactive features backed by a shared Postgres database.

---

## What's built so far

| Feature | Where | Status |
|---|---|---|
| **Signup / Sign in / Logout** | `signup.html`, `signin.html` | Real accounts, bcrypt-hashed passwords, JWT sessions |
| **Page protection** | Dashboard, Explore, Today, Learn, Smart Alerts | Redirects to Sign In if not logged in. Home is public. |
| **AI Mentor chat** | Sidebar on every app page + a mini widget on Explore | Powered by Groq's API; conversation history saved per-account |
| **Today's Narrative** | `today.html` | AI-generated daily market summary, regenerate on demand |
| **Smart Alerts** | `alerts.html` | Create price alerts (above/below a target); auto-checked against simulated prices |
| **Learn — Finance Quiz** | `learn.html` | 7-question interactive quiz, scored server-side, best score saved per-account |
| **Dashboard — Holdings** | `dashboard.html` | Add/remove stock positions; market value & gain/loss calculated live |
| **Watchlist** | Add from Explore, view/remove on Dashboard | Saved per-account |
| **Explore — Search** | `explore.html` | Search any stock symbol, see a simulated quote |
| **Settings** | `settings.html` | Update name, change password, toggle dark mode, log out |

**Important:** there is no real market data feed connected. All prices (Alerts, Watchlist, Holdings,
Explore search) come from a deterministic simulator in `server/mock-market.js`. This is intentionally
isolated in one file so it can be swapped for a real market data API later without touching anything else.

A full manual testing checklist (step-by-step, with expected results for every feature above) is in `TESTING.md`.

---

## Tech stack

- **Frontend:** static HTML + Tailwind (via CDN) + vanilla JS — no build step
- **Backend:** Node.js + Express
- **Database:** Postgres (via Supabase's free tier) — shared by the whole team
- **AI:** Groq API (Llama 3.3 70B) for chat and narrative generation
- **Auth:** JWT tokens + bcrypt password hashing

---

## Running it locally

### 1. Install Node.js
Download the "LTS" version from https://nodejs.org if you don't have it.

### 2. Get the shared database connection (ask a teammate)
This app uses one shared Postgres database (via Supabase) so everyone sees the same accounts and data.
Whoever set up the Supabase project should share:
- The `DATABASE_URL` connection string
- The `JWT_SECRET` value

...through a private channel (password manager, DM) — **never through GitHub or Slack in plaintext long-term.**

If you're the one setting it up for the first time:
1. Go to https://supabase.com → sign up (free) → "New Project"
2. Set a database password (save it)
3. Click the **"Connect"** button at the top of the project dashboard → find the **connection string / URI**
4. Copy it and swap in your actual database password where it says `[YOUR-PASSWORD]`

### 3. Get your own Groq API key (free)
Each teammate should get their own personal key from https://console.groq.com — don't share one key across the team.

### 4. Configure your environment
```
cd server
cp .env.example .env
```
Open `server/.env` and fill in:
```
GROQ_API_KEY=your-own-groq-key
PORT=3001
JWT_SECRET=shared-value-from-teammate
DATABASE_URL=shared-connection-string-from-teammate
```

### 5. Install and run
```
npm install
npm start
```
You should see:
```
✅ Connected to database, all tables ready.
✅ TradePilot server running!
   Open this in your browser: http://localhost:3001/home.html
```

Open that link in your browser. The `users`, `alerts`, `holdings`, `watchlist`, `chat_messages`, and
`quiz_attempts` tables are created automatically the first time the server starts — no manual database
setup beyond the connection string.

---

## Pushing to GitHub

This project is already set up as a git repository with a first commit made, and `.gitignore` already
excludes `node_modules/` and `.env` (so secrets never get committed).

To push it to your own GitHub:

1. Create a new empty repository on https://github.com (don't initialize it with a README/gitignore — this project already has them)
2. In this project's root folder, run:
   ```
   git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git
   git branch -M main
   git push -u origin main
   ```
3. Share the repo URL with your team — everyone else can clone it:
   ```
   git clone https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git
   ```
   ...then follow the "Running it locally" steps above (each person still needs their own `server/.env`,
   since that file is never committed).

---

## Deploying (so there's one live version everyone can check)

Recommended host: **Render** (https://render.com) — free tier available, deploys automatically every
time you push to GitHub.

### One-time setup
1. Push this repo to GitHub first (see above)
2. Go to https://render.com → sign up (can use your GitHub account) → **"New +" → "Web Service"**
3. Connect your GitHub repo
4. Configure:
   - **Root Directory:** `server`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. Under **Environment Variables**, add the same three values from your `.env`:
   - `GROQ_API_KEY`
   - `JWT_SECRET`
   - `DATABASE_URL`
   
   (Don't add `PORT` — Render sets this automatically and the app already reads `process.env.PORT`.)
6. Click **"Create Web Service"**

Render will build and deploy the app, giving you a live URL like `https://tradepilot.onrender.com`.

### From then on
Every time anyone pushes to the `main` branch on GitHub, Render automatically redeploys — so the live
version always reflects the latest pushed code, and everyone can test against that same shared, live
version instead of their own local copy.

**Note:** the free tier on Render spins the service down after periods of inactivity, so the very first
request after a quiet period can take ~30-60 seconds to wake back up. This is normal for free hosting tiers.

---

## Notes for the team

- `server/.env` holds real secrets — **never commit this file.** `.gitignore` already excludes it.
- `server/.env.example` is the template every teammate copies and fills in themselves.
- Everyone should use the same `DATABASE_URL` and `JWT_SECRET`, but their own individual `GROQ_API_KEY`.
- The same environment variables (`DATABASE_URL`, `JWT_SECRET`, `GROQ_API_KEY`) need to be set in Render's
  dashboard too, separately from your local `.env` — they don't sync automatically.
