-- Enable pgvector extension
create extension if not exists vector;

-- Courses/Branches table
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  display_name text not null,
  description text,
  color text,
  icon text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_courses_name on public.courses(name);

-- Subjects table
create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  name text not null,
  display_name text not null,
  description text,
  semester integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(course_id, name)
);

create index idx_subjects_course on public.subjects(course_id);
create index idx_subjects_name on public.subjects(name);

-- Uploaded files table
create table if not exists public.uploaded_files (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null,
  file_name text not null,
  file_type text not null, -- 'pdf', 'textbook', 'syllabus', 'notes', 'research_paper', 'manual'
  file_path text not null, -- Storage path
  file_size integer,
  title text not null,
  description text,
  semester integer,
  tags text[], -- array of tags
  status text not null default 'pending', -- 'pending', 'processing', 'completed', 'failed'
  error_message text,
  uploaded_by uuid not null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create index idx_uploaded_files_course on public.uploaded_files(course_id);
create index idx_uploaded_files_subject on public.uploaded_files(subject_id);
create index idx_uploaded_files_status on public.uploaded_files(status);
create index idx_uploaded_files_uploaded_by on public.uploaded_files(uploaded_by);

-- Knowledge chunks table
create table if not exists public.knowledge_chunks (
  id uuid primary key default gen_random_uuid(),
  uploaded_file_id uuid not null references public.uploaded_files(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null,
  chunk_index integer not null, -- Order of chunk
  content text not null,
  content_type text, -- 'text', 'equation', 'code', 'diagram'
  page_number integer,
  start_position integer, -- Character position in original
  end_position integer,
  metadata jsonb, -- Additional metadata
  created_at timestamptz not null default now()
);

create index idx_chunks_file on public.knowledge_chunks(uploaded_file_id);
create index idx_chunks_course on public.knowledge_chunks(course_id);
create index idx_chunks_subject on public.knowledge_chunks(subject_id);

-- Embeddings table (pgvector)
create table if not exists public.embeddings (
  id uuid primary key default gen_random_uuid(),
  chunk_id uuid not null references public.knowledge_chunks(id) on delete cascade,
  uploaded_file_id uuid not null references public.uploaded_files(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null,
  embedding vector(768), -- Google Generative AI embeddings are 768-dimensional
  model_name text not null default 'embedding-001',
  created_at timestamptz not null default now()
);

-- Vector similarity search index (using HNSW)
create index idx_embeddings_vector on public.embeddings using hnsw (embedding vector_cosine_ops);
create index idx_embeddings_chunk on public.embeddings(chunk_id);
create index idx_embeddings_course_subject on public.embeddings(course_id, subject_id);

-- Function for vector similarity search
create or replace function search_similar_chunks(
  query_embedding vector(768),
  search_course_id uuid,
  search_subject_id uuid default null,
  limit_results integer default 10,
  similarity_threshold float default 0.7
) returns table (
  id uuid,
  content text,
  file_name text,
  course_name text,
  subject_name text,
  similarity float,
  metadata jsonb
) as $$
begin
  return query
  select
    e.chunk_id,
    kc.content,
    uf.file_name,
    c.name,
    s.name,
    (1 - (e.embedding <=> query_embedding))::float as similarity,
    kc.metadata
  from embeddings e
  join knowledge_chunks kc on e.chunk_id = kc.id
  join uploaded_files uf on e.uploaded_file_id = uf.id
  join courses c on e.course_id = c.id
  left join subjects s on e.subject_id = s.id
  where e.course_id = search_course_id
    and (search_subject_id is null or e.subject_id = search_subject_id)
    and (1 - (e.embedding <=> query_embedding)) >= similarity_threshold
  order by similarity desc
  limit limit_results;
end;
$$ language plpgsql;

-- Ingestion queue for background processing
create table if not exists public.ingestion_queue (
  id uuid primary key default gen_random_uuid(),
  uploaded_file_id uuid not null references public.uploaded_files(id) on delete cascade,
  task_type text not null, -- 'extract_text', 'chunk', 'embed'
  status text not null default 'pending', -- 'pending', 'processing', 'completed', 'failed'
  priority integer default 0,
  attempt_count integer default 0,
  max_attempts integer default 3,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz
);

create index idx_queue_status on public.ingestion_queue(status);
create index idx_queue_file on public.ingestion_queue(uploaded_file_id);
create index idx_queue_priority on public.ingestion_queue(status, priority, created_at);

-- AI usage tracking
create table if not exists public.ai_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  request_type text not null, -- 'chat', 'embedding', 'search'
  tokens_used integer,
  api_provider text default 'gemini',
  model_used text default 'gemini-1.5-flash',
  course_id uuid references public.courses(id) on delete set null,
  subject_id uuid references public.subjects(id) on delete set null,
  success boolean default true,
  error_message text,
  duration_ms integer,
  created_at timestamptz not null default now()
);

create index idx_usage_user on public.ai_usage(user_id);
create index idx_usage_user_created on public.ai_usage(user_id, created_at);
create index idx_usage_request_type on public.ai_usage(request_type);

-- Prompt usage tracking
create table if not exists public.prompt_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  prompts_used integer not null default 1,
  prompts_remaining integer not null,
  reason text, -- 'chat', 'reward_ad', 'admin_grant'
  created_at timestamptz not null default now()
);

create index idx_prompt_usage_user on public.prompt_usage(user_id);
create index idx_prompt_usage_created on public.prompt_usage(user_id, created_at);

-- Rewarded ads tracking
create table if not exists public.rewarded_ads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ad_network text not null, -- 'admob', 'unity', 'iron_source'
  reward_prompts integer not null default 1,
  reward_given_at timestamptz,
  created_at timestamptz not null default now(),
  unique(user_id, created_at::date)
);

