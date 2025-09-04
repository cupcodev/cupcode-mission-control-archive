import { supabase } from '@/integrations/supabase/client';
import type { Task, CreateTaskInput, UpdateTaskInput, Comment } from '@/types/mc';

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
      const { data, error } = await (supabase as any)
        .schema('mc')
        .from('tasks')
        .insert({
          ...task,
          status: task.status || 'open',
          priority: task.priority || 1,
          fields: task.fields || {}
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

  async update(id: string, updates: UpdateTaskInput): Promise<Task> {
    try {
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
      return data;
    } catch (error) {
      console.error('Tasks repository error:', error);
      throw error;
    }
  }

  async addComment(taskId: string, body: string, attachments: Array<{name: string; url: string}> = []): Promise<Comment> {
    try {
      const { data, error } = await (supabase as any)
        .schema('mc')
        .from('comments')
        .insert({
          task_id: taskId,
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
}

export const tasksRepo = new TasksRepository();