create table if not exists private.instagram_oauth_states (
    state_hash text primary key,
    user_id uuid not null
        references public.profiles(id)
        on delete cascade,
    workspace_id uuid not null
        references public.workspaces(id)
        on delete cascade,
    brand_id uuid not null
        references public.brands(id)
        on delete cascade,
    return_url text not null,
    expires_at timestamp with time zone not null,
    created_at timestamp with time zone not null
        default now(),
    constraint instagram_oauth_states_hash_check
        check (state_hash ~ '^[0-9a-f]{64}$'),
    constraint instagram_oauth_states_return_url_length_check
        check (char_length(return_url) between 1 and 500),
    constraint instagram_oauth_states_expiry_check
        check (expires_at > created_at)
);

alter table private.instagram_oauth_states
    enable row level security;

revoke all on table private.instagram_oauth_states
    from public, anon, authenticated;

create index if not exists instagram_oauth_states_expires_at_idx
    on private.instagram_oauth_states (expires_at);

create or replace function public.create_instagram_oauth_state(
    state_hash_value text,
    actor_user_id_value uuid,
    target_workspace_id uuid,
    target_brand_id uuid,
    return_url_value text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
    normalized_hash text := lower(trim(state_hash_value));
    normalized_return_url text := trim(return_url_value);
begin
    if normalized_hash !~ '^[0-9a-f]{64}$' then
        raise exception 'Estado OAuth inválido.';
    end if;

    if not (
        normalized_return_url in (
            'https://studiov.pt/html/dashboard/settings.html',
            'https://www.studiov.pt/html/dashboard/settings.html'
        )
        or normalized_return_url ~
            '^http://(localhost|127[.]0[.]0[.]1)(:[0-9]{1,5})?/html/dashboard/settings[.]html$'
    ) then
        raise exception 'URL de retorno OAuth inválida.';
    end if;

    if not exists (
        select 1
        from public.workspace_members wm
        where wm.workspace_id = target_workspace_id
          and wm.user_id = actor_user_id_value
          and wm.status = 'active'
          and wm.role in ('owner', 'admin')
    ) then
        raise exception 'O utilizador não possui permissão para conectar contas.';
    end if;

    if not exists (
        select 1
        from public.brands b
        where b.id = target_brand_id
          and b.workspace_id = target_workspace_id
          and b.status = 'active'
    ) then
        raise exception 'Marca ativa não encontrada neste workspace.';
    end if;

    delete from private.instagram_oauth_states
    where expires_at <= now();

    insert into private.instagram_oauth_states (
        state_hash,
        user_id,
        workspace_id,
        brand_id,
        return_url,
        expires_at
    )
    values (
        normalized_hash,
        actor_user_id_value,
        target_workspace_id,
        target_brand_id,
        normalized_return_url,
        now() + interval '10 minutes'
    );
end;
$$;

revoke all on function public.create_instagram_oauth_state(
    text,
    uuid,
    uuid,
    uuid,
    text
) from public, anon, authenticated;

grant execute on function public.create_instagram_oauth_state(
    text,
    uuid,
    uuid,
    uuid,
    text
) to service_role;

create or replace function public.consume_instagram_oauth_state(
    state_hash_value text
)
returns table (
    actor_user_id uuid,
    workspace_id uuid,
    brand_id uuid,
    return_url text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
    normalized_hash text := lower(trim(state_hash_value));
begin
    if normalized_hash !~ '^[0-9a-f]{64}$' then
        return;
    end if;

    delete from private.instagram_oauth_states
    where expires_at <= now();

    return query
    delete from private.instagram_oauth_states oauth_state
    where oauth_state.state_hash = normalized_hash
      and oauth_state.expires_at > now()
    returning
        oauth_state.user_id,
        oauth_state.workspace_id,
        oauth_state.brand_id,
        oauth_state.return_url;
end;
$$;

revoke all on function public.consume_instagram_oauth_state(text)
    from public, anon, authenticated;

grant execute on function public.consume_instagram_oauth_state(text)
    to service_role;

alter table public.social_accounts
    drop constraint if exists social_accounts_status_check;

alter table public.social_accounts
    add constraint social_accounts_status_check
    check (
        status = any (
            array[
                'pending'::text,
                'active'::text,
                'connected'::text,
                'expired'::text,
                'revoked'::text,
                'error'::text,
                'disconnected'::text
            ]
        )
    );

create or replace function public.connect_instagram_account(
    target_workspace_id uuid,
    target_brand_id uuid,
    actor_user_id uuid,
    external_account_id_value text,
    account_name_value text,
    access_token_value text,
    username_value text default null,
    account_type_value text default null,
    profile_url_value text default null,
    avatar_url_value text default null,
    scopes_value text[] default array[]::text[],
    expires_at_value timestamp with time zone default null,
    public_metadata_value jsonb default '{}'::jsonb
)
returns public.social_accounts
language plpgsql
security definer
set search_path = ''
as $$
declare
    account_record public.social_accounts;
begin
    select public.connect_social_account(
        target_workspace_id,
        target_brand_id,
        actor_user_id,
        'instagram',
        external_account_id_value,
        account_name_value,
        access_token_value,
        null,
        username_value,
        account_type_value,
        profile_url_value,
        avatar_url_value,
        'Bearer',
        scopes_value,
        expires_at_value,
        public_metadata_value
    )
    into account_record;

    update public.social_accounts
    set
        status = 'connected',
        connected_at = coalesce(connected_at, now()),
        last_error_code = null,
        last_error_at = null
    where id = account_record.id
    returning *
    into account_record;

    return account_record;
end;
$$;

revoke all on function public.connect_instagram_account(
    uuid,
    uuid,
    uuid,
    text,
    text,
    text,
    text,
    text,
    text,
    text,
    text[],
    timestamp with time zone,
    jsonb
) from public, anon, authenticated;

grant execute on function public.connect_instagram_account(
    uuid,
    uuid,
    uuid,
    text,
    text,
    text,
    text,
    text,
    text,
    text,
    text[],
    timestamp with time zone,
    jsonb
) to service_role;

create or replace function public.set_social_account_health(
    target_social_account_id uuid,
    status_value text,
    error_code_value text default null,
    synced_at_value timestamp with time zone default null
)
returns public.social_accounts
language plpgsql
security definer
set search_path = ''
as $$
declare
    account_record public.social_accounts;
    normalized_status text;
begin
    normalized_status := lower(trim(status_value));

    if normalized_status not in (
        'active',
        'connected',
        'expired',
        'revoked',
        'error'
    ) then
        raise exception 'Estado de sincronização inválido.';
    end if;

    update public.social_accounts
    set
        status = normalized_status,
        last_synced_at = case
            when normalized_status in ('active', 'connected')
                then coalesce(synced_at_value, now())
            else last_synced_at
        end,
        last_error_code = case
            when normalized_status in ('active', 'connected')
                then null
            else nullif(trim(error_code_value), '')
        end,
        last_error_at = case
            when normalized_status in ('active', 'connected')
                then null
            else now()
        end
    where id = target_social_account_id
    returning *
    into account_record;

    if account_record.id is null then
        raise exception 'Conta social não encontrada.';
    end if;

    return account_record;
end;
$$;

do $$
declare
    has_plaintext_tokens boolean;
begin
    if exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'social_accounts'
          and column_name = 'access_token'
    ) then
        execute
            'select exists (
                select 1
                from public.social_accounts
                where access_token is not null
            )'
        into has_plaintext_tokens;

        if has_plaintext_tokens then
            raise exception
                'Não é possível remover social_accounts.access_token enquanto existirem tokens em texto simples.';
        end if;

        execute 'alter table public.social_accounts drop column access_token';
    end if;
end;
$$;
