create table if not exists public.stripe_webhook_events (
  event_id text primary key,
  event_type text not null,
  status text not null default 'processing' check (status in ('processing', 'processed', 'failed')),
  attempts integer not null default 1 check (attempts > 0),
  payload jsonb not null default '{}'::jsonb,
  last_error text,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.stripe_webhook_events enable row level security;

create index if not exists stripe_webhook_events_status_idx
  on public.stripe_webhook_events (status, updated_at desc);

comment on table public.stripe_webhook_events is
  'Registo idempotente dos eventos recebidos da Stripe. Acesso reservado ao backend.';
