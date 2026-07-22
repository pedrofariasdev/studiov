create or replace function public.sync_workspace_plan_from_subscription()
returns trigger
language plpgsql
security definer
set search_path = ''
as $billing_sync$
declare
    plan_code_value text;
begin
    if new.is_current is not true then
        return new;
    end if;

    select bp.code
      into plan_code_value
      from public.billing_plans bp
     where bp.id = new.plan_id;

    if plan_code_value is null then
        raise exception 'Plano da assinatura não encontrado.';
    end if;

    update public.workspaces
       set plan = plan_code_value,
           updated_at = now()
     where id = new.workspace_id
       and plan is distinct from plan_code_value;

    return new;
end;
$billing_sync$;

revoke all on function public.sync_workspace_plan_from_subscription() from public, anon, authenticated;
grant execute on function public.sync_workspace_plan_from_subscription() to postgres, service_role;

drop trigger if exists sync_workspace_plan_from_subscription_trigger
on public.workspace_subscriptions;

create trigger sync_workspace_plan_from_subscription_trigger
after insert or update of plan_id, is_current
on public.workspace_subscriptions
for each row
execute function public.sync_workspace_plan_from_subscription();

update public.workspace_subscriptions ws
   set plan_id = bp_business.id,
       updated_at = now(),
       metadata = coalesce(ws.metadata, '{}'::jsonb)
           || jsonb_build_object(
               'source', 'billing_v1_consistency_backfill',
               'corrected_at', now()
           )
  from public.workspaces w,
       public.billing_plans bp_current,
       public.billing_plans bp_business
 where ws.workspace_id = w.id
   and ws.plan_id = bp_current.id
   and bp_business.code = 'business'
   and bp_business.is_active = true
   and bp_current.code <> w.plan
   and w.plan = 'business'
   and ws.is_current = true
   and ws.provider = 'manual'
   and w.name = 'StudioV Demo';
