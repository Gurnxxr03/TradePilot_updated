# TradePilot — Local Setup

Your app has a working AI Mentor chat (powered by Groq) and real accounts (signup/signin),
backed by a shared Postgres database so the whole team sees the same data.

## 1. One-time setup: Node.js

You need **Node.js** installed. If you don't have it:
- Go to https://nodejs.org, download the "LTS" version, install it (just click Next through the installer).

## 2. One-time setup: shared database (do this once as a team)

This app uses a real Postgres database via **Supabase** (free tier) so everyone sees the same
accounts and data — no per-person local databases to keep in sync.

**One team member sets this up once:**
1. Go to https://supabase.com → sign up (free, no credit card needed) → "New Project"
2. Pick any project name and a database password (save this password somewhere safe)
3. Once the project is ready, go to **Project Settings → Database → Connection string → URI**
4. Copy that connection string (looks like `postgresql://postgres:[YOUR-PASSWORD]@...supabase.co:5432/postgres`)
5. Replace `[YOUR-PASSWORD]` in the string with the actual database password from step 2

**Share with teammates** (through a password manager or private message — never through git):
- The finished `DATABASE_URL` connection string
- A `JWT_SECRET` value (any long random string — just needs to be the same for everyone)

**Each teammate then:**
1. Copies `server/.env.example` to a new file named `server/.env`
2. Fills in the shared `DATABASE_URL` and `JWT_SECRET`, plus their own personal `GROQ_API_KEY`
   (free, from https://console.groq.com — each person should grab their own key)

The first time the server starts, it automatically creates the `users` table if it doesn't exist —
no manual database setup beyond the connection string.

## 3. Every time you want to run the app

1. Open a terminal in the `server` folder:
   - **Windows:** open the `server` folder, click the address bar, type `cmd`, hit Enter
   - **Mac:** right-click the `server` folder → "New Terminal at Folder"

2. First time only, install dependencies:
   ```
   npm install
   ```

3. Start the server:
   ```
   npm start
   ```

4. You should see:
   ```
   ✅ Connected to database, users table ready.
   ✅ TradePilot server running!
      Open this in your browser: http://localhost:3001/home.html
   ```

5. Open that link in your browser — **not** by double-clicking the HTML files anymore, since the chat and login features need the server running.

To stop the server, go back to the terminal and press `Ctrl + C`.

## Signup / Sign in

- `http://localhost:3001/signup.html` — create an account (name, email, password)
- `http://localhost:3001/signin.html` — log in
- **Dashboard, Explore, Today, Learn, and Smart Alerts** all require being logged in — if you're not, you'll be redirected to Sign In automatically. Only **Home** is public.
- Click the account icon (top right) while logged in to log out
- Passwords are hashed with bcrypt before storage — never saved in plain text
- Signup requires a valid email format and a password of 8+ characters with at least one letter and one number — checked live in the browser and again on the server

## AI Mentor chat

- A persistent chat panel appears in the sidebar on every app page (not just Home)
- Ask anything — it's powered by Groq's API through your local server
- Your conversation is saved per-account — leave and come back, it's still there

## Today's Narrative

- Open the "Today's Narrative" page — an AI-generated market summary loads automatically
- Click "Regenerate" any time for a fresh take

## Smart Alerts

- Click "Create New Alert" to set a price alert (symbol, above/below, target price)
- Since there's no real live market feed connected, prices are **simulated** (a deterministic drift, not random) — this is clearly a placeholder for a real market data API later
- Alerts you create appear under "Your Alerts" and automatically flip to "Triggered" once the simulated price crosses your target
- Delete any alert you no longer need

## Learn — Finance Quiz

- The "Daily Quiz" card is now a real multi-question quiz — answer each question and see your score at the end
- Your best score is saved per-account and shown each time you visit

## Dashboard — Your Holdings

- Click "Add Holding" to track a position (symbol, quantity, average cost)
- Market value and gain/loss are calculated using simulated prices (see note on Smart Alerts above)
- Remove any holding you no longer want to track

## Watchlist

- On the Explore page, click "Watchlist" to save the current symbol
- View and remove saved symbols from the Dashboard's "Your Watchlist" card

## Explore — Search any symbol

- Type any stock symbol (e.g. AAPL, TSLA, MSFT) into the top search bar and press Enter
- The price header updates with a simulated quote for that symbol — same simulated pricing engine used by Alerts and the Watchlist

## Settings

- Reachable from the "Settings" link in the AI Mentor sidebar on any app page
- Update your display name
- Change your password (requires current password)
- Toggle dark mode (saved locally in your browser)
- Log out

## Notes for the team
- `server/.env` holds real secrets (API key, JWT secret, database URL) — **never commit this file.** It's already excluded via `.gitignore`.
- `server/.env.example` is the template every teammate copies and fills in themselves.
- The Groq key currently in use was shared in a chat conversation — regenerate a fresh one at console.groq.com when convenient.
- Everyone should use the same `DATABASE_URL` and `JWT_SECRET`, but their own individual `GROQ_API_KEY`.
