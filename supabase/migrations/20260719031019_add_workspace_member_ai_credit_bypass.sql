alter table public.workspace_members
add column if not exists bypass_ai_credits boolean not null default false;

comment on column public.workspace_members.bypass_ai_credits is
'Allows an active workspace member to generate AI content without consuming plan quota or purchased credits. Provider API usage is still billed.';

alter table public.ai_generation_reservations
  drop constraint if exists ai_generation_reservations_source_check;

alter table public.ai_generation_reservations
  add constraint ai_generation_reservations_source_check
  check (source = any (array['plan'::text, 'credits'::text, 'bypass'::text]));

create or replace function public.get_ai_text_generation_quota(workspace_id_value uuid)
returns jsonb
language plpgsql
stable security definer
set search_path to ''
as $function$
declare
    current_user_id uuid;
    usage_month_value date;
    plan_code_value text;
    plan_name_value text;
    monthly_limit_value bigint;
    plan_used_value bigint;
    credit_balance_value bigint;
    bypass_credit_limit_value boolean;
begin
    current_user_id := (select auth.uid());

    if current_user_id is null then
        raise exception 'Utilizador não autenticado.';
    end if;

    if not exists (
        select 1
        from public.workspaces w
        where w.id = workspace_id_value
          and w.status = 'active'
          and (
              w.owner_id = current_user_id
              or exists (
                  select 1
                  from public.workspace_members wm
                  where wm.workspace_id = w.id
                    and wm.user_id = current_user_id
                    and wm.status = 'active'
              )
          )
    ) then
        raise exception 'Workspace não encontrado ou sem acesso.';
    end if;

    select coalesce(bool_or(wm.bypass_ai_credits), false)
    into bypass_credit_limit_value
    from public.workspace_members wm
    where wm.workspace_id = workspace_id_value
      and wm.user_id = current_user_id
      and wm.status = 'active';

    usage_month_value := date_trunc('month', current_date)::date;

    select
        bp.code,
        bp.name,
        greatest(
            coalesce((bp.limits ->> 'ai_text_generations_monthly')::bigint, 0),
            0
        )
    into
        plan_code_value,
        plan_name_value,
        monthly_limit_value
    from public.workspace_subscriptions ws
    join public.billing_plans bp on bp.id = ws.plan_id
    where ws.workspace_id = workspace_id_value
      and ws.is_current = true
      and bp.is_active = true
    order by ws.created_at desc
    limit 1;

    if plan_code_value is null then
        raise exception 'Plano ativo não encontrado para este workspace.';
    end if;

    select coalesce(wu.ai_text_generations, 0)
    into plan_used_value
    from public.workspace_usage_monthly wu
    where wu.workspace_id = workspace_id_value
      and wu.usage_month = usage_month_value;

    select coalesce(wacb.balance, 0)
    into credit_balance_value
    from public.workspace_ai_credit_balances wacb
    where wacb.workspace_id = workspace_id_value;

    plan_used_value := coalesce(plan_used_value, 0);
    credit_balance_value := coalesce(credit_balance_value, 0);

    return jsonb_build_object(
        'workspaceId', workspace_id_value,
        'planCode', plan_code_value,
        'planName', plan_name_value,
        'usageMonth', usage_month_value,
        'resetsAt', (usage_month_value + interval '1 month')::date,
        'planUsed', plan_used_value,
        'monthlyLimit', monthly_limit_value,
        'planRemaining', greatest(monthly_limit_value - plan_used_value, 0),
        'purchasedCredits', credit_balance_value,
        'totalAvailable', greatest(monthly_limit_value - plan_used_value, 0)
            + credit_balance_value,
        'bypassCreditLimit', bypass_credit_limit_value
    );
end;
$function$;

create or replace function public.reserve_ai_text_generation(workspace_id_value uuid, actor_user_id_value uuid)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
    usage_month_value date;
    plan_code_value text;
    plan_name_value text;
    monthly_limit_value bigint;
    plan_used_value bigint;
    credit_balance_value bigint;
    reservation_id_value uuid;
    reservation_source_value text;
    bypass_credit_limit_value boolean;
