-- Insert seed data for services catalog
do $$
declare
  admin_user_id uuid;
begin
  -- Get first user to use as creator
  select id into admin_user_id from auth.users limit 1;
  
  if admin_user_id is not null then
    -- Insert services
    insert into core.services_catalog (code, name, description, domain, created_by) values
    ('DEV_FE', 'Desenvolvimento Frontend', 'Desenvolvimento de interfaces e experiência do usuário', 'development', admin_user_id),
    ('DEV_BE', 'Desenvolvimento Backend', 'Desenvolvimento de APIs e sistemas backend', 'development', admin_user_id),
    ('BRAND', 'Branding', 'Criação e gestão de marca', 'marketing', admin_user_id),
    ('TRAFFIC', 'Tráfego Pago', 'Gestão de campanhas de marketing digital', 'marketing', admin_user_id),
    ('SUPPORT', 'Suporte', 'Suporte técnico e atendimento ao cliente', 'support', admin_user_id)
    on conflict (code) do nothing;

    -- Insert demo client only if it doesn't exist
    if not exists (select 1 from core.clients where display_name = 'Cliente Demo') then
      insert into core.clients (display_name, legal_name, status, created_by) 
      values ('Cliente Demo', 'Cliente Demo Ltda', 'active', admin_user_id);
    end if;

    -- Insert demo contact
    insert into core.contacts (client_id, name, email, job_title, is_primary)
    select c.id, 'João Silva', 'joao@clientedemo.com', 'Gerente de TI', true
    from core.clients c
    where c.display_name = 'Cliente Demo'
    and not exists (select 1 from core.contacts where email = 'joao@clientedemo.com');

    -- Link demo client to services
    insert into core.client_services (client_id, service_id, status)
    select c.id, sc.id, 'active'
    from core.clients c, core.services_catalog sc
    where c.display_name = 'Cliente Demo' 
      and sc.code in ('DEV_FE', 'TRAFFIC')
      and not exists (
        select 1 from core.client_services cs 
        where cs.client_id = c.id and cs.service_id = sc.id and cs.status = 'active'
      );
  end if;
end $$;