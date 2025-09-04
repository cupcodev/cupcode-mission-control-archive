import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Eye, Edit, Copy, Play, Power, PowerOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { templatesRepo, type WorkflowTemplate } from '@/data/mc';
import { RequireRole } from '@/components/RequireRole';
import { useNavigate } from 'react-router-dom';
import { InstanceStartDialog } from '@/components/workflows/InstanceStartDialog';

export const WorkflowTemplates = () => {
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(null);
  const [showInstanceDialog, setShowInstanceDialog] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await templatesRepo.listActive();
      setTemplates(data);
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os templates.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.domain.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && template.is_active) ||
                         (statusFilter === 'inactive' && !template.is_active);
    return matchesSearch && matchesStatus;
  });

  const handleDuplicate = async (template: WorkflowTemplate) => {
    try {
      const newTemplate = await templatesRepo.create({
        name: `${template.name} (v${template.version + 1})`,
        version: template.version + 1,
        domain: template.domain,
        spec: template.spec,
        is_active: false
      });
      setTemplates([newTemplate, ...templates]);
      toast({
        title: 'Sucesso',
        description: 'Nova versão do template criada com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao duplicar template:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível duplicar o template.',
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async (template: WorkflowTemplate) => {
    try {
      const updated = await templatesRepo.update(template.id, {
        is_active: !template.is_active
      });
      setTemplates(templates.map(t => t.id === template.id ? updated : t));
      toast({
        title: 'Sucesso',
        description: `Template ${updated.is_active ? 'ativado' : 'desativado'} com sucesso.`,
      });
    } catch (error) {
      console.error('Erro ao alterar status do template:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível alterar o status do template.',
        variant: 'destructive',
      });
    }
  };

  const handleStartInstance = (template: WorkflowTemplate) => {
    setSelectedTemplate(template);
    setShowInstanceDialog(true);
  };

  return (
    <RequireRole minRole="admin">
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Templates de Workflow</h1>
            <p className="text-muted-foreground">
              Gerencie templates de workflow para automatizar processos
            </p>
          </div>
          <Button onClick={() => navigate('/app/workflows/templates/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Template
          </Button>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome ou domínio..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={(value: 'all' | 'active' | 'inactive') => setStatusFilter(value)}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="inactive">Inativos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Templates */}
        <Card>
          <CardHeader>
            <CardTitle>Templates ({filteredTemplates.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Carregando templates...</div>
            ) : filteredTemplates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum template encontrado
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Versão</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Domínio</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTemplates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium">{template.name}</TableCell>
                      <TableCell>v{template.version}</TableCell>
                      <TableCell>
                        <Badge variant={template.is_active ? 'default' : 'secondary'}>
                          {template.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell>{template.domain}</TableCell>
                      <TableCell>
                        {new Date(template.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              ••• 
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/app/workflows/templates/${template.id}`)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Ver
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/app/workflows/templates/${template.id}/edit`)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicate(template)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicar como nova versão
                            </DropdownMenuItem>
                            {template.is_active && (
                              <DropdownMenuItem onClick={() => handleStartInstance(template)}>
                                <Play className="h-4 w-4 mr-2" />
                                Iniciar instância
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleToggleActive(template)}>
                              {template.is_active ? (
                                <>
                                  <PowerOff className="h-4 w-4 mr-2" />
                                  Desativar
                                </>
                              ) : (
                                <>
                                  <Power className="h-4 w-4 mr-2" />
                                  Ativar
                                </>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {selectedTemplate && (
          <InstanceStartDialog
            template={selectedTemplate}
            open={showInstanceDialog}
            onOpenChange={setShowInstanceDialog}
            onSuccess={() => {
              setShowInstanceDialog(false);
              setSelectedTemplate(null);
              toast({
                title: 'Sucesso',
                description: 'Instância criada com sucesso.',
              });
            }}
          />
        )}
      </div>
    </RequireRole>
  );
};