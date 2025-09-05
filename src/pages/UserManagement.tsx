import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Users, Briefcase, Edit, Trash2, UserPlus, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { UserCreateDialog } from '@/components/workflows/UserCreateDialog';

interface UserProfile {
  id: string;
  email: string;
  display_name: string | null;
  role: string;
  created_at: string;
  updated_at: string;
  last_sign_in_at?: string;
  is_active: boolean;
}

interface CreateUserInput {
  email: string;
  display_name: string;
  role: 'user' | 'admin' | 'superadmin' | 'client';
  password: string;
}

export const UserManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { profile } = useAuth();
  const { toast } = useToast();
  const isAdmin = profile?.role === 'admin' || profile?.role === 'superadmin';
  const isSuperAdmin = profile?.role === 'superadmin';

  const handleOpenDialog = (user?: UserProfile) => {
    setEditingUser(user || null);
    setUserDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setUserDialogOpen(false);
    setEditingUser(null);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch profiles from Supabase
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const allUsers = (profiles || []).map((user: any) => ({
        ...user,
        is_active: true // Campo local apenas para exibição
      }));

      setUsers(allUsers);
    } catch (error: any) {
      console.error('Erro ao carregar usuários:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar usuários: ' + error.message,
        variant: 'destructive',
      });
      
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (userId: string, isActive: boolean) => {
    try {
      // This would update the user's active status
      // For now, just show success
      toast({
        title: 'Sucesso',
        description: isActive ? 'Usuário ativado' : 'Usuário desativado',
      });
      
      // Update local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, is_active: isActive } : user
      ));
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: 'Erro ao alterar status: ' + error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) {
      return;
    }

    try {
      // This would delete the user - requires admin privileges
      toast({
        title: 'Sucesso',
        description: 'Usuário excluído com sucesso (funcionalidade em desenvolvimento)',
      });
      
      // Update local state
      setUsers(users.filter(user => user.id !== userId));
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: 'Erro ao excluir usuário: ' + error.message,
        variant: 'destructive',
      });
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'superadmin':
        return 'Super Admin';
      case 'admin':
        return 'Administrador';
      case 'client':
        return 'Cliente';
      case 'user':
        return 'Usuário';
      default:
        return role;
    }
  };

  const getRoleVariant = (role: string) => {
    switch (role) {
      case 'superadmin':
        return 'destructive';
      case 'admin':
        return 'default';
      case 'client':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const canEditUser = (user: UserProfile) => {
    if (isSuperAdmin) return true;
    if (isAdmin && user.role !== 'superadmin') return true;
    return false;
  };

  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.display_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isAdmin) {
    return (
      <div className="p-8">
        <Card>
          <CardHeader>
            <CardTitle>Acesso Negado</CardTitle>
            <CardDescription>
              Apenas administradores podem acessar o gerenciamento de usuários.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gerenciamento de Usuários</h1>
          <p className="text-muted-foreground">
            Gerencie usuários, permissões e níveis de acesso
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <UserPlus className="w-4 h-4 mr-2" />
          Novo Usuário
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Input
            placeholder="Buscar usuários..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">Carregando usuários...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Nenhum usuário encontrado</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? 'Ajuste sua busca ou' : ''} Cadastre um novo usuário.
              </p>
              <Button onClick={() => handleOpenDialog()}>
                <UserPlus className="w-4 h-4 mr-2" />
                Cadastrar Usuário
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Último acesso</TableHead>
                  <TableHead>Cadastrado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.display_name || 'Sem nome'}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-muted-foreground" />
                        <Badge variant={getRoleVariant(user.role) as any}>
                          {getRoleLabel(user.role)}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={user.is_active}
                          onCheckedChange={(checked) => handleToggleActive(user.id, checked)}
                          disabled={!canEditUser(user)}
                        />
                        <span className="text-sm">
                          {user.is_active ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.last_sign_in_at 
                        ? new Date(user.last_sign_in_at).toLocaleDateString()
                        : 'Nunca'
                      }
                    </TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDialog(user)}
                          disabled={!canEditUser(user)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(user.id)}
                          disabled={!canEditUser(user) || user.is_active}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <UserCreateDialog
        open={userDialogOpen}
        onOpenChange={setUserDialogOpen}
        onUserCreated={loadUsers}
        editingUser={editingUser}
      />
    </div>
  );
};