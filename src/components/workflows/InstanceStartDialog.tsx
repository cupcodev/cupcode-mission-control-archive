import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { templatesRepo, instancesRepo, tasksRepo, type WorkflowTemplate } from '@/data/mc';
import { generateInitialTasks } from '@/lib/workflow-engine';
import { clientsRepo, servicesCatalogRepo } from '@/data/core';

interface InstanceStartDialogProps {
  template?: WorkflowTemplate;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const InstanceStartDialog = ({ 
  template, 
  open, 
  onOpenChange, 
  onSuccess 
}: InstanceStartDialogProps) => {
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(template || null);
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    client_id: '',
    service_id: '',
    variables: '{}'
  });
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      if (!template) {
        loadTemplates();
      }
      loadClients();
      loadServices();
    }
  }, [open, template]);

  useEffect(() => {
    if (template) {
      setSelectedTemplate(template);
    }
  }, [template]);

  const loadTemplates = async () => {
    try {
      const data = await templatesRepo.listActive();
      const activeTemplates = data.filter(t => t.is_active);
      setTemplates(activeTemplates);
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os templates.',
        variant: 'destructive',
      });
    }
  };

  const loadClients = async () => {
    try {
      const data = await clientsRepo.list();
      setClients(data);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    }
  };

  const loadServices = async () => {
    try {
      const data = await servicesCatalogRepo.listActive();
      setServices(data);
    } catch (error) {
      console.error('Erro ao carregar serviços:', error);
    }
  };

  const handleStart = async () => {
    if (!selectedTemplate) return;

    try {
      setLoading(true);

      // Validar e parsear variables
      let parsedVariables = {};
      try {
        parsedVariables = JSON.parse(formData.variables);
      } catch (error) {
        toast({
          title: 'Erro',
          description: 'JSON de variáveis inválido.',
          variant: 'destructive',
        });
        return;
      }

      // Criar instância
      const instance = await instancesRepo.createFromTemplate(
        selectedTemplate.id,
        {
          client_id: formData.client_id || undefined,
          service_id: formData.service_id || undefined,
          ...parsedVariables
        }
      );

      // Adicionar usuário atual como participante (PO)
      await instancesRepo.addParticipant(
        instance.id,
        instance.created_by,
        'PO',
        false
      );

      // Gerar tarefas iniciais
      const initialTasks = generateInitialTasks(selectedTemplate.spec, instance.id);
      for (const taskData of initialTasks) {
        await tasksRepo.create(taskData);
      }

      onSuccess();
    } catch (error) {
      console.error('Erro ao criar instância:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar a instância.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatVariables = () => {
    try {
      const parsed = JSON.parse(formData.variables);
      setFormData({ ...formData, variables: JSON.stringify(parsed, null, 2) });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'JSON inválido',
        variant: 'destructive',
      });
    }
  };

  const handleClose = () => {
    setFormData({ client_id: '', service_id: '', variables: '{}' });
    setSelectedTemplate(template || null);
    setClients([]);
    setServices([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Iniciar Nova Instância</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!template && (
            <div>
              <Label htmlFor="template">Template</Label>
              <Select
                value={selectedTemplate?.id || ''}
                onValueChange={(value) => {
                  const template = templates.find(t => t.id === value);
                  setSelectedTemplate(template || null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name} (v{template.version})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {selectedTemplate && (
            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="font-medium">{selectedTemplate.name}</div>
              <div className="text-sm text-muted-foreground">
                Versão {selectedTemplate.version} • {selectedTemplate.domain}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="client_id">Cliente</Label>
              <Select value={formData.client_id} onValueChange={(value) => setFormData({ ...formData, client_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="service_id">Serviço</Label>
              <Select value={formData.service_id} onValueChange={(value) => setFormData({ ...formData, service_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um serviço" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="variables">Variáveis (JSON)</Label>
            <Textarea
              id="variables"
              value={formData.variables}
              onChange={(e) => setFormData({ ...formData, variables: e.target.value })}
              placeholder='{"project_name": "Meu Projeto", "client_name": "Cliente"}'
              className="font-mono text-sm"
              rows={4}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={formatVariables}
              className="mt-2"
            >
              Formatar JSON
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleStart}
            disabled={!selectedTemplate || loading}
          >
            {loading ? 'Criando...' : 'Iniciar Instância'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};