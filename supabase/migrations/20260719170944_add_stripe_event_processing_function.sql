create or replace function public.begin_stripe_webhook_event(
  event_id_value text,
  event_type_value text,
  payload_value jsonb
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_status text;
begin
  insert into public.stripe_webhook_events (
    event_id,
    event_type,
    status,
    attempts,
    payload,
    created_at,
    updated_at
  )
  values (
    event_id_value,
    event_type_value,
    'processing',
    1,
    coalesce(payload_value, '{}'::jsonb),
    now(),
    now()
  )
  on conflict (event_id) do nothing;

  if found then
    return 'started';
  end if;

  select status
    into current_status
  from public.stripe_webhook_events
  where event_id = event_id_value;

  if current_status = 'processed' then
    return 'processed';
  end if;

  if current_status = 'processing' then
    return 'processing';
  end if;

  update public.stripe_webhook_events
  set
    status = 'processing',
    attempts = attempts + 1,
    payload = coalesce(payload_value, payload),
    last_error = null,
    updated_at = now()
  where event_id = event_id_value;

  return 'started';
end;
$$;

revoke all on function public.begin_stripe_webhook_event(text, text, jsonb) from public;
revoke all on function public.begin_stripe_webhook_event(text, text, jsonb) from anon;
revoke all on function public.begin_stripe_webhook_event(text, text, jsonb) from authenticated;
