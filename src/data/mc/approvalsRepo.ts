import { supabase } from '@/integrations/supabase/client';
import type { Approval } from '@/types/mc';

export const approvalsRepo = {
  async create(approval: Omit<Approval, 'id' | 'decided_at'>): Promise<Approval> {
    try {
      const { data, error } = await (supabase as any)
        .schema('mc')
        .from('approvals')
        .insert(approval)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Approvals repository error:', error);
      throw error;
    }
  },

  async listByTask(taskId: string): Promise<Approval[]> {
    try {
      const { data, error } = await (supabase as any)
        .schema('mc')
        .from('approvals')
        .select('*')
        .eq('task_id', taskId)
        .order('decided_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Approvals repository error:', error);
      throw error;
    }
  },

  async get(id: string): Promise<Approval | null> {
    try {
      const { data, error } = await (supabase as any)
        .schema('mc')
        .from('approvals')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Approvals repository error:', error);
      return null;
    }
  }
};