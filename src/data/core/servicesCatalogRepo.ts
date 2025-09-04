import { supabase } from '@/integrations/supabase/client';

export interface ServiceCatalog {
  id: string;
  code: string;
  name: string;
  description?: string;
  domain?: string;
  is_active: boolean;
  metadata: Record<string, any>;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateServiceInput {
  code: string;
  name: string;
  description?: string;
  domain?: string;
  is_active?: boolean;
  metadata?: Record<string, any>;
}

export interface UpdateServiceInput extends Partial<CreateServiceInput> {}

class ServicesCatalogRepository {
  async listActive(): Promise<ServiceCatalog[]> {
    try {
      const { data, error } = await (supabase as any)
        .schema('core')
        .from('services_catalog')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Services catalog repository error:', error);
      throw error;
    }
  }

  async list(): Promise<ServiceCatalog[]> {
    try {
      const { data, error } = await (supabase as any)
        .schema('core')
        .from('services_catalog')
        .select('*')
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Services catalog repository error:', error);
      throw error;
    }
  }

  async get(id: string): Promise<ServiceCatalog | null> {
    try {
      const { data, error } = await (supabase as any)
        .schema('core')
        .from('services_catalog')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Services catalog repository error:', error);
      return null;
    }
  }

  async create(input: CreateServiceInput): Promise<ServiceCatalog> {
    try {
      const { data, error } = await (supabase as any)
        .schema('core')
        .from('services_catalog')
        .insert({
          ...input,
          is_active: input.is_active !== false,
          metadata: input.metadata || {}
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Services catalog repository error:', error);
      throw error;
    }
  }

  async update(id: string, input: UpdateServiceInput): Promise<ServiceCatalog> {
    try {
      const { data, error } = await (supabase as any)
        .schema('core')
        .from('services_catalog')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Services catalog repository error:', error);
      throw error;
    }
  }

  async deactivate(id: string): Promise<void> {
    try {
      const { error } = await (supabase as any)
        .schema('core')
        .from('services_catalog')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Services catalog repository error:', error);
      throw error;
    }
  }
}

export const servicesCatalogRepo = new ServicesCatalogRepository();