begin
    if workspace_id_value is null or actor_user_id_value is null then
        raise exception 'Workspace e utilizador são obrigatórios.';
    end if;

    if not exists (
        select 1
        from public.workspaces w
        where w.id = workspace_id_value
          and w.status = 'active'
          and (
              w.owner_id = actor_user_id_value
              or exists (
                  select 1
                  from public.workspace_members wm
                  where wm.workspace_id = w.id
                    and wm.user_id = actor_user_id_value
                    and wm.status = 'active'
              )
          )
    ) then
        raise exception 'Workspace não encontrado ou sem acesso.';
    end if;

    select coalesce(bool_or(wm.bypass_ai_credits), false)
    into bypass_credit_limit_value
    from public.workspace_members wm
    where wm.workspace_id = workspace_id_value
      and wm.user_id = actor_user_id_value
      and wm.status = 'active';

    usage_month_value := date_trunc('month', current_date)::date;

    select
        bp.code,
        bp.name,
        greatest(
            coalesce((bp.limits ->> 'ai_text_generations_monthly')::bigint, 0),
            0
        )
    into
        plan_code_value,
        plan_name_value,
        monthly_limit_value
    from public.workspace_subscriptions ws
    join public.billing_plans bp on bp.id = ws.plan_id
    where ws.workspace_id = workspace_id_value
      and ws.is_current = true
      and bp.is_active = true
    order by ws.created_at desc
    limit 1;

    if plan_code_value is null then
        raise exception 'Plano ativo não encontrado para este workspace.';
    end if;

    insert into public.workspace_usage_monthly (
        workspace_id,
        usage_month,
        ai_text_generations
    )
    values (
        workspace_id_value,
        usage_month_value,
        0
    )
    on conflict (workspace_id, usage_month) do nothing;

    select coalesce(wu.ai_text_generations, 0)
    into plan_used_value
    from public.workspace_usage_monthly wu
    where wu.workspace_id = workspace_id_value
      and wu.usage_month = usage_month_value;

    select coalesce(wacb.balance, 0)
    into credit_balance_value
    from public.workspace_ai_credit_balances wacb
    where wacb.workspace_id = workspace_id_value;

    plan_used_value := coalesce(plan_used_value, 0);
    credit_balance_value := coalesce(credit_balance_value, 0);

    if bypass_credit_limit_value then
        insert into public.ai_generation_reservations (
            workspace_id,
            user_id,
            source,
            usage_month,
            metadata
        )
        values (
            workspace_id_value,
            actor_user_id_value,
            'bypass',
            usage_month_value,
            jsonb_build_object('bypassCreditLimit', true)
        )
        returning id into reservation_id_value;

        return jsonb_build_object(
            'allowed', true,
            'reservationId', reservation_id_value,
            'source', 'bypass',
            'quota', jsonb_build_object(
                'planCode', plan_code_value,
                'planName', plan_name_value,
                'usageMonth', usage_month_value,
                'resetsAt', (usage_month_value + interval '1 month')::date,
                'planUsed', plan_used_value,
                'monthlyLimit', monthly_limit_value,
                'planRemaining', greatest(monthly_limit_value - plan_used_value, 0),
                'purchasedCredits', credit_balance_value,
                'totalAvailable', greatest(monthly_limit_value - plan_used_value, 0)
                    + credit_balance_value,
                'bypassCreditLimit', true
            )
        );
    end if;

    update public.workspace_usage_monthly
    set ai_text_generations = ai_text_generations + 1
    where workspace_id = workspace_id_value
      and usage_month = usage_month_value
      and ai_text_generations < monthly_limit_value
    returning ai_text_generations
    into plan_used_value;

    if plan_used_value is not null then
        reservation_source_value := 'plan';
    else
        update public.workspace_ai_credit_balances
        set balance = balance - 1
        where workspace_id = workspace_id_value
          and balance > 0
        returning balance
        into credit_balance_value;

        if credit_balance_value is not null then
            reservation_source_value := 'credits';
        end if;
    end if;

    select coalesce(wu.ai_text_generations, 0)
    into plan_used_value
    from public.workspace_usage_monthly wu
    where wu.workspace_id = workspace_id_value
      and wu.usage_month = usage_month_value;

    select coalesce(wacb.balance, 0)
    into credit_balance_value
    from public.workspace_ai_credit_balances wacb
    where wacb.workspace_id = workspace_id_value;

    plan_used_value := coalesce(plan_used_value, 0);
    credit_balance_value := coalesce(credit_balance_value, 0);

    if reservation_source_value is null then
        return jsonb_build_object(
            'allowed', false,
            'message', 'O limite mensal foi atingido e não existem créditos extra disponíveis.',
            'quota', jsonb_build_object(
                'planCode', plan_code_value,
                'planName', plan_name_value,
                'usageMonth', usage_month_value,
                'resetsAt', (usage_month_value + interval '1 month')::date,
                'planUsed', plan_used_value,
                'monthlyLimit', monthly_limit_value,
                'planRemaining', greatest(monthly_limit_value - plan_used_value, 0),
                'purchasedCredits', credit_balance_value,
                'totalAvailable', greatest(monthly_limit_value - plan_used_value, 0)
                    + credit_balance_value,
                'bypassCreditLimit', false
            )
        );
    end if;

    insert into public.ai_generation_reservations (
        workspace_id,
        user_id,
        source,
        usage_month
    )
    values (
        workspace_id_value,
        actor_user_id_value,
        reservation_source_value,
        usage_month_value
    )
    returning id into reservation_id_value;

    if reservation_source_value = 'credits' then
        insert into public.workspace_ai_credit_ledger (
            workspace_id,
            reservation_id,
            amount,
            reason,
            metadata
        )
        values (
            workspace_id_value,
            reservation_id_value,
            -1,
            'generation',
            jsonb_build_object('userId', actor_user_id_value)
        );
    end if;

    return jsonb_build_object(
        'allowed', true,
        'reservationId', reservation_id_value,
        'source', reservation_source_value,
        'quota', jsonb_build_object(
            'planCode', plan_code_value,
            'planName', plan_name_value,
            'usageMonth', usage_month_value,
            'resetsAt', (usage_month_value + interval '1 month')::date,
            'planUsed', plan_used_value,
            'monthlyLimit', monthly_limit_value,
            'planRemaining', greatest(monthly_limit_value - plan_used_value, 0),
            'purchasedCredits', credit_balance_value,
            'totalAvailable', greatest(monthly_limit_value - plan_used_value, 0)
                + credit_balance_value,
            'bypassCreditLimit', false
        )
    );
