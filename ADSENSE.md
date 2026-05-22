# Google AdSense on Engineering AI (step by step)

Your app already has a sidebar ad slot (`AdSlot` in `AppSidebar`). Follow these steps to turn it into real revenue without annoying users.

## Part 1 — Get approved (1–4 weeks)

1. **Finish the live site**
   - Deploy on Netlify: `https://engineerai.netlify.app`
   - Add real pages: home, login, privacy policy, terms (AdSense requires these).

2. **Create a Privacy Policy page** (required)
   - Add a route `/privacy` with text explaining cookies, ads, and data.
   - Link it in the site footer.

3. **Sign up for AdSense**
   - Go to [google.com/adsense](https://www.google.com/adsense/)
   - Use the same Google account you want for payouts.
   - Site URL: `https://engineerai.netlify.app`
   - Country, payment details, tax info.

4. **Add the AdSense verification code**
   - AdSense gives you a script or meta tag.
   - Add to Netlify env (optional) or paste in `src/routes/__root.tsx` inside `<head>` while verifying.

5. **Wait for approval**
   - Google reviews content, traffic, and policy compliance.
   - Status: AdSense dashboard → **Sites**.

## Part 2 — Create ad units (after approval)

1. AdSense → **Ads** → **By ad unit** → **Display ads**.
2. Create a unit named e.g. `Sidebar responsive`.
3. Copy:
   - **Publisher ID** → `ca-pub-XXXXXXXX`
   - **Ad slot ID** → numeric id for the unit

## Part 3 — Connect to Netlify

In **Site configuration → Environment variables**:

| Variable | Example |
|----------|---------|
| `VITE_ADSENSE_CLIENT` | `ca-pub-1234567890` |
| `VITE_ADSENSE_SLOT_SIDEBAR` | `1234567890` |

Redeploy with **Clear cache and deploy**.

## Part 4 — Load the AdSense script

In `src/routes/__root.tsx`, inside `RootShell` `<head>` after approval:

```html
<script
  async
  src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXX"
  crossorigin="anonymous"
></script>
```

Replace `ca-pub-XXXX` with your publisher id.

## Placement strategy (earn without annoying)

| Placement | Why |
|-----------|-----|
| Sidebar only (already built) | Users expect nav area ads; chat stays clean |
| Avoid popups / full-screen | Hurts retention and violates good UX |
| Max 1–2 units per page | AdSense policy + better RPM on focused pages |

Do **not** put ads inside the chat message stream.

## Part 5 — Monitor

- AdSense → **Reports** → RPM, CTR, revenue
- If fill rate is low, try **Auto ads** in AdSense settings (optional)

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Blank ad box | Approval pending or env vars missing |
| "Ad serving disabled" | Policy violation — read AdSense email |
| No revenue | Need real traffic; avoid clicking your own ads |
