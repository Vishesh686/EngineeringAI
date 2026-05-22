-- Fix: authenticated users could not read user_roles because RLS called has_role()
-- after EXECUTE was revoked on that function.

drop policy if exists "Users view own roles" on public.user_roles;

create policy "Users view own roles"
  on public.user_roles
  for select
  using (auth.uid() = user_id);

-- Reliable admin check for the app (bypasses RLS safely).
create or replace function public.current_user_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role = 'admin'::public.app_role
  );
$$;

revoke all on function public.current_user_is_admin() from public;
grant execute on function public.current_user_is_admin() to authenticated;
