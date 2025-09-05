-- Criar a view de eventos do calendário
create or replace view mc.v_calendar_events as
  -- vencimentos de qualquer tarefa com due_at
  select
    ('task:'||t.id::text)           as event_id,
    'task_due'::text                as event_type,
    t.id                            as task_id,
    t.workflow_instance_id          as instance_id,
    wi.client_id,
    wi.service_id,
    t.title                         as title,
    t.due_at                        as start_at,
    (t.due_at + interval '60 minutes') as end_at,
    false                           as all_day,
    t.assignee_user_id,
    t.assigned_role,
    t.status,
    t.type                          as task_type,
    t.created_at                    as created_at
  from mc.tasks t
  join mc.workflow_instances wi on wi.id = t.workflow_instance_id
  where t.due_at is not null

  union all

  -- aprovações pendentes com due_at
  select
    ('approval:'||t.id::text),
    'approval_pending',
    t.id,
    t.workflow_instance_id,
    wi.client_id,
    wi.service_id,
    (t.title || ' — decisão')       as title,
    t.due_at                        as start_at,
    (t.due_at + interval '30 minutes') as end_at,
    false,
    t.assignee_user_id,
    t.assigned_role,
    t.status,
    t.type,
    t.created_at
  from mc.tasks t
  join mc.workflow_instances wi on wi.id = t.workflow_instance_id
  where t.type = 'approval'
    and t.status in ('open','in_progress')
    and t.due_at is not null

  union all

  -- marcos (ex.: preparação e go-live) quando tiverem due_at
  select
    ('milestone:'||t.id::text),
    'milestone',
    t.id,
    t.workflow_instance_id,
    wi.client_id,
    wi.service_id,
    t.title,
    t.due_at,
    (t.due_at + interval '60 minutes'),
    false,
    t.assignee_user_id,
    t.assigned_role,
    t.status,
    t.type,
    t.created_at
  from mc.tasks t
  join mc.workflow_instances wi on wi.id = t.workflow_instance_id
  where t.node_id in ('launch_prep','go_live') and t.due_at is not null;