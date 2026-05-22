# Google AdSense — Engineering AI (approved setup)

Code is wired. You only need your **Publisher ID** and **ad slot IDs** from AdSense, then Netlify env vars + redeploy.

---

## What I need from you (reply with these 3 values)

From [AdSense](https://adsense.google.com/) → **Ads** → **By ad unit**:

| # | What | Example | Your value |
|---|------|---------|------------|
| 1 | **Publisher ID** | `ca-pub-1234567890123456` | ? |
| 2 | **Sidebar ad slot** (display, responsive) | `1234567890` | ? |
| 3 | **Reward modal ad slot** (display or rectangle, ~300×250) | `9876543210` | ? |

Create **two** display ad units if you only have one today:

1. Name: `Sidebar` → use for sidebar  
2. Name: `Reward credits modal` → use in the “Free credits” popup  

---

## Step 1 — Netlify environment variables

**Site configuration → Environment variables → Add:**

| Variable | Value |
|----------|--------|
| `VITE_ADSENSE_CLIENT` | Your `ca-pub-...` (same for all units) |
| `VITE_ADSENSE_SLOT_SIDEBAR` | Sidebar slot number |
| `VITE_ADSENSE_SLOT_REWARD` | Reward modal slot number |
| `VITE_REWARDED_AD_CREDITS` | `100` (credits per watch) |
| `VITE_REWARDED_AD_WATCH_SECONDS` | `30` (seconds before Claim unlocks) |
| `REWARDED_AD_CREDITS` | `100` (server — must match) |
| `REWARDED_AD_MAX_DAILY` | `5` (optional, claims per day) |
| `REWARDED_AD_COOLDOWN_SECONDS` | `60` (optional, wait between claims) |

Then **Deploys → Trigger deploy → Clear cache and deploy site**.

---

## Step 2 — AdSense site settings

1. **Sites** → `engineerai.netlify.app` → status **Ready**
2. **Privacy & messaging** (EU): configure consent if you have EU traffic (AdSense CMP or similar)
3. **Ads** → avoid **Auto ads** everywhere if you only want sidebar + reward modal (less annoying)

---

## Step 3 — Legal pages (already in app)

- https://engineerai.netlify.app/privacy  
- https://engineerai.netlify.app/terms  

Linked in the footer. Add your contact email in `src/routes/privacy.tsx` if you want.

---

## Step 4 — Verify after deploy

1. Open site in **incognito** (logged in).
2. **Sidebar** (expanded): ad or Google placeholder should appear (not dashed “configure Netlify”).
3. Chat → **Free +100 credits** → centered popup with ad + 30s timer → **Claim** adds credits.

---

## How rewarded credits work

- User opens modal → ad loads → **30s timer** (configurable).
- **Claim** is disabled until timer finishes (we cannot detect true video end on standard AdSense display units).
- User taps **Claim** → server adds **100 credits** (configurable).
- Modal closes. Daily limit / cooldown via `REWARDED_AD_*` server env.

**Policy:** Users are not asked to click ads — only to keep the modal open for the timer.

---

## Step 5 — Monitor revenue

AdSense → **Reports** → by site, ad unit, RPM.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Dashed “configure Netlify” box | Env vars missing or deploy without cache clear |
| Blank ad area | New units can take **30–60 min** to fill; check AdSense “Ready” |
| Claim gives 5 not 100 | Set `REWARDED_AD_CREDITS=100` on Netlify (server) and redeploy |
| adsbygoogle.js blocked | Ad blocker off for testing |

---

## Optional: custom domain

If you add `www.yourdomain.com`, add it in AdSense **Sites** and update Supabase redirect URLs.
