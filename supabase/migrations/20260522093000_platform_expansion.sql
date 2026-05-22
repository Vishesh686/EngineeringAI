create extension if not exists vector;

create table if not exists public.branches (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  code text,
  created_at timestamptz not null default now()
);

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  created_at timestamptz not null default now(),
  unique(name, category)
);

create table if not exists public.branch_subjects (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  difficulty_level text default 'intermediate',
  ai_routing_rule text,
  created_at timestamptz not null default now(),
  unique(branch_id, subject_id)
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_code text not null default 'free',
  status text not null default 'active',
  provider text not null default 'razorpay',
  provider_subscription_id text,
  provider_customer_id text,
  amount_inr integer not null default 0,
  currency text not null default 'INR',
  start_at timestamptz,
  end_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.credit_wallets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance integer not null default 0,
  daily_free_credits integer not null default 20,
  last_daily_grant_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.credit_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  delta integer not null,
  reason text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  title text not null,
  body text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.rag_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  uploaded_file_id uuid references public.uploaded_files(id) on delete set null,
  title text not null,
  mime_type text,
  chunk_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.rag_documents(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  chunk_index integer not null,
  content text not null,
  token_estimate integer,
  embedding vector(1536),
  created_at timestamptz not null default now(),
  unique(document_id, chunk_index)
);

create index if not exists idx_subscriptions_user on public.subscriptions(user_id);
create index if not exists idx_credit_ledger_user_created on public.credit_ledger(user_id, created_at desc);
create index if not exists idx_notifications_user_created on public.notifications(user_id, created_at desc);
create index if not exists idx_document_chunks_user on public.document_chunks(user_id);
create index if not exists idx_document_chunks_embedding on public.document_chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100);

alter table public.branches enable row level security;
alter table public.subjects enable row level security;
alter table public.branch_subjects enable row level security;
alter table public.subscriptions enable row level security;
alter table public.credit_wallets enable row level security;
alter table public.credit_ledger enable row level security;
alter table public.notifications enable row level security;
alter table public.rag_documents enable row level security;
alter table public.document_chunks enable row level security;

create policy "Public read branches" on public.branches for select using (true);
create policy "Public read subjects" on public.subjects for select using (true);
create policy "Public read branch subjects" on public.branch_subjects for select using (true);

create policy "Subscriptions own" on public.subscriptions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Wallet own read" on public.credit_wallets for select using (auth.uid() = user_id);
create policy "Ledger own read" on public.credit_ledger for select using (auth.uid() = user_id);
create policy "Notifications own" on public.notifications for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "RAG docs own" on public.rag_documents for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "RAG chunks own" on public.document_chunks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.consume_ai_credit(cost integer default 1)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  new_balance integer;
begin
  if uid is null then
    raise exception 'unauthorized';
  end if;

  insert into public.credit_wallets(user_id, balance, last_daily_grant_at)
  values(uid, 20, now())
  on conflict (user_id) do nothing;

  update public.credit_wallets
  set balance = balance + daily_free_credits,
      last_daily_grant_at = now(),
      updated_at = now()
  where user_id = uid
    and (last_daily_grant_at is null or last_daily_grant_at::date < now()::date);

  update public.credit_wallets
  set balance = balance - cost,
      updated_at = now()
  where user_id = uid and balance >= cost
  returning balance into new_balance;

  if new_balance is null then
    raise exception 'insufficient_credits';
  end if;

  insert into public.credit_ledger(user_id, delta, reason, metadata)
  values(uid, -cost, 'ai_request', jsonb_build_object('cost', cost));

  return new_balance;
end;
$$;

create or replace function public.add_credits(target_user_id uuid, amount integer, reason text, meta jsonb default '{}'::jsonb)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_balance integer;
begin
  insert into public.credit_wallets(user_id, balance, updated_at)
  values(target_user_id, amount, now())
  on conflict (user_id)
  do update set balance = public.credit_wallets.balance + excluded.balance,
                updated_at = now()
  returning balance into new_balance;

  insert into public.credit_ledger(user_id, delta, reason, metadata)
  values(target_user_id, amount, reason, meta);

  return new_balance;
end;
$$;

create or replace function public.match_document_chunks(
  query_embedding vector(1536),
  match_count integer default 5,
  filter_user_id uuid default null
)
returns table (
  chunk_id uuid,
  document_id uuid,
  content text,
  similarity float
)
language sql
stable
as $$
  select
    c.id as chunk_id,
    c.document_id,
    c.content,
    1 - (c.embedding <=> query_embedding) as similarity
  from public.document_chunks c
  where c.embedding is not null
    and (filter_user_id is null or c.user_id = filter_user_id)
  order by c.embedding <=> query_embedding
  limit greatest(match_count, 1);
$$;

create or replace function public.admin_daily_usage(days_back integer default 30)
returns table(day date, users bigint, chats bigint, messages bigint, revenue_inr bigint)
language sql
stable
as $$
  with days as (
    select generate_series((now()::date - (days_back || ' days')::interval)::date, now()::date, '1 day'::interval)::date as d
  )
  select
    d.d as day,
    coalesce((select count(*) from public.profiles p where p.created_at::date = d.d), 0) as users,
    coalesce((select count(*) from public.chats c where c.created_at::date = d.d), 0) as chats,
    coalesce((select count(*) from public.messages m where m.created_at::date = d.d), 0) as messages,
    coalesce((select sum(case when cl.delta > 0 then cl.delta else 0 end) from public.credit_ledger cl where cl.created_at::date = d.d), 0) as revenue_inr
  from days d
  order by d.d;
$$;
