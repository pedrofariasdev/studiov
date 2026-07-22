create or replace function public.create_demo_workspace()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
begin
  return null;
end;
$$;

grant execute on function public.create_demo_workspace() to authenticated;
