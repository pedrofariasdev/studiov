create table if not exists private.instagram_oauth_attempts (
  id bigint generated always as identity primary key,
  user_id uuid null references public.profiles(id) on delete set null,
  workspace_id uuid null references public.workspaces(id) on delete set null,
  brand_id uuid null references public.brands(id) on delete set null,
  outcome text not null check (outcome in ('success','cancelled','error')),
  step text not null check (char_length(step) between 1 and 80),
  provider_code text null check (provider_code is null or char_length(provider_code) <= 160),
  created_at timestamptz not null default now()
);

alter table private.instagram_oauth_attempts enable row level security;
revoke all on table private.instagram_oauth_attempts from public, anon, authenticated;

create index if not exists instagram_oauth_attempts_created_at_idx
  on private.instagram_oauth_attempts (created_at desc);

create or replace function public.record_instagram_oauth_attempt(
  actor_user_id_value uuid,
  target_workspace_id uuid,
  target_brand_id uuid,
  outcome_value text,
  step_value text,
  provider_code_value text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if outcome_value not in ('success','cancelled','error') then
    raise exception 'Invalid OAuth outcome.';
  end if;

  insert into private.instagram_oauth_attempts (
    user_id,
    workspace_id,
    brand_id,
    outcome,
    step,
    provider_code
  ) values (
    actor_user_id_value,
    target_workspace_id,
    target_brand_id,
    outcome_value,
    left(coalesce(nullif(trim(step_value), ''), 'unknown'), 80),
    left(nullif(trim(provider_code_value), ''), 160)
  );
end;
$$;

revoke all on function public.record_instagram_oauth_attempt(uuid, uuid, uuid, text, text, text)
  from public, anon, authenticated;
grant execute on function public.record_instagram_oauth_attempt(uuid, uuid, uuid, text, text, text)
  to service_role;
