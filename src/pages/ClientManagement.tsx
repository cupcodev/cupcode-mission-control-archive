import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { Plus, Edit, Trash2, Building, Phone, Mail, MapPin } from 'lucide-react';

interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  address?: string;
  notes?: string;
  created_at: string;
  created_by: string;
  is_active: boolean;
}

interface CreateClientInput {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  address?: string;
  notes?: string;
}

// Mock repository - in real implementation, this would connect to Supabase
class ClientsRepository {
  private clients: Client[] = [
    {
      id: '1',
      name: 'João Silva',
      email: 'joao@empresa.com',
      phone: '(11) 99999-9999',
      company: 'Empresa XYZ Ltda',
      address: 'Rua das Flores, 123 - São Paulo/SP',
      notes: 'Cliente desde 2023, preferências por projetos web',
      created_at: new Date().toISOString(),
      created_by: 'admin',
      is_active: true
    },
    {
      id: '2',
      name: 'Maria Santos',
      email: 'maria@startup.com',
      phone: '(21) 88888-8888',
      company: 'Startup Inovadora',
      address: 'Av. Principal, 456 - Rio de Janeiro/RJ',
      notes: 'Foco em desenvolvimento mobile',
      created_at: new Date().toISOString(),
      created_by: 'admin',
      is_active: true
    }
  ];

  async list(): Promise<Client[]> {
    return Promise.resolve([...this.clients]);
  }

  async create(input: CreateClientInput): Promise<Client> {
    const newClient: Client = {
      id: Math.random().toString(36).substr(2, 9),
      ...input,
      created_at: new Date().toISOString(),
      created_by: 'current-user', // In real implementation, get from auth
      is_active: true
    };
    
    this.clients.push(newClient);
    return Promise.resolve(newClient);
  }

  async update(id: string, input: Partial<CreateClientInput>): Promise<Client> {
    const index = this.clients.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Cliente não encontrado');
    
    this.clients[index] = { ...this.clients[index], ...input };
    return Promise.resolve(this.clients[index]);
  }

  async delete(id: string): Promise<void> {
    const index = this.clients.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Cliente não encontrado');
    
    this.clients.splice(index, 1);
    return Promise.resolve();
  }

  async toggleActive(id: string, isActive: boolean): Promise<Client> {
    const index = this.clients.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Cliente não encontrado');
    
    this.clients[index].is_active = isActive;
    return Promise.resolve(this.clients[index]);
  }
}

const clientsRepo = new ClientsRepository();

export const ClientManagement = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<CreateClientInput>({
    name: '',
    email: '',
    phone: '',
    company: '',
    address: '',
    notes: ''
  });

  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin' || profile?.role === 'superadmin';

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      const data = await clientsRepo.list();
      setClients(data);
    } catch (error: any) {
      toast.error('Erro ao carregar clientes: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      company: '',
      address: '',
      notes: ''
    });
    setEditingClient(null);
  };

  const handleOpenDialog = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setFormData({
        name: client.name,
        email: client.email,
        phone: client.phone || '',
        company: client.company || '',
        address: client.address || '',
        notes: client.notes || ''
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    resetForm();
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error('Nome e email são obrigatórios');
      return;
    }

    try {
      if (editingClient) {
        await clientsRepo.update(editingClient.id, formData);
        toast.success('Cliente atualizado com sucesso');
      } else {
        await clientsRepo.create(formData);
        toast.success('Cliente criado com sucesso');
      }
      
      handleCloseDialog();
      loadClients();
    } catch (error: any) {
      toast.error('Erro ao salvar cliente: ' + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) {
      return;
    }

    try {
      await clientsRepo.delete(id);
      toast.success('Cliente excluído com sucesso');
      loadClients();
    } catch (error: any) {
      toast.error('Erro ao excluir cliente: ' + error.message);
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await clientsRepo.toggleActive(id, isActive);
      toast.success(isActive ? 'Cliente ativado' : 'Cliente desativado');
      loadClients();
    } catch (error: any) {
      toast.error('Erro ao alterar status: ' + error.message);
    }
  };

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.company?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isAdmin) {
    return (
      <div className="p-8">
        <Card>
          <CardHeader>
            <CardTitle>Acesso Negado</CardTitle>
            <CardDescription>
              Apenas administradores podem acessar o gerenciamento de clientes.
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
          <h1 className="text-3xl font-bold">Gerenciamento de Clientes</h1>
          <p className="text-muted-foreground">
            Gerencie informações e dados de contato dos clientes
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Cliente
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Input
            placeholder="Buscar clientes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">Carregando clientes...</div>
          ) : filteredClients.length === 0 ? (
            <div className="p-8 text-center">
              <Building className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Nenhum cliente encontrado</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? 'Ajuste sua busca ou' : ''} Cadastre seu primeiro cliente.
              </p>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Cadastrar Cliente
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Cadastrado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        {client.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      {client.company ? (
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-muted-foreground" />
                          {client.company}
                        </div>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {client.phone ? (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          {client.phone}
                        </div>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={client.is_active ? 'default' : 'secondary'}>
                        {client.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(client.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDialog(client)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleActive(client.id, !client.is_active)}
                        >
                          {client.is_active ? 'Desativar' : 'Ativar'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(client.id)}
                          disabled={client.is_active}
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

      <Dialog open={dialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingClient ? 'Editar Cliente' : 'Novo Cliente'}
            </DialogTitle>
            <DialogDescription>
              {editingClient ? 'Atualize as informações do cliente.' : 'Cadastre um novo cliente no sistema.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome completo"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@exemplo.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(11) 99999-9999"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="company">Empresa</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="Nome da empresa"
              />
            </div>
            
            <div className="col-span-2 space-y-2">
              <Label htmlFor="address">Endereço</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Endereço completo"
              />
            </div>
            
            <div className="col-span-2 space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Observações e notas sobre o cliente"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>
              {editingClient ? 'Atualizar' : 'Cadastrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};