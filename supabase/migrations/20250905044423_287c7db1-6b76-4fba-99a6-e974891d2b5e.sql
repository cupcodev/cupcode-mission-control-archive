-- Create activity logs table in mc schema
create schema if not exists mc;

create table if not exists mc.activity_logs (
  id bigserial primary key,
  task_id uuid null references mc.tasks(id) on delete set null,
  instance_id uuid null references mc.workflow_instances(id) on delete set null,
  actor_user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  before jsonb,
  after jsonb,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table mc.activity_logs enable row level security;

-- Basic policies: authenticated users can insert and read
create policy "Authenticated can insert activity logs"
  on mc.activity_logs
  for insert
  to authenticated
  with check (true);

create policy "Authenticated can read activity logs"
  on mc.activity_logs
  for select
  to authenticated
  using (true);

-- Indexes for performance
create index if not exists idx_activity_logs_task_id on mc.activity_logs(task_id);
create index if not exists idx_activity_logs_instance_id on mc.activity_logs(instance_id);
create index if not exists idx_activity_logs_created_at on mc.activity_logs(created_at desc);
