import { supabase } from '@/integrations/supabase/client';
import type { WorkflowInstance, CreateInstanceInput, InstanceParticipant } from '@/types/mc';

class InstancesRepository {
  async createFromTemplate(
    templateId: string, 
    variables: Record<string, any> = {}
  ): Promise<WorkflowInstance> {
    try {
      const { data, error } = await (supabase as any)
        .schema('mc')
        .from('workflow_instances')
        .insert({
          template_id: templateId,
          template_version: 1,
          status: 'running',
          client_id: variables.client_id,
          service_id: variables.service_id,
          variables
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Instances repository error:', error);
      throw error;
    }
  }

  async listMineOrParticipant(): Promise<WorkflowInstance[]> {
    try {
      const { data, error } = await (supabase as any)
        .schema('mc')
        .from('v_instances_enriched')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Instances repository error:', error);
      throw error;
    }
  }

  async get(id: string): Promise<WorkflowInstance | null> {
    try {
      const { data, error } = await (supabase as any)
        .schema('mc')
        .from('v_instances_enriched')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Instances repository error:', error);
      throw error;
    }
  }

  async addParticipant(
    instanceId: string, 
    userId: string, 
    roleInInstance?: string, 
    isClient: boolean = false
  ): Promise<InstanceParticipant> {
    try {
      const { data, error } = await (supabase as any)
        .schema('mc')
        .from('instance_participants')
        .insert({
          instance_id: instanceId,
          user_id: userId,
          role_in_instance: roleInInstance,
          is_client: isClient
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Instances repository error:', error);
      throw error;
    }
  }

  async getParticipants(instanceId: string): Promise<InstanceParticipant[]> {
    try {
      const { data, error } = await (supabase as any)
        .schema('mc')
        .from('instance_participants')
        .select('*')
        .eq('instance_id', instanceId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Instances repository error:', error);
      throw error;
    }
  }
}

export const instancesRepo = new InstancesRepository();