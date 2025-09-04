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

// Mock data store for demonstration
const mockRoles: Role[] = [
  {
    name: 'Designer',
    description: 'UI/UX Design e criação visual',
    created_by: 'mock-user-id',
    created_at: new Date().toISOString()
  },
  {
    name: 'Desenvolvedor Frontend',
    description: 'Desenvolvimento de interfaces',
    created_by: 'mock-user-id',
    created_at: new Date().toISOString()
  },
  {
    name: 'Desenvolvedor Backend',
    description: 'APIs e serviços backend',
    created_by: 'mock-user-id',
    created_at: new Date().toISOString()
  },
  {
    name: 'QA',
    description: 'Quality Assurance e testes',
    created_by: 'mock-user-id',
    created_at: new Date().toISOString()
  }
];

const mockRoleMembers: RoleMemberWithProfile[] = [
  {
    role_name: 'Designer',
    user_id: 'user-1',
    order_index: 0,
    is_active: true,
    added_at: new Date().toISOString(),
    profile: { display_name: 'Ana Silva', email: 'ana@exemplo.com' }
  },
  {
    role_name: 'Designer',
    user_id: 'user-2',
    order_index: 1,
    is_active: true,
    added_at: new Date().toISOString(),
    profile: { display_name: 'Carlos Lima', email: 'carlos@exemplo.com' }
  },
  {
    role_name: 'Desenvolvedor Frontend',
    user_id: 'user-3',
    order_index: 0,
    is_active: true,
    added_at: new Date().toISOString(),
    profile: { display_name: 'Maria Santos', email: 'maria@exemplo.com' }
  }
];

const mockAssignmentRules: AssignmentRule[] = [
  {
    role_name: 'Designer',
    strategy: 'round_robin',
    last_assigned_user_id: 'user-1',
    updated_at: new Date().toISOString()
  },
  {
    role_name: 'Desenvolvedor Frontend',
    strategy: 'round_robin',
    last_assigned_user_id: null,
    updated_at: new Date().toISOString()
  }
];

class RolesRepository {
  async list(): Promise<Role[]> {
    // TODO: When mc schema is available, replace with:
    // const { data, error } = await supabase.rpc('select_roles');
    return mockRoles;
  }

  async get(name: string): Promise<Role | null> {
    // TODO: When mc schema is available, replace with:
    // const { data, error } = await supabase.rpc('select_role', { role_name: name });
    return mockRoles.find(r => r.name === name) || null;
  }

  async create(role: CreateRoleInput): Promise<Role> {
    // TODO: When mc schema is available, replace with:
    // const { data, error } = await supabase.rpc('insert_role', { ... });
    const { data: user } = await supabase.auth.getUser();
    
    const newRole: Role = {
      name: role.name,
      description: role.description,
      created_by: user.user?.id || 'mock-user-id',
      created_at: new Date().toISOString()
    };
    
    mockRoles.push(newRole);
    return newRole;
  }

  async delete(name: string): Promise<void> {
    // TODO: When mc schema is available, replace with:
    // const { error } = await supabase.rpc('delete_role', { role_name: name });
    const index = mockRoles.findIndex(r => r.name === name);
    if (index >= 0) {
      mockRoles.splice(index, 1);
    }
  }

  async listMembers(roleName: string): Promise<RoleMemberWithProfile[]> {
    // TODO: When mc schema is available, replace with:
    // const { data, error } = await supabase.rpc('select_role_members', { role_name: roleName });
    return mockRoleMembers.filter(m => m.role_name === roleName);
  }

  async addMember(roleName: string, userId: string, orderIndex?: number): Promise<RoleMember> {
    // TODO: When mc schema is available, replace with:
    // const { data, error } = await supabase.rpc('insert_role_member', { ... });
    
    const existingMembers = mockRoleMembers.filter(m => m.role_name === roleName);
    if (orderIndex === undefined) {
      orderIndex = existingMembers.length;
    }

    // Get user profile for display
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, display_name')
      .eq('id', userId)
      .single();

    const newMember: RoleMemberWithProfile = {
      role_name: roleName,
      user_id: userId,
      order_index: orderIndex,
      is_active: true,
      added_at: new Date().toISOString(),
      profile: profiles ? { 
        display_name: profiles.display_name, 
        email: profiles.email 
      } : undefined
    };
    
    mockRoleMembers.push(newMember);
    return newMember;
  }

  async removeMember(roleName: string, userId: string): Promise<void> {
    // TODO: When mc schema is available, replace with:
    // const { error } = await supabase.rpc('delete_role_member', { ... });
    const index = mockRoleMembers.findIndex(m => 
      m.role_name === roleName && m.user_id === userId
    );
    if (index >= 0) {
      mockRoleMembers.splice(index, 1);
    }
  }

  async reorderMember(roleName: string, userId: string, newIndex: number): Promise<void> {
    // TODO: When mc schema is available, replace with:
    // const { error } = await supabase.rpc('update_role_member_order', { ... });
    const member = mockRoleMembers.find(m => 
      m.role_name === roleName && m.user_id === userId
    );
    if (member) {
      member.order_index = newIndex;
    }
  }

  async toggleMemberActive(roleName: string, userId: string, isActive: boolean): Promise<void> {
    // TODO: When mc schema is available, replace with:
    // const { error } = await supabase.rpc('update_role_member_active', { ... });
    const member = mockRoleMembers.find(m => 
      m.role_name === roleName && m.user_id === userId
    );
    if (member) {
      member.is_active = isActive;
    }
  }

  async getAssignmentRule(roleName: string): Promise<AssignmentRule | null> {
    // TODO: When mc schema is available, replace with:
    // const { data, error } = await supabase.rpc('select_assignment_rule', { role_name: roleName });
    return mockAssignmentRules.find(r => r.role_name === roleName) || null;
  }

  async upsertAssignmentRule(
    roleName: string, 
    strategy: 'round_robin' | 'manual',
    lastAssignedUserId?: string
  ): Promise<AssignmentRule> {
    // TODO: When mc schema is available, replace with:
    // const { data, error } = await supabase.rpc('upsert_assignment_rule', { ... });
    
    let rule = mockAssignmentRules.find(r => r.role_name === roleName);
    if (rule) {
      rule.strategy = strategy;
      rule.last_assigned_user_id = lastAssignedUserId;
      rule.updated_at = new Date().toISOString();
    } else {
      rule = {
        role_name: roleName,
        strategy,
        last_assigned_user_id: lastAssignedUserId,
        updated_at: new Date().toISOString()
      };
      mockAssignmentRules.push(rule);
    }
    
    return rule;
  }

  async resetPointer(roleName: string): Promise<void> {
    // TODO: When mc schema is available, replace with:
    // const { error } = await supabase.rpc('reset_assignment_pointer', { role_name: roleName });
    const rule = mockAssignmentRules.find(r => r.role_name === roleName);
    if (rule) {
      rule.last_assigned_user_id = undefined;
      rule.updated_at = new Date().toISOString();
    }
  }

  async searchUsersByEmail(email: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, display_name')
      .ilike('email', `%${email}%`)
      .limit(10);
    
    if (error) throw error;
    return data || [];
  }
}

export const rolesRepo = new RolesRepository();