-- Profiler koblet til Supabase auth
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'employee', -- 'admin' or 'employee'
  employee_id uuid references employees(id) on delete set null,
  created_at timestamptz default now()
);

alter table profiles enable row level security;

-- Brukere kan lese sin egen profil
create policy "Users can read own profile"
  on profiles for select
  using (auth.uid() = id);

-- Admins kan lese alle profiler
create policy "Admins can read all profiles"
  on profiles for select
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Admins kan oppdatere profiler
create policy "Admins can update profiles"
  on profiles for update
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Oppdater RLS på eksisterende tabeller

-- Employees: kun innloggede admins
drop policy if exists "Allow all" on employees;
create policy "Admins manage employees"
  on employees for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );
create policy "Employees can read employees"
  on employees for select
  using (auth.uid() is not null);

-- Business settings: kun admins
drop policy if exists "Allow all" on business_settings;
create policy "Admins manage settings"
  on business_settings for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );
create policy "Employees can read settings"
  on business_settings for select
  using (auth.uid() is not null);

-- Shifts: admins styrer, ansatte leser
drop policy if exists "Allow all" on shifts;
create policy "Admins manage shifts"
  on shifts for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );
create policy "Employees can read shifts"
  on shifts for select
  using (auth.uid() is not null);

-- Absences: ansatte kan registrere eget fravær, admins styrer alt
drop policy if exists "Allow all" on absences;
create policy "Admins manage absences"
  on absences for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );
create policy "Employees manage own absences"
  on absences for all
  using (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and employee_id = absences.employee_id
    )
  );
create policy "Employees read all absences"
  on absences for select
  using (auth.uid() is not null);

-- Funksjon som lager profil automatisk når bruker registreres
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'role', 'employee'));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
