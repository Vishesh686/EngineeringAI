alter table public.credit_wallets
  add column if not exists last_reward_grant_at timestamptz,
  add column if not exists reward_claims_today integer not null default 0;
