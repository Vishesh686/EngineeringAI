# AI setup (cheap OpenAI or Lovable gateway)

The chat API (`/api/chat`) uses **OpenAI first** if `OPENAI_API_KEY` is set, otherwise **Lovable AI gateway** if `LOVABLE_API_KEY` is set.

**Cost:** Each user message costs **10 credits** (wallet balance).

---

## Option A — OpenAI (recommended, low cost)

### 1. Create an OpenAI account

1. Go to [platform.openai.com](https://platform.openai.com/)
2. Sign up and add a payment method (**Billing** → add credits, e.g. $5–10 to start).

### 2. Create an API key

1. [API keys](https://platform.openai.com/api-keys) → **Create new secret key**
2. Copy the key (starts with `sk-...`). You will not see it again.

### 3. Pick a cheap model

Default in this app: **`gpt-4o-mini`** (~$0.15 / 1M input tokens).

Optional env:

```env
OPENAI_MODEL=gpt-4o-mini
```

Other budget options: `gpt-4.1-nano` (when available on your account).

### 4. Add to Netlify (server-side only)

**Do not** use `VITE_` prefix (keeps key off the browser).

| Variable | Value |
|----------|--------|
| `OPENAI_API_KEY` | `sk-...` |
| `OPENAI_MODEL` | `gpt-4o-mini` (optional) |

Also add the same in local `.env` for `npm run dev`.

### 5. Redeploy

Netlify → **Trigger deploy** → **Clear cache and deploy**.

### 6. Test

1. Sign in → Chat
2. Send a message
3. If it fails, check **Netlify Functions/logs** for the deploy

---

## Option B — Lovable AI gateway (if you already have a key)

```env
LOVABLE_API_KEY=your_key
LOVABLE_AI_MODEL=google/gemini-3-flash-preview
```

Set in Netlify env (no `VITE_` prefix). Redeploy.

---

## Credits & free plan (database)

New signups (after migration `20260522160000_signup_defaults.sql`):

- Plan: **free**
- Wallet: **100 credits**
- Each chat message: **10 credits**

### Run migration in Supabase

SQL Editor → run `supabase/migrations/20260522160000_signup_defaults.sql`

### Give existing users 100 credits (one-time)

```sql
insert into public.credit_wallets (user_id, balance, daily_free_credits)
select id, 100, 0 from auth.users
on conflict (user_id) do update set balance = greatest(public.credit_wallets.balance, 100);

insert into public.subscriptions (user_id, plan_code, status, amount_inr)
select id, 'free', 'active', 0 from auth.users u
where not exists (select 1 from public.subscriptions s where s.user_id = u.id);
```

---

## Cost estimate (OpenAI gpt-4o-mini)

Roughly **$0.001–0.01 per long engineering answer**.  
100 credits = 10 messages → about **$0.01–0.10** per user if they use all signup credits.

Set **usage limits** in OpenAI dashboard → **Limits** to cap monthly spend.

---

## Alternatives (other cheap providers)

To add Gemini or Anthropic later, extend `src/lib/ai-provider.ts` with another branch and env vars. Same pattern: server-only keys on Netlify.
