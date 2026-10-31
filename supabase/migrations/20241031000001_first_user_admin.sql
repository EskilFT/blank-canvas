-- Oppdater handle_new_user slik at første bruker alltid blir admin
create or replace function handle_new_user()
returns trigger as $$
declare
  user_count integer;
  user_role text;
begin
  -- Tell eksisterende brukere
  select count(*) into user_count from profiles;

  -- Første bruker = admin, resten = employee (med mindre satt i metadata)
  if user_count = 0 then
    user_role := 'admin';
  else
    user_role := coalesce(new.raw_user_meta_data->>'role', 'employee');
  end if;

  insert into profiles (id, role)
  values (new.id, user_role)
  on conflict (id) do nothing;

  return new;
end;
$$ language plpgsql security definer;
