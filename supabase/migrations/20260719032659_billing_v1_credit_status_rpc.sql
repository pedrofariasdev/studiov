create or replace function public.get_workspace_ai_credit_status(workspace_id_value uuid)
returns table(
    extra_credit_balance bigint,
    bypass_ai_credits boolean
)
language plpgsql
security definer
set search_path = ''
as $credit_status$
declare
    caller_role text;
begin
    caller_role := coalesce(auth.jwt()->>'role', '');

    if caller_role <> 'service_role'
       and session_user not in ('postgres', 'supabase_admin') then
        if not public.can_view_billing(workspace_id_value) then
            raise exception 'O utilizador não possui acesso aos créditos deste workspace.';
        end if;
    end if;

    return query
    select
        coalesce(acb.balance, 0)::bigint,
        coalesce((
            select wm.bypass_ai_credits
              from public.workspace_members wm
             where wm.workspace_id = workspace_id_value
               and wm.user_id = auth.uid()
               and wm.status = 'active'
             limit 1
        ), false)
    from (select workspace_id_value as workspace_id) target
    left join public.workspace_ai_credit_balances acb
      on acb.workspace_id = target.workspace_id;
end;
$credit_status$;

revoke all on function public.get_workspace_ai_credit_status(uuid) from public, anon;
grant execute on function public.get_workspace_ai_credit_status(uuid) to authenticated, service_role;
