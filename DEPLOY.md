# Deploy Engineering AI to Netlify + Supabase

## 1. Create your Supabase project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) → **New project**.
2. After it is ready, open **Project Settings → API** and copy:
   - **Project URL** → `VITE_SUPABASE_URL` and `SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_PUBLISHABLE_KEY` and `SUPABASE_PUBLISHABLE_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (server only; never expose in the browser)

3. Apply the database schema (from this repo):

   ```bash
   npx supabase login
   npx supabase link --project-ref YOUR_PROJECT_REF
   npx supabase db push
   ```

   Or run the SQL files under `supabase/migrations/` in the Supabase SQL editor, in filename order.

4. **Authentication → URL configuration** (required for login to work):

   | Field | Value |
   |--------|--------|
   | Site URL | `https://YOUR-SITE.netlify.app` (or your custom domain) |
   | Redirect URLs | `https://YOUR-SITE.netlify.app/**`, `http://localhost:8080/**` |

5. **Authentication → Providers**: enable **Email** (and Google/GitHub if you use those buttons).

6. For quick testing, you can turn off **Confirm email** under Email provider settings. Otherwise sign-up requires clicking the verification link before sign-in works.

## 2. Local environment

Copy the example file and paste your Supabase values:

```bash
cp .env.example .env
```

Edit `.env` with your project URL and keys, then:

```bash
npm install
npm run dev
```

Open `http://localhost:8080/login` and test email/password sign-in.

## 3. Deploy to Netlify

### Option A — Git (recommended)

1. Push this repo to GitHub/GitLab/Bitbucket.
2. [Netlify](https://app.netlify.com) → **Add new site** → **Import an existing project**.
3. Build settings are read from `netlify.toml` automatically:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist/client`
   - **Node:** 22
4. **Site configuration → Environment variables** — add every variable from `.env.example` (use your real Supabase values).
5. Deploy. After the first deploy, copy your live URL and add it to Supabase **Redirect URLs** (step 1.4).

### Option B — Netlify CLI

```bash
npm install -g netlify-cli
netlify login
netlify init
netlify env:import .env
netlify deploy --build
netlify deploy --prod --build
```

Use Netlify CLI **17.31+** when using `@netlify/vite-plugin-tanstack-start`.

## 4. Why login fails (checklist)

| Symptom | Fix |
|---------|-----|
| Blank error / “Missing Supabase environment variable” | Set `VITE_SUPABASE_*` in Netlify and **redeploy** (Vite bakes them in at build time). |
| “Invalid login credentials” | Wrong password, or user not created in **your** project (not the old Lovable default). |
| Sign-up works but sign-in does not | Confirm email in inbox, or disable email confirmation in Supabase. |
| Google/GitHub redirect fails | Add Netlify URL to Supabase redirect URLs; enable provider in Supabase + set OAuth client IDs. |
| Logged in but `/app` kicks you out | Run migrations; check `profiles` table and RLS policies. |
| Chat/API returns 401 | Set `SUPABASE_SERVICE_ROLE_KEY` on Netlify (server env, not `VITE_`). |

## 5. Admin dashboard access

There is no separate admin login. Any user with the `admin` role in `user_roles` can open:

`https://YOUR-SITE.netlify.app/app/admin`

To make yourself admin:

1. Sign in on the site → **Profile** → copy **Account ID** (must match the row you insert).
2. Supabase → **SQL Editor** → run `supabase/migrations/20260522170000_fix_admin_role_check.sql` (fixes role visibility).
3. Then run:

```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('YOUR-ACCOUNT-ID-FROM-PROFILE', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
```

4. Sign out and sign in again, then open `/app/admin`.

If admin still fails, confirm the UUID in `user_roles` exactly matches the signed-in user's Account ID on Profile.

## 6. Switching from the bundled Lovable Supabase

Replace all values in `.env` with **your** project’s URL and keys, update Supabase redirect URLs to your Netlify domain, run migrations, then redeploy Netlify so the new `VITE_*` values are embedded in the client bundle.
