import { supabase } from '@/integrations/supabase/client';
import type { ActivityLog } from '@/types/mc';

class ActivityLogRepository {
  async create(
    taskId: string,
    action: string,
    before?: Record<string, any>,
    after?: Record<string, any>,
    instanceId?: string
  ): Promise<ActivityLog> {
    try {
      const { data: authData, error: authError } = await (supabase as any).auth.getUser();
      if (authError) throw authError;
      const user = authData?.user;
      if (!user) throw new Error('Não autenticado');

      const { data, error } = await (supabase as any)
        .schema('mc')
        .from('activity_logs')
        .insert({
          task_id: taskId,
          instance_id: instanceId,
          actor_user_id: user.id,
          action,
          before,
          after
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Activity log repository error:', error);
      throw error;
    }
  }

  async listByTask(taskId: string): Promise<ActivityLog[]> {
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
      console.error('Activity log repository error:', error);
      return [];
    }
  }

  async listByInstance(instanceId: string): Promise<ActivityLog[]> {
    try {
      const { data, error } = await (supabase as any)
        .schema('mc')
        .from('activity_logs')
        .select('*')
        .eq('instance_id', instanceId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Activity log repository error:', error);
      return [];
    }
  }
}

export const activityLogRepo = new ActivityLogRepository();