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
      // For now return mock data since we can't access core schema from client
      return [
        {
          id: 'cs-1',
          client_id: clientId,
          service_id: 'dev-fe-1',
          status: 'active',
          metadata: {},
          created_at: new Date().toISOString(),
          service_name: 'Desenvolvimento Frontend',
          service_code: 'DEV_FE',
          service_domain: 'development',
          client_name: 'Cliente Demo'
        }
      ];
    } catch (error) {
      console.error('Client services repository error:', error);
      throw error;
    }
  }

  async link(clientId: string, serviceId: string): Promise<ClientService> {
    try {
      // Mock implementation for now
      console.log('Linking client service (simulated):', { clientId, serviceId });
      
      return {
        id: `cs-${Date.now()}`,
        client_id: clientId,
        service_id: serviceId,
        status: 'active',
        metadata: {},
        created_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Client services repository error:', error);
      throw error;
    }
  }

  async unlink(linkId: string): Promise<void> {
    try {
      console.log('Unlinking client service (simulated):', linkId);
    } catch (error) {
      console.error('Client services repository error:', error);
      throw error;
    }
  }

  async updateStatus(linkId: string, status: 'active' | 'paused' | 'ended'): Promise<ClientService> {
    try {
      console.log('Updating client service status (simulated):', { linkId, status });
      
      return {
        id: linkId,
        client_id: 'demo-client-1',
        service_id: 'dev-fe-1',
        status,
        metadata: {},
        created_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Client services repository error:', error);
      throw error;
    }
  }
}

export const clientServicesRepo = new ClientServicesRepository();