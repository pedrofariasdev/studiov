create or replace function public.create_demo_workspace_base()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
begin
  return auth.uid();
end;
$$;

grant execute on function public.create_demo_workspace_base() to authenticated;
