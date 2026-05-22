create table if not exists public.course_knowledge_base (
  id uuid primary key default gen_random_uuid(),
  branch_name text not null,
  subject_name text not null default 'General',
  content_type text not null default 'details',
  title text not null,
  content text not null,
  source_url text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_course_kb_branch_subject
  on public.course_knowledge_base(branch_name, subject_name);

alter table public.course_knowledge_base enable row level security;

create policy "Course KB public read"
  on public.course_knowledge_base
  for select
  using (true);
