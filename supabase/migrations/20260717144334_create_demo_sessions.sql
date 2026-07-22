create table if not exists public.demo_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete cascade,
  status text not null default 'active',
  started_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours'),
  completed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint demo_sessions_status_check
    check (status in ('active', 'expired', 'completed'))
);

create index if not exists demo_sessions_user_id_idx
  on public.demo_sessions(user_id);

create index if not exists demo_sessions_workspace_id_idx
  on public.demo_sessions(workspace_id)
  where workspace_id is not null;

create index if not exists demo_sessions_status_expires_idx
  on public.demo_sessions(status, expires_at);

alter table public.demo_sessions enable row level security;

create policy "Users can view own demo sessions"
  on public.demo_sessions
  for select
  using (auth.uid() = user_id);

create policy "Users can create own demo sessions"
  on public.demo_sessions
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update own demo sessions"
  on public.demo_sessions
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
