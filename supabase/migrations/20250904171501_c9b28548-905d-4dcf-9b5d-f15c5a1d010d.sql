-- Papéis e membros
create table if not exists mc.roles (
  name text primary key,                       -- ex.: 'Designer', 'FrontEnd', 'BackEnd', 'QA', 'PO', 'CS', 'Aprovador'
  description text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists mc.role_members (
  role_name text not null references mc.roles(name) on delete cascade,
  user_id uuid not null references auth.users(id),
  order_index int not null default 0,          -- define a ordem do round-robin
  is_active boolean not null default true,
  added_at timestamptz not null default now(),
  primary key (role_name, user_id)
);

create table if not exists mc.assignment_rules (
  role_name text primary key references mc.roles(name) on delete cascade,
  strategy text not null default 'round_robin' check (strategy in ('round_robin','manual')),
  last_assigned_user_id uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

-- RLS
alter table mc.roles enable row level security;
alter table mc.role_members enable row level security;
alter table mc.assignment_rules enable row level security;

-- Leitura: qualquer autenticado
create policy "roles_select_all_auth" on mc.roles for select to authenticated using (true);
create policy "role_members_select_all_auth" on mc.role_members for select to authenticated using (true);
create policy "assignment_rules_select_all_auth" on mc.assignment_rules for select to authenticated using (true);

-- Escrita: somente admin/superadmin
create policy "roles_admin_write"
  on mc.roles for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','superadmin')))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','superadmin')));

create policy "role_members_admin_write"
  on mc.role_members for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','superadmin')))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','superadmin')));

create policy "assignment_rules_admin_write"
  on mc.assignment_rules for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','superadmin')))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','superadmin')));