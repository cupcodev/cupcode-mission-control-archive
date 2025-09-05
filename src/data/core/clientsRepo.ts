import { supabase } from '@/integrations/supabase/client';

export interface Client {
  id: string;
  display_name: string;
  legal_name?: string;
  tax_id?: string;
  website?: string;
  status: 'active' | 'inactive';
  metadata: Record<string, any>;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateClientInput {
  display_name: string;
  legal_name?: string;
  tax_id?: string;
  website?: string;
  status?: 'active' | 'inactive';
  metadata?: Record<string, any>;
}

export interface UpdateClientInput extends Partial<CreateClientInput> {}

class ClientsRepository {
  async list(): Promise<Client[]> {
    try {
      const { data, error } = await (supabase as any)
        .schema('core')
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Clients repository error:', error);
      throw error;
    }
  }

  async get(id: string): Promise<Client | null> {
    try {
      const { data, error } = await (supabase as any)
        .schema('core')
        .from('clients')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Clients repository error:', error);
      return null;
    }
  }

  async create(input: CreateClientInput): Promise<Client> {
    try {
      // Ensure we set created_by to satisfy NOT NULL and RLS policies
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      const user = userData?.user;
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await (supabase as any)
        .schema('core')
        .from('clients')
        .insert({
          ...input,
          status: input.status || 'active',
          metadata: input.metadata || {},
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Clients repository error:', error);
      throw error;
    }
  }

  async update(id: string, input: UpdateClientInput): Promise<Client> {
    try {
      const { data, error } = await (supabase as any)
        .schema('core')
        .from('clients')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Clients repository error:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const { error } = await (supabase as any)
        .schema('core')
        .from('clients')
        .update({ status: 'inactive' })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Clients repository error:', error);
      throw error;
    }
  }
}

export const clientsRepo = new ClientsRepository();