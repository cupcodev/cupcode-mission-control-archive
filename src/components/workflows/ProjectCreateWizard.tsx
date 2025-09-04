import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, ArrowRight, Check, X } from 'lucide-react';
import { templatesRepo, instancesRepo, tasksRepo } from '@/data/mc';
import { clientsRepo, servicesCatalogRepo } from '@/data/core';
import { useToast } from '@/hooks/use-toast';
import { generateInitialTasks } from '@/lib/workflow-engine';
import type { WorkflowTemplate } from '@/types/mc';
import type { Client } from '@/data/core/clientsRepo';
import type { ServiceCatalog } from '@/data/core/servicesCatalogRepo';

interface ProjectData {
  templateId: string;
  clientId: string;
  serviceId: string;
  projectName: string;
  projectCode: string;
  notes: string;
  tags: string[];
}

const STEPS = ['Template', 'Cliente/Serviço', 'Informações', 'Revisão'];

export const ProjectCreateWizard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<ServiceCatalog[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(null);
  const [tagInput, setTagInput] = useState('');
  
  const [projectData, setProjectData] = useState<ProjectData>({
    templateId: '',
    clientId: '',
    serviceId: '',
    projectName: '',
    projectCode: '',
    notes: '',
    tags: []
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [templatesData, clientsData, servicesData] = await Promise.all([
        templatesRepo.listActive(),
        clientsRepo.list(),
        servicesCatalogRepo.list()
      ]);
      
      setTemplates(templatesData);
      setClients(clientsData);
      setServices(servicesData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados. Verifique sua conexão.",
        variant: "destructive"
      });
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    setSelectedTemplate(template || null);
    setProjectData(prev => ({ ...prev, templateId }));
  };

  const addTag = () => {
    if (tagInput.trim() && !projectData.tags.includes(tagInput.trim())) {
      setProjectData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setProjectData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: return projectData.templateId;
      case 1: return projectData.clientId && projectData.serviceId;
      case 2: return projectData.projectName.trim().length >= 3;
      case 3: return true;
      default: return false;
    }
  };

  const handleCreate = async () => {
    if (!canProceed()) return;
    
    setLoading(true);
    try {
      // Validações finais
      if (projectData.projectName.length < 3 || projectData.projectName.length > 120) {
        throw new Error('Nome do projeto deve ter entre 3 e 120 caracteres');
      }

      // Criar instância
      const variables = {
        project_name: projectData.projectName,
        project_code: projectData.projectCode || null,
        notes: projectData.notes || null,
        tags: projectData.tags,
        client_id: projectData.clientId,
        service_id: projectData.serviceId
      };

      const instance = await instancesRepo.createFromTemplate(
        projectData.templateId,
        variables
      );

      // Adicionar participante (criador como PO)
      await instancesRepo.addParticipant(
        instance.id,
        instance.created_by,
        'PO',
        false
      );

      // Gerar tarefas iniciais
      if (selectedTemplate?.spec) {
        const initialTasks = generateInitialTasks(selectedTemplate.spec, instance.id);
        
        for (const taskInput of initialTasks) {
          await tasksRepo.create(taskInput);
        }
      }

      toast({
        title: "Projeto criado!",
        description: `${projectData.projectName} foi criado com sucesso.`
      });

      navigate(`/app/workflows/instances/${instance.id}/board`);
    } catch (error: any) {
      console.error('Error creating project:', error);
      toast({
        title: "Erro ao criar projeto",
        description: error.message || "Erro desconhecido. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedClient = clients.find(c => c.id === projectData.clientId);
  const selectedService = services.find(s => s.id === projectData.serviceId);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/app/projects')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar</span>
          </Button>
          <div>
            <h1 className="text-3xl font-tomorrow font-bold">Novo Projeto</h1>
            <p className="text-muted-foreground">Crie um novo projeto baseado em template</p>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="flex items-center justify-between mb-8">
        {STEPS.map((step, index) => (
          <div key={step} className="flex items-center">
            <div className={`
              flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-medium
              ${index <= currentStep 
                ? 'bg-primary text-primary-foreground border-primary' 
                : 'border-border text-muted-foreground'
              }
            `}>
              {index < currentStep ? <Check className="h-4 w-4" /> : index + 1}
            </div>
            <span className={`ml-2 text-sm ${index <= currentStep ? 'text-foreground' : 'text-muted-foreground'}`}>
              {step}
            </span>
            {index < STEPS.length - 1 && (
              <div className={`h-px w-16 ml-4 ${index < currentStep ? 'bg-primary' : 'bg-border'}`} />
            )}
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{STEPS[currentStep]}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Etapa 0: Template */}
          {currentStep === 0 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="template">Selecione um template</Label>
                <Select value={projectData.templateId} onValueChange={handleTemplateSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha um template..." />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map(template => (
                      <SelectItem key={template.id} value={template.id}>
                        <div>
                          <div className="font-medium">{template.name}</div>
                          <div className="text-sm text-muted-foreground">
                            v{template.version} • {template.domain}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedTemplate && (
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Preview do Template</h4>
                  <div className="text-sm space-y-1">
                    <p><strong>Nome:</strong> {selectedTemplate.name}</p>
                    <p><strong>Versão:</strong> {selectedTemplate.version}</p>
                    <p><strong>Domínio:</strong> {selectedTemplate.domain}</p>
                    <p><strong>Nós:</strong> {selectedTemplate.spec?.nodes?.length || 0} etapas</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Etapa 1: Cliente/Serviço */}
          {currentStep === 1 && (
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="client">Cliente</Label>
                <Select value={projectData.clientId} onValueChange={(value) => 
                  setProjectData(prev => ({ ...prev, clientId: value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cliente..." />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map(client => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.display_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="service">Serviço</Label>
                <Select value={projectData.serviceId} onValueChange={(value) => 
                  setProjectData(prev => ({ ...prev, serviceId: value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o serviço..." />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map(service => (
                      <SelectItem key={service.id} value={service.id}>
                        <div>
                          <div className="font-medium">{service.name}</div>
                          {service.description && (
                            <div className="text-sm text-muted-foreground">
                              {service.description}
                            </div>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Etapa 2: Informações */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="projectName">Nome do Projeto *</Label>
                <Input
                  id="projectName"
                  value={projectData.projectName}
                  onChange={(e) => setProjectData(prev => ({ ...prev, projectName: e.target.value }))}
                  placeholder="Digite o nome do projeto..."
                  className="mt-1"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Entre 3 e 120 caracteres
                </p>
              </div>

              <div>
                <Label htmlFor="projectCode">Código do Projeto (opcional)</Label>
                <Input
                  id="projectCode"
                  value={projectData.projectCode}
                  onChange={(e) => setProjectData(prev => ({ ...prev, projectCode: e.target.value }))}
                  placeholder="Ex: PROJ2024-001"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="notes">Observações (opcional)</Label>
                <Textarea
                  id="notes"
                  value={projectData.notes}
                  onChange={(e) => setProjectData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Informações adicionais sobre o projeto..."
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Tags (opcional)</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Adicionar tag..."
                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  />
                  <Button type="button" size="sm" onClick={addTag}>
                    Adicionar
                  </Button>
                </div>
                {projectData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {projectData.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="flex items-center space-x-1">
                        <span>{tag}</span>
                        <X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(tag)} />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Etapa 3: Revisão */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h4 className="font-medium text-lg mb-4">Resumo do Projeto</h4>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Template</p>
                      <p>{selectedTemplate?.name} (v{selectedTemplate?.version})</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Cliente</p>
                      <p>{selectedClient?.display_name}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Serviço</p>
                      <p>{selectedService?.name}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Nome do Projeto</p>
                      <p>{projectData.projectName}</p>
                    </div>
                    
                    {projectData.projectCode && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Código</p>
                        <p>{projectData.projectCode}</p>
                      </div>
                    )}
                    
                    {projectData.tags.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Tags</p>
                        <div className="flex flex-wrap gap-1">
                          {projectData.tags.map(tag => (
                            <Badge key={tag} variant="outline">{tag}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {projectData.notes && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-muted-foreground">Observações</p>
                    <p className="text-sm bg-muted p-3 rounded-md">{projectData.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 0}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Anterior
        </Button>

        {currentStep < STEPS.length - 1 ? (
          <Button
            onClick={handleNext}
            disabled={!canProceed()}
          >
            Próximo
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={handleCreate}
            disabled={!canProceed() || loading}
          >
            {loading ? 'Criando...' : 'Criar Projeto'}
          </Button>
        )}
      </div>
    </div>
  );
};