end;
$function$;

create or replace function public.finalize_ai_text_generation(reservation_id_value uuid, success_value boolean)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
    reservation_record public.ai_generation_reservations%rowtype;
begin
    select *
    into reservation_record
    from public.ai_generation_reservations agr
    where agr.id = reservation_id_value
    for update;

    if reservation_record.id is null then
        raise exception 'Reserva de geração não encontrada.';
    end if;

    if reservation_record.status <> 'reserved' then
        return jsonb_build_object(
            'reservationId', reservation_record.id,
            'status', reservation_record.status
        );
    end if;

    if success_value then
        update public.ai_generation_reservations
        set
            status = 'committed',
            finalized_at = now()
        where id = reservation_record.id;

        return jsonb_build_object(
            'reservationId', reservation_record.id,
            'status', 'committed'
        );
    end if;

    if reservation_record.source = 'plan' then
        update public.workspace_usage_monthly
        set ai_text_generations = greatest(ai_text_generations - 1, 0)
        where workspace_id = reservation_record.workspace_id
          and usage_month = reservation_record.usage_month;
    elsif reservation_record.source = 'credits' then
        insert into public.workspace_ai_credit_balances (
            workspace_id,
            balance
        )
        values (
            reservation_record.workspace_id,
            1
        )
        on conflict (workspace_id) do update
        set balance = public.workspace_ai_credit_balances.balance + 1;

        insert into public.workspace_ai_credit_ledger (
            workspace_id,
            reservation_id,
            amount,
            reason
        )
        values (
            reservation_record.workspace_id,
            reservation_record.id,
            1,
            'generation_refund'
        );
    end if;

    update public.ai_generation_reservations
    set
        status = 'released',
        finalized_at = now()
    where id = reservation_record.id;

    return jsonb_build_object(
        'reservationId', reservation_record.id,
        'status', 'released'
    );
end;
$function$;
