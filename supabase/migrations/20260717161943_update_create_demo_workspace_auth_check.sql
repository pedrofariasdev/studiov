create or replace function public.create_demo_workspace()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Usuário não autenticado';
  end if;

  return v_user_id;
end;
$$;

grant execute on function public.create_demo_workspace() to authenticated;
