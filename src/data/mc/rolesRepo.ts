import { supabase } from '@/integrations/supabase/client';

export interface Role {
  name: string;
  description?: string;
  created_by: string;
  created_at: string;
}

export interface RoleMember {
  role_name: string;
  user_id: string;
  order_index: number;
  is_active: boolean;
  added_at: string;
}

export interface AssignmentRule {
  role_name: string;
  strategy: 'round_robin' | 'manual';
  last_assigned_user_id?: string;
  updated_at: string;
}

export interface CreateRoleInput {
  name: string;
  description?: string;
}

export interface RoleMemberWithProfile extends RoleMember {
  profile?: {
    display_name?: string;
    email?: string;
  };
}

class RolesRepository {
  async list(): Promise<Role[]> {
    try {
      const { data, error } = await (supabase as any)
        .schema('mc')
        .from('roles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Roles repository error:', error);
      return [];
    }
  }

  async get(name: string): Promise<Role | null> {
    try {
      const { data, error } = await (supabase as any)
        .schema('mc')
        .from('roles')
        .select('*')
        .eq('name', name)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Roles repository error:', error);
      return null;
    }
  }

  async create(role: CreateRoleInput): Promise<Role> {
    try {
      const { data: authData, error: authError } = await (supabase as any).auth.getUser();
      if (authError) throw authError;
      const user = authData?.user;
      if (!user) throw new Error('Não autenticado');

      const { data, error } = await (supabase as any)
        .schema('mc')
        .from('roles')
        .insert({
          name: role.name,
          description: role.description,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Roles repository error:', error);
      throw error;
    }
  }

  async delete(name: string): Promise<void> {
    try {
      const { error } = await (supabase as any)
        .schema('mc')
        .from('roles')
        .delete()
        .eq('name', name);

      if (error) throw error;
    } catch (error) {
      console.error('Roles repository error:', error);
      throw error;
    }
  }

  async listMembers(roleName: string): Promise<RoleMemberWithProfile[]> {
    try {
      const { data, error } = await (supabase as any)
        .schema('mc')
        .from('role_members')
        .select('*')
        .eq('role_name', roleName)
        .order('order_index', { ascending: true });

      if (error) throw error;

      // Enrich with profile data
      const membersWithProfiles = await Promise.all(
        (data || []).map(async (member: RoleMember) => {
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('id, email, display_name')
              .eq('id', member.user_id)
              .single();

            return {
              ...member,
              profile: profile ? {
                display_name: profile.display_name,
                email: profile.email
              } : undefined
            };
          } catch {
            return { ...member, profile: undefined };
          }
        })
      );

      return membersWithProfiles;
    } catch (error) {
      console.error('Roles repository error:', error);
      return [];
    }
  }

  async addMember(roleName: string, userId: string, orderIndex?: number): Promise<RoleMember> {
    try {
      // Get current max order_index if not provided
      if (orderIndex === undefined) {
        const { data: existingMembers } = await (supabase as any)
          .schema('mc')
          .from('role_members')
          .select('order_index')
          .eq('role_name', roleName)
          .order('order_index', { ascending: false })
          .limit(1);

        orderIndex = existingMembers?.[0]?.order_index + 1 || 0;
      }

      const { data, error } = await (supabase as any)
        .schema('mc')
        .from('role_members')
        .insert({
          role_name: roleName,
          user_id: userId,
          order_index: orderIndex,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Roles repository error:', error);
      throw error;
    }
  }

  async removeMember(roleName: string, userId: string): Promise<void> {
    try {
      const { error } = await (supabase as any)
        .schema('mc')
        .from('role_members')
        .delete()
        .eq('role_name', roleName)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Roles repository error:', error);
      throw error;
    }
  }

  async reorderMember(roleName: string, userId: string, newIndex: number): Promise<void> {
    try {
      const { error } = await (supabase as any)
        .schema('mc')
        .from('role_members')
        .update({ order_index: newIndex })
        .eq('role_name', roleName)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Roles repository error:', error);
      throw error;
    }
  }

  async toggleMemberActive(roleName: string, userId: string, isActive: boolean): Promise<void> {
    try {
      const { error } = await (supabase as any)
        .schema('mc')
        .from('role_members')
        .update({ is_active: isActive })
        .eq('role_name', roleName)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Roles repository error:', error);
      throw error;
    }
  }

  async getAssignmentRule(roleName: string): Promise<AssignmentRule | null> {
    try {
      const { data, error } = await (supabase as any)
        .schema('mc')
        .from('assignment_rules')
        .select('*')
        .eq('role_name', roleName)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Roles repository error:', error);
      return null;
    }
  }

  async upsertAssignmentRule(
    roleName: string, 
    strategy: 'round_robin' | 'manual',
    lastAssignedUserId?: string
  ): Promise<AssignmentRule> {
    try {
      const { data, error } = await (supabase as any)
        .schema('mc')
        .from('assignment_rules')
        .upsert({
          role_name: roleName,
          strategy,
          last_assigned_user_id: lastAssignedUserId
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Roles repository error:', error);
      throw error;
    }
  }

  async resetPointer(roleName: string): Promise<void> {
    try {
      const { error } = await (supabase as any)
        .schema('mc')
        .from('assignment_rules')
        .update({ last_assigned_user_id: null })
        .eq('role_name', roleName);

      if (error) throw error;
    } catch (error) {
      console.error('Roles repository error:', error);
      throw error;
    }
  }

  async searchUsersByEmail(email: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, display_name')
        .ilike('email', `%${email}%`)
        .limit(10);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Roles repository error:', error);
      return [];
    }
  }
}

export const rolesRepo = new RolesRepository();