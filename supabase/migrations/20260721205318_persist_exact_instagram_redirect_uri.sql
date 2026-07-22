alter table private.instagram_oauth_states
  add column if not exists redirect_uri text;

drop function if exists public.create_instagram_oauth_state(text, uuid, uuid, uuid, text);

create function public.create_instagram_oauth_state(
  state_hash_value text,
  actor_user_id_value uuid,
  target_workspace_id uuid,
  target_brand_id uuid,
  return_url_value text,
  redirect_uri_value text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_hash text := lower(trim(state_hash_value));
  normalized_return_url text := trim(return_url_value);
  normalized_redirect_uri text := trim(redirect_uri_value);
begin
  if normalized_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'Estado OAuth inválido.';
  end if;

  if not (
    normalized_return_url in (
      'https://studiov.pt/html/dashboard/settings.html',
      'https://www.studiov.pt/html/dashboard/settings.html'
    )
    or normalized_return_url ~ '^http://(localhost|127[.]0[.]0[.]1)(:[0-9]{1,5})?/html/dashboard/settings[.]html$'
  ) then
    raise exception 'URL de retorno OAuth inválida.';
  end if;

  if normalized_redirect_uri !~ '^https://[a-z0-9]+[.]supabase[.]co/functions/v1/instagram-oauth-callback$' then
    raise exception 'Redirect URI do Instagram inválido.';
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
    redirect_uri,
    expires_at
  ) values (
    normalized_hash,
    actor_user_id_value,
    target_workspace_id,
    target_brand_id,
    normalized_return_url,
    normalized_redirect_uri,
    now() + interval '10 minutes'
  );
end;
$$;

drop function if exists public.consume_instagram_oauth_state(text);

create function public.consume_instagram_oauth_state(state_hash_value text)
returns table(
  actor_user_id uuid,
  workspace_id uuid,
  brand_id uuid,
  return_url text,
  redirect_uri text
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
    oauth_state.return_url,
    oauth_state.redirect_uri;
end;
$$;

revoke all on function public.create_instagram_oauth_state(text, uuid, uuid, uuid, text, text) from public, anon, authenticated;
grant execute on function public.create_instagram_oauth_state(text, uuid, uuid, uuid, text, text) to service_role;
revoke all on function public.consume_instagram_oauth_state(text) from public, anon, authenticated;
grant execute on function public.consume_instagram_oauth_state(text) to service_role;
