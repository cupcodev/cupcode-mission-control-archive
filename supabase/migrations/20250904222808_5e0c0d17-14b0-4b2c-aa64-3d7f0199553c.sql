-- Create core schema with clients and services
create schema if not exists core;

create table if not exists core.clients (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  legal_name text,
  tax_id text,                                -- CNPJ/CPF (opcional)
  website text,
  status text not null default 'active' check (status in ('active','inactive')),
  metadata jsonb not null default '{}',
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists uq_core_clients_tax_id on core.clients(tax_id) where tax_id is not null;

create table if not exists core.contacts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references core.clients(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  job_title text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists uq_core_contacts_client_email on core.contacts(client_id, email) where email is not null;

create table if not exists core.client_users (
  client_id uuid not null references core.clients(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  role_in_client text not null default 'member' check (role_in_client in ('owner','member','viewer')),
  is_active boolean not null default true,
  added_at timestamptz not null default now(),
  primary key (client_id, user_id)
);

create table if not exists core.services_catalog (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,                   -- ex.: DEV_FE, DEV_BE, BRAND, TRAFFIC
  name text not null,
  description text,
  domain text,                                 -- alinhado ao que já usamos em templates
  is_active boolean not null default true,
  metadata jsonb not null default '{}',
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists core.client_services (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references core.clients(id) on delete cascade,
  service_id uuid not null references core.services_catalog(id),
  status text not null default 'active' check (status in ('active','paused','ended')),
  start_date date,
  end_date date,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  unique (client_id, service_id, status) where status = 'active'
);

-- função de updated_at
create or replace function core.set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

drop trigger if exists trg_core_clients_updated_at on core.clients;
create trigger trg_core_clients_updated_at before update on core.clients
for each row execute function core.set_updated_at();

drop trigger if exists trg_core_contacts_updated_at on core.contacts;
create trigger trg_core_contacts_updated_at before update on core.contacts
for each row execute function core.set_updated_at();

drop trigger if exists trg_core_services_updated_at on core.services_catalog;
create trigger trg_core_services_updated_at before update on core.services_catalog
for each row execute function core.set_updated_at();

-- RLS
alter table core.clients enable row level security;
alter table core.contacts enable row level security;
alter table core.client_users enable row level security;
alter table core.services_catalog enable row level security;
alter table core.client_services enable row level security;

-- RLS Policies
-- Clients: select por autenticados internos; select para usuários vinculados (client_users); escrita só admin+
create policy "clients_select_scoped"
  on core.clients for select to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('user','admin','superadmin'))
    or exists (select 1 from core.client_users cu where cu.client_id = clients.id and cu.user_id = auth.uid() and cu.is_active)
  );

create policy "clients_admin_write"
  on core.clients for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','superadmin')))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','superadmin')));

-- Contacts: leitura conforme cliente; escrita admin+
create policy "contacts_select_scoped"
  on core.contacts for select to authenticated
  using (
    exists (
      select 1 from core.clients c
      where c.id = contacts.client_id and (
        exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('user','admin','superadmin'))
        or exists (select 1 from core.client_users cu where cu.client_id = c.id and cu.user_id = auth.uid() and cu.is_active)
      )
    )
  );

create policy "contacts_admin_write"
  on core.contacts for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','superadmin')))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','superadmin')));

-- Client Users: seleção própria ou admin; escrita admin
create policy "client_users_select_self_or_admin"
  on core.client_users for select to authenticated
  using (user_id = auth.uid() or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','superadmin')));

create policy "client_users_admin_write"
  on core.client_users for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','superadmin')))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','superadmin')));

-- Services Catalog: leitura geral; escrita admin
create policy "services_catalog_select_auth"
  on core.services_catalog for select to authenticated using (true);

create policy "services_catalog_admin_write"
  on core.services_catalog for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','superadmin')))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','superadmin')));

-- Client Services: leitura conforme cliente; escrita admin
create policy "client_services_select_scoped"
  on core.client_services for select to authenticated
  using (
    exists (
      select 1 from core.clients c
      where c.id = client_services.client_id and (
        exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('user','admin','superadmin'))
        or exists (select 1 from core.client_users cu where cu.client_id = c.id and cu.user_id = auth.uid() and cu.is_active)
      )
    )
  );

create policy "client_services_admin_write"
  on core.client_services for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','superadmin')))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','superadmin')));

-- Índices úteis
create index if not exists idx_core_contacts_client on core.contacts(client_id);
create index if not exists idx_core_client_users_user on core.client_users(user_id);
create index if not exists idx_core_client_services_client on core.client_services(client_id);
create index if not exists idx_core_client_services_service on core.client_services(service_id);

-- Create MC schema if not exists and add NOT VALID foreign keys
create schema if not exists mc;

-- Create minimal mc.workflow_instances table if it doesn't exist (for FK references)
create table if not exists mc.workflow_instances (
  id uuid primary key default gen_random_uuid(),
  template_id uuid,
  template_version integer,
  status text,
  client_id uuid,
  service_id uuid,
  variables jsonb default '{}',
  created_by uuid,
  created_at timestamptz default now()
);

-- Add NOT VALID foreign keys to MC
alter table mc.workflow_instances
  add constraint fk_mc_wi_client not valid
  foreign key (client_id)
  references core.clients(id) on delete set null;

alter table mc.workflow_instances
  add constraint fk_mc_wi_service not valid
  foreign key (service_id)
  references core.services_catalog(id) on delete set null;

-- Create enriched view for MC
create or replace view mc.v_instances_enriched as
select
  wi.*,
  c.display_name as client_name,
  sc.name as service_name
from mc.workflow_instances wi
left join core.clients c on c.id = wi.client_id
left join core.services_catalog sc on sc.id = wi.service_id;

-- Insert seed data
insert into core.services_catalog (code, name, description, domain, created_by) values
('DEV_FE', 'Desenvolvimento Frontend', 'Desenvolvimento de interfaces e experiência do usuário', 'development', (select id from auth.users limit 1)),
('DEV_BE', 'Desenvolvimento Backend', 'Desenvolvimento de APIs e sistemas backend', 'development', (select id from auth.users limit 1)),
('BRAND', 'Branding', 'Criação e gestão de marca', 'marketing', (select id from auth.users limit 1)),
('TRAFFIC', 'Tráfego Pago', 'Gestão de campanhas de marketing digital', 'marketing', (select id from auth.users limit 1)),
('SUPPORT', 'Suporte', 'Suporte técnico e atendimento ao cliente', 'support', (select id from auth.users limit 1))
on conflict (code) do nothing;

-- Insert demo client
insert into core.clients (display_name, legal_name, status, created_by) values
('Cliente Demo', 'Cliente Demo Ltda', 'active', (select id from auth.users limit 1))
on conflict do nothing;

-- Insert demo contact
insert into core.contacts (client_id, name, email, job_title, is_primary)
select c.id, 'João Silva', 'joao@clientedemo.com', 'Gerente de TI', true
from core.clients c
where c.display_name = 'Cliente Demo'
on conflict do nothing;

-- Link demo client to services
insert into core.client_services (client_id, service_id, status)
select c.id, sc.id, 'active'
from core.clients c, core.services_catalog sc
where c.display_name = 'Cliente Demo' 
  and sc.code in ('DEV_FE', 'TRAFFIC')
on conflict do nothing;