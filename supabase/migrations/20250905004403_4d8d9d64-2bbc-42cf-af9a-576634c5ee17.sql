-- Insert the Onboarding template only if the next version doesn't already exist
WITH latest AS (
  SELECT COALESCE(MAX(version), 0) AS v
  FROM mc.workflow_templates 
  WHERE name = 'Onboarding – Desenvolvimento'
)
INSERT INTO mc.workflow_templates (name, version, domain, spec, is_active, created_by)
SELECT 
  'Onboarding – Desenvolvimento',
  latest.v + 1,
  'desenvolvimento',
  '{
    "nodes": [
      { "id": "start_intake", "type": "form", "title": "Intake do Projeto (brief + acessos)", "role": "CS", "sla_hours": 24, "outputs": ["ok"] },
      { "id": "scope_lock", "type": "task", "title": "Fechamento de escopo e critérios de pronto", "role": "PO", "requires": ["start_intake"], "sla_hours": 8 },
      { "id": "repo_init", "type": "automation", "title": "Criar repositório e padrões (lint/commit)", "role": "PO", "requires": ["scope_lock"], "sla_hours": 2 },
      { "id": "env_setup", "type": "task", "title": "Setup de ambientes (dev/stage) e variáveis", "role": "DevOps", "requires": ["repo_init"], "sla_hours": 8 },
      { "id": "design_brief", "type": "task", "title": "Briefing de design / guidelines", "role": "Designer", "requires": ["scope_lock"], "sla_hours": 24 },
      { "id": "ux_wireframes", "type": "task", "title": "UX / Wireframes", "role": "Designer", "requires": ["design_brief"], "sla_hours": 48 },
      { "id": "ui_design", "type": "task", "title": "UI Design (layouts-chave)", "role": "Designer", "requires": ["ux_wireframes"], "sla_hours": 72 },
      { "id": "ui_internal_approval", "type": "approval", "title": "Aprovação UI interna", "role": "Aprovador", "requires": ["ui_design"], "sla_hours": 24, "outputs": ["aprovado", "mudancas"] },
      { "id": "ui_rework", "type": "task", "title": "Retrabalho de UI", "role": "Designer", "requires": ["ui_internal_approval:mudancas"], "sla_hours": 24 },
      { "id": "fe_setup", "type": "task", "title": "Setup Front-end (design system / rotas)", "role": "FrontEnd", "requires": ["env_setup", "ui_internal_approval:aprovado"], "sla_hours": 8 },
      { "id": "be_setup", "type": "task", "title": "Setup Back-end (projeto/base)", "role": "BackEnd", "requires": ["env_setup"], "sla_hours": 8 },
      { "id": "api_contracts", "type": "task", "title": "Contratos de API (schema + mocks)", "role": "BackEnd", "requires": ["be_setup"], "sla_hours": 16 },
      { "id": "cicd", "type": "task", "title": "CI/CD e qualidade (build, test, lint)", "role": "DevOps", "requires": ["env_setup"], "sla_hours": 8 },
      { "id": "impl_front", "type": "task", "title": "Implementação Front-end (telas-chave)", "role": "FrontEnd", "requires": ["fe_setup", "api_contracts"], "sla_hours": 72 },
      { "id": "impl_back", "type": "task", "title": "Implementação Back-end (endpoints principais)", "role": "BackEnd", "requires": ["be_setup", "api_contracts"], "sla_hours": 72 },
      { "id": "integration", "type": "task", "title": "Integração FE/BE", "role": "FrontEnd", "requires": ["impl_front", "impl_back"], "sla_hours": 16 },
      { "id": "qa_plan", "type": "task", "title": "Plano de QA e cenários de teste", "role": "QA", "requires": ["scope_lock"], "sla_hours": 8 },
      { "id": "qa_exec", "type": "task", "title": "Execução de testes (funcionais/regressão)", "role": "QA", "requires": ["integration", "qa_plan"], "sla_hours": 24 },
      { "id": "qa_gate", "type": "approval", "title": "Gate de QA", "role": "QA", "requires": ["qa_exec"], "sla_hours": 12, "outputs": ["ok", "bugs"] },
      { "id": "qa_rework", "type": "task", "title": "Correção de bugs de QA", "role": "FrontEnd", "requires": ["qa_gate:bugs"], "sla_hours": 24 },
      { "id": "seo_audit", "type": "task", "title": "Checklist SEO/Performance/A11y", "role": "FrontEnd", "requires": ["integration"], "sla_hours": 8 },
      { "id": "security_review", "type": "task", "title": "Revisão de segurança (headers, auth, RLS)", "role": "DevOps", "requires": ["integration"], "sla_hours": 8 },
      { "id": "seo_rework", "type": "task", "title": "Ajustes SEO/Perf/A11y", "role": "FrontEnd", "requires": ["seo_audit"], "sla_hours": 8 },
      { "id": "security_rework", "type": "task", "title": "Mitigações de segurança", "role": "BackEnd", "requires": ["security_review"], "sla_hours": 12 },
      { "id": "analytics_setup", "type": "task", "title": "Configurar Analytics/GTM/Pixels", "role": "FrontEnd", "requires": ["integration"], "sla_hours": 6 },
      { "id": "pixels_qc", "type": "task", "title": "QC de tags e eventos (Analytics)", "role": "QA", "requires": ["analytics_setup"], "sla_hours": 4 },
      { "id": "content_load", "type": "task", "title": "Carga de conteúdo (dados reais)", "role": "Conteudista", "requires": ["integration"], "sla_hours": 24 },
      { "id": "client_training", "type": "task", "title": "Treinamento do cliente", "role": "CS", "requires": ["integration"], "sla_hours": 8 },
      { "id": "legal_gate", "type": "approval", "title": "Revisão LGPD/Privacidade", "role": "Aprovador", "requires": ["security_review", "analytics_setup"], "sla_hours": 12, "outputs": ["ok", "ajustes"] },
      { "id": "legal_rework", "type": "task", "title": "Ajustes de conformidade (LGPD)", "role": "BackEnd", "requires": ["legal_gate:ajustes"], "sla_hours": 8 },
      { "id": "uat_gate", "type": "approval", "title": "UAT do cliente (aceitação)", "role": "Aprovador", "requires": ["qa_gate:ok", "content_load", "client_training"], "sla_hours": 24, "outputs": ["ok", "ajustes"] },
      { "id": "uat_rework", "type": "task", "title": "Ajustes pós-UAT", "role": "FrontEnd", "requires": ["uat_gate:ajustes"], "sla_hours": 16 },
      { "id": "launch_prep", "type": "task", "title": "Preparação de lançamento (checklist final)", "role": "PO", "requires": ["uat_gate:ok", "seo_audit", "security_review", "legal_gate:ok"], "sla_hours": 8 },
      { "id": "go_live", "type": "automation", "title": "Go-Live (cutover + monitoramento inicial)", "role": "DevOps", "requires": ["launch_prep"], "sla_hours": 4 },
      { "id": "post_launch", "type": "task", "title": "Pós-lançamento (hotfixes de estabilização)", "role": "FrontEnd", "requires": ["go_live"], "sla_hours": 8 },
      { "id": "retrospective", "type": "task", "title": "Retrospectiva e lições aprendidas", "role": "PO", "requires": ["post_launch"], "sla_hours": 4 }
    ]
  }'::jsonb,
  false,
  auth.uid()
FROM latest
WHERE NOT EXISTS (
  SELECT 1 FROM mc.workflow_templates t
  WHERE t.name = 'Onboarding – Desenvolvimento'
    AND t.version = latest.v + 1
);