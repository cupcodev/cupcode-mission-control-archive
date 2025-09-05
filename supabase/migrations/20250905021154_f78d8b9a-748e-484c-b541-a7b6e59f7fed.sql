-- Allow creating events (tasks) without linking to a workflow instance
alter table mc.tasks alter column workflow_instance_id drop not null;