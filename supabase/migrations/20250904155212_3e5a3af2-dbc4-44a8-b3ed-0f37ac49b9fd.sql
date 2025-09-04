-- Schema
create schema if not exists mc;

-- Tabelas principais
create table if not exists mc.workflow_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  version int not null default 1,
  domain text not null,                               -- ex.: development|branding|traffic|social|ops (livre por ora)
  spec jsonb not null,                                -- JSON com nós/arestas/SLAs
  is_active boolean not null default true,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists mc.workflow_instances (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references mc.workflow_templates(id) on delete restrict,
  template_version int not null,
  status text not null check (status in ('running','paused','done','canceled')),
  client_id uuid,                                     -- referência lógica (sem FK por ora)
  service_id uuid,                                    -- referência lógica (sem FK por ora)
  variables jsonb not null default '{}',
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists mc.tasks (
  id uuid primary key default gen_random_uuid(),
  workflow_instance_id uuid not null references mc.workflow_instances(id) on delete cascade,
  node_id text not null,                              -- id do nó no template (para rastrear origem)
  type text not null check (type in ('task','approval','form','automation')),
  title text not null,
  status text not null check (status in ('open','in_progress','blocked','done','rejected')),
  priority int not null default 3 check (priority between 1 and 5),
  assigned_role text,                                 -- Designer|FrontEnd|BackEnd|QA|PO|CS|Aprovador...
  assignee_user_id uuid references auth.users(id),
  due_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  sla_hours int,
  fields jsonb not null default '{}',                 -- campos específicos (URLs, IDs, etc.)
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists mc.comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references mc.tasks(id) on delete cascade,
  author_user_id uuid not null references auth.users(id),
  body text not null,
  attachments jsonb not null default '[]'::jsonb,     -- [{name,url}], preferir Telescup links
  created_at timestamptz not null default now()
);

create table if not exists mc.approvals (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references mc.tasks(id) on delete cascade,
  approver_user_id uuid not null references auth.users(id),
  decision text not null check (decision in ('approved','changes_requested','rejected')),
  reason text,
  artifacts jsonb not null default '[]'::jsonb,
  checksum text,
  decided_at timestamptz not null default now()
);

create table if not exists mc.instance_participants (
  instance_id uuid not null references mc.workflow_instances(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  role_in_instance text,                              -- ex.: PO, Designer, Cliente
  is_client boolean not null default false,
  added_at timestamptz not null default now(),
  primary key (instance_id, user_id)
);

create table if not exists mc.activity_logs (
  id bigserial primary key,
  task_id uuid references mc.tasks(id) on delete set null,
  instance_id uuid references mc.workflow_instances(id) on delete set null,
  actor_user_id uuid references auth.users(id),
  action text not null,                               -- state_change|comment|reassign|field_update|automation_run...
  before jsonb,
  after jsonb,
  created_at timestamptz not null default now()
);

-- Índices úteis
create index if not exists idx_mc_instances_template on mc.workflow_instances(template_id);
create index if not exists idx_mc_tasks_instance on mc.tasks(workflow_instance_id);
create index if not exists idx_mc_tasks_assignee on mc.tasks(assignee_user_id);
create index if not exists idx_mc_tasks_status on mc.tasks(status);
create index if not exists idx_mc_participants_user on mc.instance_participants(user_id);
create index if not exists idx_mc_logs_instance on mc.activity_logs(instance_id);

-- RLS
alter table mc.workflow_templates enable row level security;
alter table mc.workflow_instances enable row level security;
alter table mc.tasks enable row level security;
alter table mc.comments enable row level security;
alter table mc.approvals enable row level security;
alter table mc.instance_participants enable row level security;
alter table mc.activity_logs enable row level security;

-- Templates: leitura para autenticados; escrita só admin+
create policy "templates_select_all_auth"
  on mc.workflow_templates for select
  to authenticated using (true);

create policy "templates_admin_write"
  on mc.workflow_templates for all
  to authenticated using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','superadmin'))
  ) with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','superadmin'))
  );

