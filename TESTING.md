# TradePilot — Full Testing Checklist

Before testing, make sure the server is running:
```
cd server
npm install   (first time only)
npm start
```
You should see `✅ Connected to database, all tables ready.` and `✅ TradePilot server running!`
Then open **http://localhost:3001/home.html** in your browser.

---

## 1. Signup / Sign in / Logout

| Test | Steps | Expected result |
|---|---|---|
| Sign up | Click "Get Started" on Home → fill in name, a real-looking email, and a password | Live hints appear as you type; weak passwords (e.g. "abc") are flagged before you even submit |
| Duplicate email | Try signing up again with the same email | Error: "An account with this email already exists." |
| Sign in | Go to `signin.html`, use the account you just made | Redirects to Dashboard, logged in |
| Wrong password | Try signing in with the wrong password | Error: "Invalid email or password." |
| Page protection | While logged out, open `dashboard.html` (or explore/today/learn/alerts) directly | You get bounced to Sign In automatically |
| Logout | While logged in, click the account icon (top right) | Confirms, then logs you out and redirects to Sign In |

---

## 2. AI Mentor Chat (sidebar, every app page)

| Test | Steps | Expected result |
|---|---|---|
| Basic chat | On any app page, type a question in the sidebar chat and hit Enter | Get a real AI response (via Groq) |
| Persistence | Ask something, then reload the page | Your conversation reloads instead of starting fresh |
| Cross-page | Ask something on Explore, then go to Dashboard | Same conversation history appears (it's tied to your account, not the page) |
| Explore's "Deep Dive" box | Scroll down on Explore to the "Deep Dive NVDA" box, try a suggested prompt | Also gets a real AI response (separate mini-widget, same backend) |

---

## 3. Today's Narrative

| Test | Steps | Expected result |
|---|---|---|
| Auto-load | Open `today.html` | An AI-generated "What happened / Why / Beginner Explainer" loads automatically within a couple seconds |
| Regenerate | Click the "Regenerate" button | New AI-generated text replaces the old (it'll be different each time) |

---

## 4. Smart Alerts

| Test | Steps | Expected result |
|---|---|---|
| Create alert | Click "Create New Alert" → symbol `AAPL`, condition "above", target price `1` → Save | Appears under "Your Alerts", status shows **TRIGGERED** immediately (since $1 is below any real simulated price) |
| Realistic alert | Create another: `AAPL`, "above", target `10000` | Shows **ACTIVE** (price won't realistically reach that) |
| Delete | Click "Delete" on any alert | Disappears from the list |
| Simulated price note | Read the small text next to "Your Alerts" | Confirms prices are simulated, not real |

---

## 5. Learn — Finance Quiz

| Test | Steps | Expected result |
|---|---|---|
| Take quiz | Go to `learn.html`, answer all 7 questions | See a final score like "You scored 5 / 7!" |
| Best score | Reload the page | "Your best score: X / 7" shows at the top of the quiz card |
| Retry | Click "Try Again" | Quiz resets from question 1 |

---

## 6. Dashboard — Holdings (portfolio)

| Test | Steps | Expected result |
|---|---|---|
| Add holding | Click "Add Holding" → symbol `AAPL`, quantity `10`, avg cost `150` → Save | Appears in "Your Holdings" with market value and gain/loss calculated |
| Totals | Add a second holding | The summary total (top right) updates to reflect both |
| Remove | Click "Remove" on a holding | Disappears, totals update |

---

## 7. Watchlist

| Test | Steps | Expected result |
|---|---|---|
| Add from Explore | Go to Explore, click the "Watchlist" button near the top | Button changes to "Added ✓" |
| View on Dashboard | Go to Dashboard, check "Your Watchlist" card | The symbol you added appears with a simulated price/change |
| Remove | Hover the row on Dashboard, click the ✕ that appears | Removed from the list |

---

## 8. Explore — Search any symbol

| Test | Steps | Expected result |
|---|---|---|
| Search valid symbol | In the top search bar on Explore, type `TSLA` and press Enter | Price header updates to show a simulated TSLA quote |
| Search invalid | Type `12345` and press Enter | Alert popup: "Please enter a valid stock symbol..." |

---

## 9. Settings

| Test | Steps | Expected result |
|---|---|---|
| Update name | Go to Settings (via sidebar link) → change name → Save Changes | "Saved!" message; your name updates everywhere (e.g. account icon tooltip) |
| Change password | Enter current + new password → Update Password | "Password updated!" message |
| Wrong current password | Enter an incorrect current password | Error: "Current password is incorrect." |
| Re-login check | Log out, sign back in with your NEW password | Should work |
| Dark mode toggle | Click the dark mode switch | Toggle animates; setting persists on reload (saved in browser) |

---

## Known limitations (by design, not bugs)
- **Stock prices are simulated**, not real — there's no live market data feed connected. This affects Alerts, Watchlist, Holdings, and Explore search.
- **Chat/Narrative require Groq** — if these don't respond, double check `GROQ_API_KEY` in `server/.env` and your internet connection.
- **Database required** — if nothing loads and the server won't start, double check `DATABASE_URL` in `server/.env` points to a valid Supabase (or other Postgres) connection string.
