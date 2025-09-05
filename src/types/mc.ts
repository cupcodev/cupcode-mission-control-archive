export interface WorkflowTemplate {
  id: string;
  name: string;
  version: number;
  domain: string;
  spec: WorkflowSpec;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface WorkflowInstance {
  id: string;
  template_id: string;
  template_version: number;
  status: 'running' | 'paused' | 'done' | 'canceled';
  client_id?: string;
  service_id?: string;
  variables: Record<string, any>;
  created_by: string;
  created_at: string;
  // Optional enriched fields from view
  client_name?: string;
  service_name?: string;
}

export interface Task {
  id: string;
  workflow_instance_id: string;
  node_id: string;
  type: 'task' | 'approval' | 'form' | 'automation';
  title: string;
  status: 'open' | 'in_progress' | 'blocked' | 'done' | 'rejected';
  priority: number;
  assigned_role?: string;
  assignee_user_id?: string;
  due_at?: string;
  started_at?: string;
  completed_at?: string;
  sla_hours?: number;
  fields: Record<string, any>;
  created_by: string;
  created_at: string;
}

export interface Comment {
  id: string;
  task_id: string;
  author_user_id: string;
  body: string;
  attachments: Array<{name: string; url: string}>;
  created_at: string;
}

export interface Approval {
  id: string;
  task_id: string;
  approver_user_id: string;
  decision: 'approved' | 'changes_requested' | 'rejected';
  reason?: string;
  artifacts: Array<any>;
  checksum?: string;
  decided_at: string;
}

export interface InstanceParticipant {
  instance_id: string;
  user_id: string;
  role_in_instance?: string;
  is_client: boolean;
  added_at: string;
}

export interface ActivityLog {
  id: number;
  task_id?: string;
  instance_id?: string;
  actor_user_id?: string;
  action: string;
  before?: Record<string, any>;
  after?: Record<string, any>;
  created_at: string;
}

export interface WorkflowSpec {
  nodes: WorkflowNode[];
}

export interface WorkflowNode {
  id: string;
  type: 'task' | 'approval' | 'form' | 'automation';
  title: string;
  role?: string;
  sla_hours?: number;
  requires?: string[];
  outputs?: string[];
}

export interface CreateTemplateInput {
  name: string;
  version?: number;
  domain: string;
  spec: WorkflowSpec;
  is_active?: boolean;
}

export interface CreateInstanceInput {
  template_id: string;
  template_version?: number;
  status?: 'running' | 'paused' | 'done' | 'canceled';
  client_id?: string;
  service_id?: string;
  variables?: Record<string, any>;
}

export interface CreateTaskInput {
  workflow_instance_id: string;
  node_id: string;
  type: 'task' | 'approval' | 'form' | 'automation';
  title: string;
  status?: 'open' | 'in_progress' | 'blocked' | 'done' | 'rejected';
  priority?: number;
  assigned_role?: string;
  assignee_user_id?: string;
  due_at?: string;
  sla_hours?: number;
  fields?: Record<string, any>;
}

export interface UpdateTaskInput {
  title?: string;
  status?: 'open' | 'in_progress' | 'blocked' | 'done' | 'rejected';
  priority?: number;
  assignee_user_id?: string;
  assigned_role?: string;
  due_at?: string;
  started_at?: string;
  completed_at?: string;
  sla_hours?: number;
  fields?: Record<string, any>;
}