-- Aplicar GRANTs mínimos para schemas mc e core
-- USAGE no schema
GRANT USAGE ON SCHEMA mc TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA core TO anon, authenticated, service_role;

-- Permissões de tabela/sequence (RLS continua controlando o acesso real)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA mc TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA mc TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA core TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA core TO authenticated;

-- Defaults para futuras tabelas
ALTER DEFAULT PRIVILEGES IN SCHEMA mc
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA mc
  GRANT USAGE, SELECT ON SEQUENCES TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA core
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA core
  GRANT USAGE, SELECT ON SEQUENCES TO authenticated;

-- RLS — garantir superadmin com acesso total
-- Templates
DROP POLICY IF EXISTS "wf_templates_select_auth" ON mc.workflow_templates;
CREATE POLICY "wf_templates_select_auth"
  ON mc.workflow_templates FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "wf_templates_admin_write" ON mc.workflow_templates;
CREATE POLICY "wf_templates_admin_write"
  ON mc.workflow_templates FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','superadmin')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','superadmin')));

-- Instâncias
DROP POLICY IF EXISTS "wf_instances_select_scoped" ON mc.workflow_instances;
CREATE POLICY "wf_instances_select_scoped"
  ON mc.workflow_instances FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "wf_instances_admin_write" ON mc.workflow_instances;
CREATE POLICY "wf_instances_admin_write"
  ON mc.workflow_instances FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','superadmin')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','superadmin')));

-- Tarefas
DROP POLICY IF EXISTS "tasks_select_scoped" ON mc.tasks;
CREATE POLICY "tasks_select_scoped"
  ON mc.tasks FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "tasks_admin_write_or_assignee_participant" ON mc.tasks;
CREATE POLICY "tasks_admin_write_or_assignee_participant"
  ON mc.tasks FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','superadmin'))
    OR (created_by = auth.uid())
  );

DROP POLICY IF EXISTS "tasks_update_admin_or_assignee" ON mc.tasks;
CREATE POLICY "tasks_update_admin_or_assignee"
  ON mc.tasks FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','superadmin'))
    OR (assignee_user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','superadmin'))
    OR (assignee_user_id = auth.uid())
  );

-- Roles - permitir acesso total para superadmin
DROP POLICY IF EXISTS "roles_select_auth" ON mc.roles;
CREATE POLICY "roles_select_auth"
  ON mc.roles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "roles_admin_write" ON mc.roles;
CREATE POLICY "roles_admin_write"
  ON mc.roles FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','superadmin')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','superadmin')));

-- Role Members
DROP POLICY IF EXISTS "role_members_select_auth" ON mc.role_members;
CREATE POLICY "role_members_select_auth"
  ON mc.role_members FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "role_members_admin_write" ON mc.role_members;
CREATE POLICY "role_members_admin_write"
  ON mc.role_members FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','superadmin')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','superadmin')));

-- Assignment Rules
DROP POLICY IF EXISTS "assignment_rules_select_auth" ON mc.assignment_rules;
CREATE POLICY "assignment_rules_select_auth"
  ON mc.assignment_rules FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "assignment_rules_admin_write" ON mc.assignment_rules;
CREATE POLICY "assignment_rules_admin_write"
  ON mc.assignment_rules FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','superadmin')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','superadmin')));

-- Clients (core schema)
DROP POLICY IF EXISTS "clients_select_auth" ON core.clients;
CREATE POLICY "clients_select_auth"
  ON core.clients FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "clients_admin_write" ON core.clients;
CREATE POLICY "clients_admin_write"
  ON core.clients FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','superadmin')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','superadmin')));

-- Services Catalog (core schema)
DROP POLICY IF EXISTS "services_catalog_select_auth" ON core.services_catalog;
CREATE POLICY "services_catalog_select_auth"
  ON core.services_catalog FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "services_catalog_admin_write" ON core.services_catalog;
CREATE POLICY "services_catalog_admin_write"
  ON core.services_catalog FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','superadmin')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','superadmin')));

-- Client Services (core schema)
DROP POLICY IF EXISTS "client_services_select_auth" ON core.client_services;
CREATE POLICY "client_services_select_auth"
  ON core.client_services FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "client_services_admin_write" ON core.client_services;
CREATE POLICY "client_services_admin_write"
  ON core.client_services FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','superadmin')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','superadmin')));