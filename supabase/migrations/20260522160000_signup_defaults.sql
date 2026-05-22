-- Free plan + 100 starter credits for every new user; 10 credits per AI chat request.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );

  insert into public.user_roles (user_id, role)
  values (new.id, 'user')
  on conflict do nothing;

  insert into public.subscriptions (user_id, plan_code, status, amount_inr)
  select new.id, 'free', 'active', 0
  where not exists (
    select 1 from public.subscriptions s where s.user_id = new.id
  );

  insert into public.credit_wallets (user_id, balance, daily_free_credits)
  values (new.id, 100, 0)
  on conflict (user_id) do nothing;

  insert into public.credit_ledger (user_id, delta, reason, metadata)
  values (new.id, 100, 'signup_bonus', jsonb_build_object('source', 'welcome'));

  return new;
end;
$$;