-- Instances: ver se participa ou se é admin+; criar apenas admin+
create policy "instances_select_participant_or_admin"
  on mc.workflow_instances for select
  to authenticated using (
    exists (select 1 from mc.instance_participants ip where ip.instance_id = id and ip.user_id = auth.uid())
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','superadmin'))
    or created_by = auth.uid()
  );

create policy "instances_insert_admin_only"
  on mc.workflow_instances for insert
  to authenticated with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','superadmin'))
  );

create policy "instances_update_admin_only"
  on mc.workflow_instances for update
  to authenticated using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','superadmin'))
  ) with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','superadmin'))
  );

-- Participants: admin+ gerencia; usuário pode ler suas próprias participações
create policy "participants_select_self_or_admin"
  on mc.instance_participants for select
  to authenticated using (
    user_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','superadmin'))
  );

create policy "participants_admin_write"
  on mc.instance_participants for all
  to authenticated using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','superadmin'))
  ) with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','superadmin'))
  );

-- Tasks: ver se é admin+, assignee ou participante da instância
create policy "tasks_select_scoped"
  on mc.tasks for select
  to authenticated using (
    assignee_user_id = auth.uid()
    or exists (select 1 from mc.workflow_instances wi
               join mc.instance_participants ip on ip.instance_id = wi.id
               where wi.id = workflow_instance_id and ip.user_id = auth.uid())
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','superadmin'))
  );

-- inserir tarefa: admin+ ou criador participante
create policy "tasks_insert_admin_or_creator_participant"
  on mc.tasks for insert
  to authenticated with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','superadmin'))
    or exists (select 1 from mc.instance_participants ip where ip.instance_id = workflow_instance_id and ip.user_id = auth.uid())
  );

-- atualizar tarefa: admin+; assignee pode atualizar status/campos não sensíveis (validação via app)
create policy "tasks_update_admin_or_assignee"
  on mc.tasks for update
  to authenticated using (
    assignee_user_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','superadmin'))
  ) with check (
    assignee_user_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','superadmin'))
  );

-- Comments: leitura conforme task; inserir se participante
create policy "comments_select_scoped"
  on mc.comments for select
  to authenticated using (
    exists (select 1 from mc.tasks t where t.id = task_id and (
      t.assignee_user_id = auth.uid()
      or exists (select 1 from mc.workflow_instances wi
                 join mc.instance_participants ip on ip.instance_id = wi.id
                 where wi.id = t.workflow_instance_id and ip.user_id = auth.uid())
      or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','superadmin'))
    ))
  );

create policy "comments_insert_participant_or_admin"
  on mc.comments for insert
  to authenticated with check (
    exists (select 1 from mc.tasks t
            join mc.workflow_instances wi on wi.id = t.workflow_instance_id
            join mc.instance_participants ip on ip.instance_id = wi.id and ip.user_id = auth.uid()
            where t.id = task_id)
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','superadmin'))
  );

-- Approvals: leitura conforme task; inserir somente o aprovador ou admin+
create policy "approvals_select_scoped"
  on mc.approvals for select
  to authenticated using (
    exists (select 1 from mc.tasks t where t.id = task_id and (
      t.assignee_user_id = auth.uid()
      or exists (select 1 from mc.workflow_instances wi
                 join mc.instance_participants ip on ip.instance_id = wi.id
                 where wi.id = t.workflow_instance_id and ip.user_id = auth.uid())
      or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','superadmin'))
    ))
  );

create policy "approvals_insert_approver_or_admin"
  on mc.approvals for insert
  to authenticated with check (
    approver_user_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','superadmin'))
  );

-- Activity logs: leitura conforme instância; escrita por participante/admin
create policy "logs_select_scoped"
  on mc.activity_logs for select
  to authenticated using (
    exists (select 1 from mc.workflow_instances wi
            join mc.instance_participants ip on ip.instance_id = wi.id
            where wi.id = activity_logs.instance_id and ip.user_id = auth.uid())
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','superadmin'))
  );

create policy "logs_insert_participant_or_admin"
  on mc.activity_logs for insert
  to authenticated with check (
    (actor_user_id = auth.uid()
     and exists (select 1 from mc.workflow_instances wi
                 join mc.instance_participants ip on ip.instance_id = wi.id and ip.user_id = auth.uid()
                 where wi.id = activity_logs.instance_id))
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','superadmin'))
  );