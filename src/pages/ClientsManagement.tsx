import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Users, Briefcase } from 'lucide-react';
import { clientsRepo, servicesCatalogRepo, clientServicesRepo } from '@/data/core';
import { useToast } from '@/hooks/use-toast';
import { ClientCreateDialog } from '@/components/workflows/ClientCreateDialog';
import { ClientEditDialog } from '@/components/clients/ClientEditDialog';
import { ClientServicesDialog } from '@/components/clients/ClientServicesDialog';

export const ClientsManagement = () => {
  const [clients, setClients] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [servicesByClient, setServicesByClient] = useState<Record<string, any[]>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any | null>(null);
  const [servicesClient, setServicesClient] = useState<any | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [clientsData, servicesData] = await Promise.all([
        clientsRepo.list(),
        servicesCatalogRepo.listActive()
      ]);
      
      setClients(clientsData);
      setServices(servicesData);

      // Load contracted services per client (removes mock data)
      const map: Record<string, any[]> = {};
      await Promise.all(
        (clientsData || []).map(async (c: any) => {
          try {
            const list = await clientServicesRepo.listByClient(c.id);
            map[c.id] = list;
          } catch (e) {
            map[c.id] = [];
          }
        })
      );
      setServicesByClient(map);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados dos clientes.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter(client =>
    client.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.legal_name && client.legal_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestão de Clientes</h1>
            <p className="text-muted-foreground">
              Gerencie clientes e serviços contratados
            </p>
          </div>
        </div>
        <div className="text-center py-8">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Clientes</h1>
          <p className="text-muted-foreground">
            Gerencie clientes e serviços contratados
          </p>
        </div>
        <Button onClick={() => setClientDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Cliente
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <Search className="w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar clientes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredClients.map((client) => (
          <Card key={client.id} className="relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{client.display_name}</CardTitle>
                <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>
                  {client.status === 'active' ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
              {client.legal_name && (
                <p className="text-sm text-muted-foreground">{client.legal_name}</p>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {client.tax_id && (
                <div>
                  <Label className="text-xs text-muted-foreground">CNPJ/CPF</Label>
                  <p className="text-sm">{client.tax_id}</p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">0 usuários</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Briefcase className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {(servicesByClient[client.id]?.length ?? 0)} serviços
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Serviços Contratados</Label>
                <div className="flex flex-wrap gap-1">
                  {(servicesByClient[client.id] ?? []).map((service) => (
                    <Badge key={service.id} variant="outline" className="text-xs">
                      {service.service_name}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex space-x-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => setEditingClient(client)}>
                  Editar
                </Button>
                <Button variant="outline" size="sm" className="flex-1" onClick={() => setServicesClient(client)}>
                  Serviços
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredClients.length === 0 && searchTerm && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            Nenhum cliente encontrado para "{searchTerm}"
          </p>
        </div>
      )}

      {clients.length === 0 && !searchTerm && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            Nenhum cliente cadastrado ainda.
          </p>
          <Button className="mt-4" onClick={() => setClientDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Cadastrar Primeiro Cliente
          </Button>
        </div>
      )}

      <ClientCreateDialog
        open={clientDialogOpen}
        onOpenChange={setClientDialogOpen}
        onClientCreated={loadData}
      />

      <ClientEditDialog
        open={!!editingClient}
        client={editingClient}
        onOpenChange={(open) => { if (!open) setEditingClient(null); }}
        onSaved={() => { setEditingClient(null); loadData(); }}
      />

      <ClientServicesDialog
        open={!!servicesClient}
        client={servicesClient}
        onOpenChange={(open) => { if (!open) setServicesClient(null); }}
        onSaved={() => { setServicesClient(null); loadData(); }}
      />
    </div>
  );
};