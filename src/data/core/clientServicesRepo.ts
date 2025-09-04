import { supabase } from '@/integrations/supabase/client';

export interface ClientService {
  id: string;
  client_id: string;
  service_id: string;
  status: 'active' | 'paused' | 'ended';
  start_date?: string;
  end_date?: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface ClientServiceWithDetails extends ClientService {
  service_name: string;
  service_code: string;
  service_domain?: string;
  client_name: string;
}

class ClientServicesRepository {
  async listByClient(clientId: string): Promise<ClientServiceWithDetails[]> {
    try {
      // Type assertion until types are regenerated
      const { data, error } = await (supabase as any)
        .schema('core')
        .from('client_services')
        .select(`
          *,
          clients!inner(display_name),
          services_catalog!inner(name, code, domain)
        `)
        .eq('client_id', clientId);

      if (error) throw error;
      
      return (data || []).map((item: any) => ({
        id: item.id,
        client_id: item.client_id,
        service_id: item.service_id,
        status: item.status,
        start_date: item.start_date,
        end_date: item.end_date,
        metadata: item.metadata,
        created_at: item.created_at,
        service_name: item.services_catalog.name,
        service_code: item.services_catalog.code,
        service_domain: item.services_catalog.domain,
        client_name: item.clients.display_name
      }));
    } catch (error) {
      console.error('Client services repository error:', error);
      throw error;
    }
  }

  async link(clientId: string, serviceId: string): Promise<ClientService> {
    try {
      const { data, error } = await (supabase as any)
        .schema('core')
        .from('client_services')
        .insert({
          client_id: clientId,
          service_id: serviceId,
          status: 'active',
          metadata: {}
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Client services repository error:', error);
      throw error;
    }
  }

  async unlink(linkId: string): Promise<void> {
    try {
      const { error } = await (supabase as any)
        .schema('core')
        .from('client_services')
        .delete()
        .eq('id', linkId);

      if (error) throw error;
    } catch (error) {
      console.error('Client services repository error:', error);
      throw error;
    }
  }

  async updateStatus(linkId: string, status: 'active' | 'paused' | 'ended'): Promise<ClientService> {
    try {
      const { data, error } = await (supabase as any)
        .schema('core')
        .from('client_services')
        .update({ status })
        .eq('id', linkId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Client services repository error:', error);
      throw error;
    }
  }
}

export const clientServicesRepo = new ClientServicesRepository();