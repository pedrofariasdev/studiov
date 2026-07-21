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
    select *
    into account_record
    from public.connect_social_account(
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
    );

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
