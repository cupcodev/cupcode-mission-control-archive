-- Insert seed data for services catalog
insert into core.services_catalog (code, name, description, domain, created_by) 
select 'DEV_FE', 'Desenvolvimento Frontend', 'Desenvolvimento de interfaces e experiência do usuário', 'development', id 
from auth.users limit 1
on conflict (code) do nothing;

insert into core.services_catalog (code, name, description, domain, created_by) 
select 'DEV_BE', 'Desenvolvimento Backend', 'Desenvolvimento de APIs e sistemas backend', 'development', id 
from auth.users limit 1
on conflict (code) do nothing;

insert into core.services_catalog (code, name, description, domain, created_by) 
select 'BRAND', 'Branding', 'Criação e gestão de marca', 'marketing', id 
from auth.users limit 1
on conflict (code) do nothing;

insert into core.services_catalog (code, name, description, domain, created_by) 
select 'TRAFFIC', 'Tráfego Pago', 'Gestão de campanhas de marketing digital', 'marketing', id 
from auth.users limit 1
on conflict (code) do nothing;

insert into core.services_catalog (code, name, description, domain, created_by) 
select 'SUPPORT', 'Suporte', 'Suporte técnico e atendimento ao cliente', 'support', id 
from auth.users limit 1
on conflict (code) do nothing;

-- Insert demo client
insert into core.clients (display_name, legal_name, status, created_by) 
select 'Cliente Demo', 'Cliente Demo Ltda', 'active', id 
from auth.users limit 1
where not exists (select 1 from core.clients where display_name = 'Cliente Demo');

-- Insert demo contact for the demo client
insert into core.contacts (client_id, name, email, job_title, is_primary)
select c.id, 'João Silva', 'joao@clientedemo.com', 'Gerente de TI', true
from core.clients c
where c.display_name = 'Cliente Demo'
and not exists (select 1 from core.contacts where email = 'joao@clientedemo.com');

-- Link demo client to services DEV_FE and TRAFFIC
insert into core.client_services (client_id, service_id, status)
select c.id, sc.id, 'active'
from core.clients c, core.services_catalog sc
where c.display_name = 'Cliente Demo' 
  and sc.code in ('DEV_FE', 'TRAFFIC')
  and not exists (
    select 1 from core.client_services cs 
    where cs.client_id = c.id and cs.service_id = sc.id and cs.status = 'active'
  );