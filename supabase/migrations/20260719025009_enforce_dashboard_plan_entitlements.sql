-- Direitos de acesso da dashboard por plano.
-- O plano Básico mantém o fluxo principal: IA, conteúdos, calendário,
-- agendamento e publicações. Os módulos operacionais avançados começam no Pro.

update public.billing_plans
set features = features || jsonb_build_object(
    'content_management', true,
    'media_library', true,
    'calendar', true,
    'publishing', true,
    'social_scheduling', true,
    'content_planner', false,
    'client_management', false,
    'multi_brand_management', false,
    'analytics', false,
    'analytics_level', 'basic',
    'team_management', false,
    'approval_workflow', false,
    'priority_support', false,
    'ai_text_generation', true,
    'ai_image_generation', false
)
where code = 'free';

update public.billing_plans
set features = features || jsonb_build_object(
    'content_management', true,
    'media_library', true,
    'calendar', true,
    'publishing', true,
    'social_scheduling', true,
    'content_planner', true,
    'client_management', true,
    'multi_brand_management', true,
    'analytics', true,
    'analytics_level', 'full',
    'team_management', false,
    'approval_workflow', false,
    'priority_support', true,
    'ai_text_generation', true,
    'ai_image_generation', false
)
where code = 'pro';

update public.billing_plans
set features = features || jsonb_build_object(
    'content_management', true,
    'media_library', true,
    'calendar', true,
    'publishing', true,
    'social_scheduling', true,
    'content_planner', true,
    'client_management', true,
    'multi_brand_management', true,
    'analytics', true,
    'analytics_level', 'advanced',
    'team_management', true,
    'approval_workflow', true,
    'priority_support', true,
    'ai_text_generation', true,
    'ai_image_generation', false
)
where code = 'business';


create or replace function public.workspace_has_feature(
    workspace_id_value uuid,
    feature_key_value text
)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
    current_user_id uuid;
    is_demo_user boolean;
    feature_value jsonb;
begin
    current_user_id := (select auth.uid());

    if current_user_id is null
       or workspace_id_value is null
       or nullif(trim(feature_key_value), '') is null then
        return false;
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
        return false;
    end if;

    select coalesce(au.is_anonymous, false)
    into is_demo_user
    from auth.users au
    where au.id = current_user_id;

    if coalesce(is_demo_user, false) then
        return true;
    end if;

    select bp.features -> feature_key_value
    into feature_value
    from public.workspace_subscriptions ws
    join public.billing_plans bp on bp.id = ws.plan_id
    where ws.workspace_id = workspace_id_value
      and ws.is_current = true
      and bp.is_active = true
    order by ws.created_at desc
    limit 1;

    return coalesce(
        jsonb_typeof(feature_value) = 'boolean'
        and feature_value = 'true'::jsonb,
        false
    );
end;
$$;


create or replace function public.get_workspace_entitlements(
    workspace_id_value uuid default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
    current_user_id uuid;
    target_workspace_id uuid;
    workspace_name_value text;
    plan_code_value text;
    plan_name_value text;
    features_value jsonb;
    limits_value jsonb;
    is_demo_user boolean;
begin
    current_user_id := (select auth.uid());

    if current_user_id is null then
        raise exception 'Utilizador não autenticado.';
    end if;

    if workspace_id_value is null then
        select w.id
        into target_workspace_id
        from public.workspaces w
        where w.status = 'active'
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
        order by
            case when w.owner_id = current_user_id then 0 else 1 end,
            w.created_at
        limit 1;
    else
        target_workspace_id := workspace_id_value;
    end if;

    select w.name
    into workspace_name_value
    from public.workspaces w
    where w.id = target_workspace_id
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
      );

    if workspace_name_value is null then
        raise exception 'Workspace não encontrado ou sem acesso.';
    end if;

    select
        bp.code,
        bp.name,
        bp.features,
        bp.limits
    into
        plan_code_value,
        plan_name_value,
        features_value,
        limits_value
    from public.workspace_subscriptions ws
    join public.billing_plans bp on bp.id = ws.plan_id
    where ws.workspace_id = target_workspace_id
      and ws.is_current = true
      and bp.is_active = true
    order by ws.created_at desc
    limit 1;

    if plan_code_value is null then
        raise exception 'Plano ativo não encontrado para este workspace.';
    end if;

    select coalesce(au.is_anonymous, false)
    into is_demo_user
    from auth.users au
    where au.id = current_user_id;

    if coalesce(is_demo_user, false) then
        select bp.features, bp.limits
        into features_value, limits_value
        from public.billing_plans bp
        where bp.code = 'business'
          and bp.is_active = true
        limit 1;
    end if;

    return jsonb_build_object(
        'workspaceId', target_workspace_id,
        'workspaceName', workspace_name_value,
        'planCode', plan_code_value,
        'planName', plan_name_value,
        'features', coalesce(features_value, '{}'::jsonb),
        'limits', coalesce(limits_value, '{}'::jsonb),
        'isDemo', coalesce(is_demo_user, false)
    );
end;
$$;


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
begin
    required_feature := tg_argv[0];
    caller_role := coalesce((select auth.jwt() ->> 'role'), '');

    if caller_role = 'service_role'
       or session_user in ('postgres', 'supabase_admin') then
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


drop trigger if exists enforce_brands_plan_feature on public.brands;
create trigger enforce_brands_plan_feature
before insert or update or delete on public.brands
for each row execute function private.enforce_workspace_feature(
    'multi_brand_management'
);

drop trigger if exists enforce_clients_plan_feature on public.clients;
create trigger enforce_clients_plan_feature
before insert or update or delete on public.clients
for each row execute function private.enforce_workspace_feature(
    'client_management'
);

drop trigger if exists enforce_content_planner_plan_feature
on public.content_plan_items;
create trigger enforce_content_planner_plan_feature
before insert or update or delete on public.content_plan_items
for each row execute function private.enforce_workspace_feature(
    'content_planner'
);


drop policy if exists "Plan enables multiple brands" on public.brands;
create policy "Plan enables multiple brands"
on public.brands
as restrictive
for all
to authenticated
using (
    (select public.workspace_has_feature(
        workspace_id,
        'multi_brand_management'
    ))
)
with check (
    (select public.workspace_has_feature(
        workspace_id,
        'multi_brand_management'
    ))
);

drop policy if exists "Plan enables client management" on public.clients;
create policy "Plan enables client management"
on public.clients
as restrictive
for all
to authenticated
using (
    (select public.workspace_has_feature(
        workspace_id,
        'client_management'
    ))
)
with check (
    (select public.workspace_has_feature(
        workspace_id,
        'client_management'
    ))
);

drop policy if exists "Plan enables content planner"
on public.content_plan_items;
create policy "Plan enables content planner"
on public.content_plan_items
as restrictive
for all
to authenticated
using (
    (select public.workspace_has_feature(
        workspace_id,
        'content_planner'
    ))
)
with check (
    (select public.workspace_has_feature(
        workspace_id,
        'content_planner'
    ))
);


revoke all on function public.workspace_has_feature(uuid, text)
from public, anon;
grant execute on function public.workspace_has_feature(uuid, text)
to authenticated, service_role;

revoke all on function public.get_workspace_entitlements(uuid)
from public, anon;
grant execute on function public.get_workspace_entitlements(uuid)
to authenticated, service_role;

revoke all on function private.enforce_workspace_feature()
from public, anon, authenticated, service_role;
