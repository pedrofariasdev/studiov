create or replace function public.get_workspace_billing_summary(workspace_id_value uuid)
returns table(
    workspace_id uuid,
    subscription_id uuid,
    plan_code text,
    plan_name text,
    subscription_status text,
    billing_interval text,
    current_period_start timestamptz,
    current_period_end timestamptz,
    cancel_at_period_end boolean,
    monthly_price_cents bigint,
    yearly_price_cents bigint,
    plan_limits jsonb,
    plan_features jsonb,
    usage_month date,
    ai_text_generations bigint,
    ai_image_generations bigint,
    published_posts bigint,
    storage_bytes bigint
)
language plpgsql
security definer
set search_path = ''
as $billing_summary$
declare
    caller_role text;
begin
    caller_role := coalesce(auth.jwt()->>'role', '');

    if caller_role <> 'service_role'
       and session_user not in ('postgres', 'supabase_admin') then
        if not public.can_view_billing(workspace_id_value) then
            raise exception 'O utilizador não possui acesso à faturação deste workspace.';
        end if;
    end if;

    return query
    select
        ws.workspace_id,
        ws.id,
        bp.code,
        bp.name,
        ws.status,
        ws.billing_interval,
        ws.current_period_start,
        ws.current_period_end,
        ws.cancel_at_period_end,
        bp.monthly_price_cents,
        bp.yearly_price_cents,
        bp.limits,
        bp.features,
        coalesce(wu.usage_month, date_trunc('month', current_date)::date),
        coalesce(wu.ai_text_generations, 0),
        coalesce(wu.ai_image_generations, 0),
        coalesce(wu.published_posts, 0),
        coalesce((
            select sum(ma.file_size)::bigint
              from public.media_assets ma
             where ma.workspace_id = ws.workspace_id
               and ma.storage_object_id is not null
               and ma.status <> 'failed'
        ), 0)
    from public.workspace_subscriptions ws
    join public.billing_plans bp
      on bp.id = ws.plan_id
    left join public.workspace_usage_monthly wu
      on wu.workspace_id = ws.workspace_id
     and wu.usage_month = date_trunc('month', current_date)::date
    where ws.workspace_id = workspace_id_value
      and ws.is_current = true;
end;
$billing_summary$;

revoke all on function public.get_workspace_billing_summary(uuid) from public, anon;
grant execute on function public.get_workspace_billing_summary(uuid) to authenticated, service_role;
