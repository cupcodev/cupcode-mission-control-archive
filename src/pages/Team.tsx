import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { rolesRepo, Role, RoleMemberWithProfile, AssignmentRule, CreateRoleInput } from '@/data/mc/rolesRepo';
import { Users, Plus, Trash2, Settings, RotateCcw, ChevronUp, ChevronDown } from 'lucide-react';
import { UserManagement } from './UserManagement';
import { ClientsManagement } from './ClientsManagement';

export const Team = () => {
  const { user, profile } = useAuth();
  const userRole = profile?.role;
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [roleMembers, setRoleMembers] = useState<RoleMemberWithProfile[]>([]);
  const [assignmentRule, setAssignmentRule] = useState<AssignmentRule | null>(null);
  const [loading, setLoading] = useState(true);
  const [newRoleDialog, setNewRoleDialog] = useState(false);
  const [addMemberDialog, setAddMemberDialog] = useState(false);
  const [newRole, setNewRole] = useState<CreateRoleInput>({ name: '', description: '' });
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('roles');

  // Handle URL tab parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    if (tab && ['roles', 'members', 'rules', 'users', 'clients'].includes(tab)) {
      setActiveTab(tab);
    }
  }, []);

  const isAdmin = userRole === 'admin' || userRole === 'superadmin';

  useEffect(() => {
    loadRoles();
  }, []);

  useEffect(() => {
    if (selectedRole) {
      loadRoleMembers(selectedRole);
      loadAssignmentRule(selectedRole);
    }
  }, [selectedRole]);

  const loadRoles = async () => {
    try {
      const data = await rolesRepo.list();
      setRoles(data);
      if (data.length > 0 && !selectedRole) {
        setSelectedRole(data[0].name);
      }
    } catch (error: any) {
      toast.error('Erro ao carregar papéis: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadRoleMembers = async (roleName: string) => {
    try {
      const members = await rolesRepo.listMembers(roleName);
      setRoleMembers(members);
    } catch (error: any) {
      toast.error('Erro ao carregar membros: ' + error.message);
    }
  };

  const loadAssignmentRule = async (roleName: string) => {
    try {
      const rule = await rolesRepo.getAssignmentRule(roleName);
      setAssignmentRule(rule);
    } catch (error: any) {
      console.warn('Could not load assignment rule:', error);
      setAssignmentRule(null);
    }
  };

  const handleCreateRole = async () => {
    if (!newRole.name.trim()) {
      toast.error('Nome do papel é obrigatório');
      return;
    }

    try {
      await rolesRepo.create(newRole);
      toast.success('Papel criado com sucesso');
      setNewRoleDialog(false);
      setNewRole({ name: '', description: '' });
      loadRoles();
    } catch (error: any) {
      toast.error('Erro ao criar papel: ' + error.message);
    }
  };

  const handleDeleteRole = async (roleName: string) => {
    if (!confirm(`Tem certeza que deseja excluir o papel "${roleName}"?`)) {
      return;
    }

    try {
      await rolesRepo.delete(roleName);
      toast.success('Papel excluído com sucesso');
      loadRoles();
      if (selectedRole === roleName) {
        setSelectedRole('');
      }
    } catch (error: any) {
      toast.error('Erro ao excluir papel: ' + error.message);
    }
  };

  const searchUsers = async () => {
    if (!searchEmail.trim()) return;

    try {
      const results = await rolesRepo.searchUsersByEmail(searchEmail);
      setSearchResults(results);
    } catch (error: any) {
      toast.error('Erro ao buscar usuários: ' + error.message);
    }
  };

  const handleAddMember = async (userId: string) => {
    try {
      await rolesRepo.addMember(selectedRole, userId);
      toast.success('Membro adicionado com sucesso');
      setAddMemberDialog(false);
      setSearchEmail('');
      setSearchResults([]);
      loadRoleMembers(selectedRole);
    } catch (error: any) {
      toast.error('Erro ao adicionar membro: ' + error.message);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    try {
      await rolesRepo.removeMember(selectedRole, userId);
      toast.success('Membro removido com sucesso');
      loadRoleMembers(selectedRole);
    } catch (error: any) {
      toast.error('Erro ao remover membro: ' + error.message);
    }
  };

  const handleToggleActive = async (userId: string, isActive: boolean) => {
    try {
      await rolesRepo.toggleMemberActive(selectedRole, userId, isActive);
      toast.success(isActive ? 'Membro ativado' : 'Membro desativado');
      loadRoleMembers(selectedRole);
    } catch (error: any) {
      toast.error('Erro ao alterar status: ' + error.message);
    }
  };

  const handleReorderMember = async (userId: string, direction: 'up' | 'down') => {
    const memberIndex = roleMembers.findIndex(m => m.user_id === userId);
    if (memberIndex === -1) return;

    const newIndex = direction === 'up' ? memberIndex - 1 : memberIndex + 1;
    if (newIndex < 0 || newIndex >= roleMembers.length) return;

    try {
      const member = roleMembers[memberIndex];
      const targetMember = roleMembers[newIndex];
      
      // Swap order indices
      await rolesRepo.reorderMember(selectedRole, member.user_id, targetMember.order_index);
      await rolesRepo.reorderMember(selectedRole, targetMember.user_id, member.order_index);
      
      toast.success('Ordem atualizada');
      loadRoleMembers(selectedRole);
    } catch (error: any) {
      toast.error('Erro ao reordenar: ' + error.message);
    }
  };

  const handleUpdateStrategy = async (strategy: 'round_robin' | 'manual') => {
    try {
      await rolesRepo.upsertAssignmentRule(selectedRole, strategy);
      toast.success('Estratégia de atribuição atualizada');
      loadAssignmentRule(selectedRole);
    } catch (error: any) {
      toast.error('Erro ao atualizar estratégia: ' + error.message);
    }
  };

  const handleResetPointer = async () => {
    try {
      await rolesRepo.resetPointer(selectedRole);
      toast.success('Ponteiro resetado');
      loadAssignmentRule(selectedRole);
    } catch (error: any) {
      toast.error('Erro ao resetar ponteiro: ' + error.message);
    }
  };

  if (loading) {
    return <div className="p-8">Carregando...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="p-8">
        <Card>
          <CardHeader>
            <CardTitle>Acesso Negado</CardTitle>
            <CardDescription>
              Apenas administradores podem acessar o gerenciamento de equipes.
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
          <h1 className="text-3xl font-bold">Gerenciamento de Equipes</h1>
          <p className="text-muted-foreground">
            Gerencie papéis, membros e regras de atribuição automática
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="roles">Papéis</TabsTrigger>
          <TabsTrigger value="members" disabled={!selectedRole}>Membros</TabsTrigger>
          <TabsTrigger value="rules" disabled={!selectedRole}>Regras de Atribuição</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="clients">Clientes</TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Papéis da Equipe</h2>
            <Dialog open={newRoleDialog} onOpenChange={setNewRoleDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Papel
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Novo Papel</DialogTitle>
                  <DialogDescription>
                    Defina um novo papel para a equipe
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nome do Papel</Label>
                    <Input
                      id="name"
                      value={newRole.name}
                      onChange={(e) => setNewRole({...newRole, name: e.target.value})}
                      placeholder="Ex: Designer, Desenvolvedor Front-end"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      value={newRole.description || ''}
                      onChange={(e) => setNewRole({...newRole, description: e.target.value})}
                      placeholder="Descrição das responsabilidades"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setNewRoleDialog(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateRole}>Criar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Membros</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles.map((role) => {
                    const memberCount = role.name === selectedRole ? roleMembers.length : 0;
                    return (
                      <TableRow 
                        key={role.name}
                        className={selectedRole === role.name ? 'bg-muted/50' : ''}
                      >
                        <TableCell className="font-medium">{role.name}</TableCell>
                        <TableCell>{role.description || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{memberCount}</Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(role.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedRole(role.name);
                                setActiveTab('members');
                              }}
                              title="Ver membros"
                            >
                              <Users className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteRole(role.name)}
                              disabled={memberCount > 0}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Gestão de Membros</h2>
            <Dialog open={addMemberDialog} onOpenChange={setAddMemberDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Membro
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Membro a um Papel</DialogTitle>
                  <DialogDescription>
                    Selecione o papel e busque por email para adicionar um membro
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Papel</Label>
                    <Select value={selectedRole} onValueChange={setSelectedRole}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um papel" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.name} value={role.name}>
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Email do usuário</Label>
                    <div className="flex gap-2">
                      <Input
                        value={searchEmail}
                        onChange={(e) => setSearchEmail(e.target.value)}
                        placeholder="usuario@exemplo.com"
                      />
                      <Button onClick={searchUsers}>Buscar</Button>
                    </div>
                  </div>
                  {searchResults.length > 0 && (
                    <div className="space-y-2">
                      <Label>Resultados:</Label>
                      {searchResults.map((user) => (
                        <div key={user.id} className="flex justify-between items-center p-2 border rounded">
                          <div>
                            <div className="font-medium">{user.display_name || user.email}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleAddMember(user.id)}
                            disabled={!selectedRole || roleMembers.some(m => m.user_id === user.id)}
                          >
                            {roleMembers.some(m => m.user_id === user.id) ? 'Já é membro' : 'Adicionar'}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {selectedRole ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Membros do papel: {selectedRole}
                  </CardTitle>
                  <CardDescription>
                    Total: {roleMembers.length} membros
                  </CardDescription>
                 </CardHeader>
                 <CardContent className="p-0">
                   <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ordem</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Adicionado em</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {roleMembers.map((member, index) => (
                        <TableRow key={member.user_id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>
                            {member.profile?.display_name || 'Usuário'}
                          </TableCell>
                          <TableCell>{member.profile?.email}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={member.is_active}
                                onCheckedChange={(checked) => handleToggleActive(member.user_id, checked)}
                              />
                              <span className="text-sm">
                                {member.is_active ? 'Ativo' : 'Inativo'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {new Date(member.added_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleReorderMember(member.user_id, 'up')}
                                disabled={index === 0}
                              >
                                <ChevronUp className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleReorderMember(member.user_id, 'down')}
                                disabled={index === roleMembers.length - 1}
                              >
                                <ChevronDown className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRemoveMember(member.user_id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Selecione um papel</h3>
                <p className="text-muted-foreground mb-4">
                  Escolha um papel na aba "Papéis" ou use o dropdown acima para gerenciar membros.
                </p>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="max-w-xs mx-auto">
                    <SelectValue placeholder="Selecione um papel" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.name} value={role.name}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="rules" className="space-y-4">
          {selectedRole && (
            <>
              <h2 className="text-xl font-semibold">Regras de Atribuição - {selectedRole}</h2>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Configuração de Atribuição
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Estratégia de Atribuição</Label>
                    <Select
                      value={assignmentRule?.strategy || 'round_robin'}
                      onValueChange={(value: 'round_robin' | 'manual') => handleUpdateStrategy(value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="round_robin">Round Robin (Automático)</SelectItem>
                        <SelectItem value="manual">Manual</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground mt-1">
                      Round Robin distribui tarefas automaticamente entre os membros ativos
                    </p>
                  </div>

                  {assignmentRule?.last_assigned_user_id && (
                    <div>
                      <Label>Último Usuário Atribuído</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">
                          {roleMembers.find(m => m.user_id === assignmentRule.last_assigned_user_id)?.profile?.display_name || 'Usuário não encontrado'}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleResetPointer}
                        >
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Resetar Ponteiro
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Próxima atribuição será para o próximo membro na ordem
                      </p>
                    </div>
                  )}

                  <div className="text-sm text-muted-foreground">
                    <p><strong>Última atualização:</strong> {assignmentRule?.updated_at ? new Date(assignmentRule.updated_at).toLocaleString() : 'Nunca'}</p>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <UserManagement />
        </TabsContent>

        <TabsContent value="clients" className="space-y-4">
          <ClientsManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};