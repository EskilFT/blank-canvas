-- Ansatte
create table if not exists employees (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  position text not null,
  hours_per_week numeric not null default 37.5,
  employment_type text not null default 'full_time', -- full_time, part_time, hourly
  phone text,
  color text default '#6366f1',
  created_at timestamptz default now()
);

-- Bedriftens arbeidstider
create table if not exists business_settings (
  id uuid primary key default gen_random_uuid(),
  business_name text not null default 'Min Bedrift',
  open_time time not null default '08:00',
  close_time time not null default '17:00',
  open_days integer[] not null default '{1,2,3,4,5}', -- 0=Sun, 1=Mon ... 6=Sat
  min_employees_per_shift integer not null default 1,
  created_at timestamptz default now()
);

-- Sett inn standardinnstillinger
insert into business_settings (business_name) values ('Min Bedrift')
  on conflict do nothing;

-- Fravær
create table if not exists absences (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid references employees(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  reason text,
  created_at timestamptz default now()
);

-- Vakter
create table if not exists shifts (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid references employees(id) on delete cascade,
  date date not null,
  start_time time not null,
  end_time time not null,
  position text,
  notes text,
  created_at timestamptz default now()
);

-- RLS (Row Level Security) - åpen for nå uten auth
alter table employees enable row level security;
alter table business_settings enable row level security;
alter table absences enable row level security;
alter table shifts enable row level security;

create policy "Allow all" on employees for all using (true) with check (true);
create policy "Allow all" on business_settings for all using (true) with check (true);
create policy "Allow all" on absences for all using (true) with check (true);
create policy "Allow all" on shifts for all using (true) with check (true);
