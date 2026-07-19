-- Endurece as operações SECURITY DEFINER dos módulos limitados por plano.
-- Utilizadores anónimos do Supabase usam o papel authenticated, por isso
-- remover o papel anon não interfere com as contas de demonstração.

create or replace function private.enforce_workspace_feature()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
    target_workspace_id uuid;
    required_feature text;
    caller_role text;
    caller_user_id uuid;
begin
    required_feature := tg_argv[0];
    caller_role := coalesce((select auth.jwt() ->> 'role'), '');
    caller_user_id := (select auth.uid());

    if caller_role = 'service_role'
       or (
           caller_user_id is null
           and session_user in ('postgres', 'supabase_admin')
       ) then
        if tg_op = 'DELETE' then
            return old;
        end if;

        return new;
    end if;

    if tg_op = 'DELETE' then
        target_workspace_id := old.workspace_id;
    else
        target_workspace_id := new.workspace_id;
    end if;

    if not public.workspace_has_feature(
        target_workspace_id,
        required_feature
    ) then
        raise exception using
            errcode = 'P0001',
            message = 'PLAN_FEATURE_REQUIRED:' || required_feature;
    end if;

    if tg_op = 'DELETE' then
        return old;
    end if;

    return new;
end;
$$;


create or replace function public.get_brand_analytics_summary(
    brand_id_value uuid,
    start_date_value date,
    end_date_value date
)
returns table(
    brand_id uuid,
    start_date date,
    end_date date,
    account_impressions bigint,
    account_reach bigint,
    profile_views bigint,
    website_clicks bigint,
    content_impressions bigint,
    content_reach bigint,
    content_engagements bigint,
    content_clicks bigint,
    followers_start bigint,
    followers_end bigint,
    follower_growth bigint,
    average_engagement_rate numeric
)
language plpgsql
security definer
set search_path = ''
as $$
declare
    target_workspace_id uuid;
    caller_role text;
    caller_user_id uuid;
begin
    if start_date_value is null or end_date_value is null then
        raise exception 'As datas inicial e final são obrigatórias.';
    end if;

    if end_date_value < start_date_value then
        raise exception 'A data final não pode ser anterior à data inicial.';
    end if;

    select b.workspace_id
    into target_workspace_id
    from public.brands b
    where b.id = brand_id_value;

    if target_workspace_id is null then
        raise exception 'Marca não encontrada.';
    end if;

    caller_role := coalesce((select auth.jwt() ->> 'role'), '');
    caller_user_id := (select auth.uid());

    if caller_role <> 'service_role'
       and not (
           caller_user_id is null
           and session_user in ('postgres', 'supabase_admin')
       ) then
        if caller_user_id is null then
            raise exception 'Utilizador não autenticado.';
        end if;

        if not public.workspace_has_feature(
            target_workspace_id,
            'analytics'
        ) then
            raise exception using
                errcode = 'P0001',
                message = 'PLAN_FEATURE_REQUIRED:analytics';
        end if;
    end if;

    return query
    with account_totals as (
        select
            coalesce(sum(am.impressions), 0)::bigint as impressions,
            coalesce(sum(am.reach), 0)::bigint as reach,
            coalesce(sum(am.profile_views), 0)::bigint as profile_views,
            coalesce(sum(am.website_clicks), 0)::bigint as website_clicks
        from public.account_metrics am
        where am.brand_id = brand_id_value
          and am.metric_date between start_date_value and end_date_value
    ),
    content_totals as (
        select
            coalesce(sum(cm.impressions), 0)::bigint as impressions,
            coalesce(sum(cm.reach), 0)::bigint as reach,
            coalesce(sum(cm.engagements), 0)::bigint as engagements,
            coalesce(sum(cm.clicks), 0)::bigint as clicks
        from public.content_metrics cm
        where cm.brand_id = brand_id_value
          and cm.metric_date between start_date_value and end_date_value
    ),
    follower_bounds as (
        select
            coalesce((
                select am.followers
                from public.account_metrics am
                where am.brand_id = brand_id_value
                  and am.metric_date between start_date_value and end_date_value
                order by am.metric_date asc, am.created_at asc
                limit 1
            ), 0)::bigint as first_value,
            coalesce((
                select am.followers
                from public.account_metrics am
                where am.brand_id = brand_id_value
                  and am.metric_date between start_date_value and end_date_value
                order by am.metric_date desc, am.created_at desc
                limit 1
            ), 0)::bigint as last_value
    )
    select
        brand_id_value,
        start_date_value,
        end_date_value,
        at.impressions,
        at.reach,
        at.profile_views,
        at.website_clicks,
        ct.impressions,
        ct.reach,
        ct.engagements,
        ct.clicks,
        fb.first_value,
        fb.last_value,
        (fb.last_value - fb.first_value)::bigint,
        case
            when ct.reach = 0 then 0::numeric
            else round(
                (ct.engagements::numeric * 100) / ct.reach,
                4
            )
        end
    from account_totals at
    cross join content_totals ct
    cross join follower_bounds fb;
end;
$$;


do $$
declare
    target_function regprocedure;
begin
    for target_function in
        select p.oid::regprocedure
        from pg_proc p
        join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public'
          and p.proname in (
              'archive_brand',
              'archive_client',
              'archive_content_plan_item',
              'assign_brand_to_client',
              'assign_content_plan_item',
              'create_brand',
              'create_client',
              'create_content_from_plan_item',
              'create_content_plan_item',
              'get_brand_analytics_summary',
              'move_content_plan_item',
              'remove_brand_from_client',
              'restore_brand',
              'restore_client',
              'restore_content_plan_item',
              'update_brand',
              'update_client',
              'update_content_plan_item'
          )
    loop
        execute format(
            'revoke all on function %s from public, anon',
            target_function
        );

        execute format(
            'grant execute on function %s to authenticated, service_role',
            target_function
        );
    end loop;
end;
$$;


revoke all on function private.enforce_workspace_feature()
from public, anon, authenticated, service_role;
