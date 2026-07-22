create or replace function public.complete_stripe_webhook_event(
  event_id_value text
)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.stripe_webhook_events
  set
    status = 'processed',
    processed_at = now(),
    last_error = null,
    updated_at = now()
  where event_id = event_id_value;
$$;

create or replace function public.fail_stripe_webhook_event(
  event_id_value text,
  error_value text
)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.stripe_webhook_events
  set
    status = 'failed',
    last_error = left(coalesce(error_value, 'Erro desconhecido.'), 2000),
    updated_at = now()
  where event_id = event_id_value;
$$;

revoke all on function public.complete_stripe_webhook_event(text) from public;
revoke all on function public.complete_stripe_webhook_event(text) from anon;
revoke all on function public.complete_stripe_webhook_event(text) from authenticated;

revoke all on function public.fail_stripe_webhook_event(text, text) from public;
revoke all on function public.fail_stripe_webhook_event(text, text) from anon;
revoke all on function public.fail_stripe_webhook_event(text, text) from authenticated;