create index idx_ads_user on public.rewarded_ads(user_id);
create index idx_ads_user_date on public.rewarded_ads(user_id, created_at::date);

-- Enable RLS on all new tables
alter table public.courses enable row level security;
alter table public.subjects enable row level security;
alter table public.uploaded_files enable row level security;
alter table public.knowledge_chunks enable row level security;
alter table public.embeddings enable row level security;
alter table public.ingestion_queue enable row level security;
alter table public.ai_usage enable row level security;
alter table public.prompt_usage enable row level security;
alter table public.rewarded_ads enable row level security;

-- RLS Policies
-- Courses: public read
create policy "Courses public read" on public.courses for select using (true);
create policy "Courses admin write" on public.courses for insert, update, delete
  using (auth.uid() in (select user_id from user_roles where role = 'admin'));

-- Subjects: public read
create policy "Subjects public read" on public.subjects for select using (true);
create policy "Subjects admin write" on public.subjects for insert, update, delete
  using (auth.uid() in (select user_id from user_roles where role = 'admin'));

-- Uploaded files: public read, owner/admin write
create policy "Files public read" on public.uploaded_files for select using (true);
create policy "Files owner insert" on public.uploaded_files for insert
  with check (auth.uid() = uploaded_by or auth.uid() in (select user_id from user_roles where role = 'admin'));
create policy "Files owner update" on public.uploaded_files for update
  using (auth.uid() = uploaded_by or auth.uid() in (select user_id from user_roles where role = 'admin'));

-- Knowledge chunks: public read
create policy "Chunks public read" on public.knowledge_chunks for select using (true);

-- Embeddings: public read (for RAG)
create policy "Embeddings public read" on public.embeddings for select using (true);

-- Ingestion queue: admin only
create policy "Queue admin only" on public.ingestion_queue for all
  using (auth.uid() in (select user_id from user_roles where role = 'admin'));

-- AI usage: user can read own, admin can read all
create policy "Usage user read own" on public.ai_usage for select
  using (auth.uid() = user_id or auth.uid() in (select user_id from user_roles where role = 'admin'));
create policy "Usage insert" on public.ai_usage for insert
  with check (auth.uid() = user_id);

-- Prompt usage: user can read own
create policy "Prompt usage user read" on public.prompt_usage for select
  using (auth.uid() = user_id);
create policy "Prompt usage insert" on public.prompt_usage for insert
  with check (auth.uid() = user_id);

-- Rewarded ads: user can read own
create policy "Ads user read" on public.rewarded_ads for select
  using (auth.uid() = user_id);
create policy "Ads insert" on public.rewarded_ads for insert
  with check (auth.uid() = user_id);
