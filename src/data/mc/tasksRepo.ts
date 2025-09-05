import { supabase } from '@/integrations/supabase/client';
import type { Task, CreateTaskInput, UpdateTaskInput, Comment, ActivityLog } from '@/types/mc';

class TasksRepository {
  async listByInstance(instanceId: string): Promise<Task[]> {
    try {
      const { data, error } = await (supabase as any)
        .schema('mc')
        .from('tasks')
        .select('*')
        .eq('workflow_instance_id', instanceId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Tasks repository error:', error);
      throw error;
    }
  }

  async get(id: string): Promise<Task | null> {
    try {
      const { data, error } = await (supabase as any)
        .schema('mc')
        .from('tasks')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Tasks repository error:', error);
      return null;
    }
  }

  async create(task: CreateTaskInput): Promise<Task> {
    try {
      // Ensure we have the current user for created_by
      const { data: authData, error: authError } = await (supabase as any).auth.getUser();
      if (authError) throw authError;
      const user = authData?.user;
      if (!user) throw new Error('Não autenticado');

      const payload = {
        ...task,
        status: task.status || 'open',
        priority: task.priority || 1,
        fields: task.fields || {},
        created_by: user.id,
      };

      const { data, error } = await (supabase as any)
        .schema('mc')
        .from('tasks')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Tasks repository error:', error);
      throw error;
    }
  }

  async update(id: string, updates: UpdateTaskInput): Promise<Task> {
    try {
      // First get the current task to detect changes
      const { data: currentTask } = await (supabase as any)
        .schema('mc')
        .from('tasks')
        .select('*')
        .eq('id', id)
        .single();

      // Handle status transitions
      const updateData = { ...updates };
      if (updates.status === 'in_progress' && !updates.started_at) {
        updateData.started_at = new Date().toISOString();
      }
      if ((updates.status === 'done' || updates.status === 'rejected') && !updates.completed_at) {
        updateData.completed_at = new Date().toISOString();
      }

      const { data, error } = await (supabase as any)
        .schema('mc')
        .from('tasks')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Log activity for significant changes
      if (currentTask) {
        this.logActivity(id, currentTask, data).catch(console.error);
      }

      return data;
    } catch (error) {
      console.error('Tasks repository error:', error);
      throw error;
    }
  }

  async addComment(taskId: string, body: string, attachments: Array<{name: string; url: string}> = []): Promise<Comment> {
    try {
      // Get current user for created_by
      const { data: authData, error: authError } = await (supabase as any).auth.getUser();
      if (authError) throw authError;
      const user = authData?.user;
      if (!user) throw new Error('Não autenticado');

      const { data, error } = await (supabase as any)
        .schema('mc')
        .from('comments')
        .insert({
          task_id: taskId,
          author_user_id: user.id,
          body,
          attachments
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Tasks repository error:', error);
      throw error;
    }
  }

  async getComments(taskId: string): Promise<Comment[]> {
    try {
      const { data, error } = await (supabase as any)
        .schema('mc')
        .from('comments')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Tasks repository error:', error);
      throw error;
    }
  }

  async getActivityLogs(taskId: string): Promise<ActivityLog[]> {
    try {
      const { data, error } = await (supabase as any)
        .schema('mc')
        .from('activity_logs')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Tasks repository error:', error);
      return [];
    }
  }

  private async logActivity(taskId: string, before: Task, after: Task): Promise<void> {
    try {
      const { data: authData } = await (supabase as any).auth.getUser();
      const user = authData?.user;
      if (!user) return;

      const changes: Array<{action: string, before: any, after: any}> = [];

      // Check for title changes (in fields)
      if (before.fields?.title !== after.fields?.title) {
        changes.push({
          action: `alterou o título de "${before.title}" para "${after.fields?.title || after.title}"`,
          before: { title: before.title },
          after: { title: after.fields?.title || after.title }
        });
      }

      // Check for status changes
      if (before.status !== after.status) {
        changes.push({
          action: `alterou status de "${before.status}" para "${after.status}"`,
          before: { status: before.status },
          after: { status: after.status }
        });
      }

      // Check for priority changes
      if (before.priority !== after.priority) {
        changes.push({
          action: `alterou prioridade de ${before.priority} para ${after.priority}`,
          before: { priority: before.priority },
          after: { priority: after.priority }
        });
      }

      // Check for assignee changes
      if (before.assignee_user_id !== after.assignee_user_id) {
        changes.push({
          action: after.assignee_user_id ? 'foi atribuída' : 'teve atribuição removida',
          before: { assignee_user_id: before.assignee_user_id },
          after: { assignee_user_id: after.assignee_user_id }
        });
      }

      // Check for role changes
      if (before.assigned_role !== after.assigned_role) {
        changes.push({
          action: `alterou função de "${before.assigned_role || 'não definida'}" para "${after.assigned_role || 'não definida'}"`,
          before: { assigned_role: before.assigned_role },
          after: { assigned_role: after.assigned_role }
        });
      }

      // Check for SLA changes
      if (before.sla_hours !== after.sla_hours) {
        changes.push({
          action: `alterou SLA de ${before.sla_hours || 0} para ${after.sla_hours || 0} horas`,
          before: { sla_hours: before.sla_hours },
          after: { sla_hours: after.sla_hours }
        });
      }

      // Check for due date changes
      if (before.due_at !== after.due_at) {
        changes.push({
          action: after.due_at ? 'teve data de vencimento definida' : 'teve data de vencimento removida',
          before: { due_at: before.due_at },
          after: { due_at: after.due_at }
        });
      }

      // Log each change
      for (const change of changes) {
        await (supabase as any)
          .schema('mc')
          .from('activity_logs')
          .insert({
            task_id: taskId,
            actor_user_id: user.id,
            action: change.action,
            before: change.before,
            after: change.after
          });
      }
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  }
}

export const tasksRepo = new TasksRepository();