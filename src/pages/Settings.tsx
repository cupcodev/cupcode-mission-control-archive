import { useState, useEffect } from 'react';
import { RequireRole } from '@/components/RequireRole';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, Save, RotateCcw, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const HelpText = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg border">
    <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
    <p className="text-sm text-muted-foreground">{children}</p>
  </div>
);

export const Settings = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('general');
  
  // General settings
  const [generalSettings, setGeneralSettings] = useState({
    orgName: 'Mission Control',
    timezone: 'America/Sao_Paulo',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h'
  });

  // SLA settings
  const [slaSettings, setSlaSettings] = useState({
    defaultTaskSla: 24,
    defaultApprovalSla: 8,
    defaultFormSla: 72,
    defaultAutomationSla: 1,
    useDueDateFallback: true,
    autoCompleteOnChecklist: false
  });

  // Board settings
  const [boardSettings, setBoardSettings] = useState({
    defaultOrder: 'priority',
    showSlaIndicators: true,
    allowManualReorder: true
  });

  // Privacy settings
  const [privacySettings, setPrivacySettings] = useState({
    defaultVisibility: 'participants',
    showEmailToClients: false
  });

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    assignment: { email: true, slack: false },
    comment: { email: true, slack: true },
    approval: { email: true, slack: true },
    slaDelay: { email: true, slack: false }
  });

  // Feature flags
  const [featureFlags, setFeatureFlags] = useState({
    dagVisual: false,
    timeTracking: false,
    publicLinks: false,
    persistentReorder: true,
    automations: false
  });

  // Load settings from localStorage
  useEffect(() => {
    const loadSettings = (key: string, setter: (value: any) => void) => {
      const stored = localStorage.getItem(`mc:settings:${key}`);
      if (stored) {
        try {
          setter(JSON.parse(stored));
        } catch (e) {
          console.warn(`Failed to parse ${key} settings:`, e);
        }
      }
    };

    loadSettings('general', setGeneralSettings);
    loadSettings('sla', setSlaSettings);
    loadSettings('board', setBoardSettings);
    loadSettings('privacy', setPrivacySettings);
    loadSettings('notif', setNotificationSettings);
    
    const storedFlags = localStorage.getItem('mc:flags');
    if (storedFlags) {
      try {
        setFeatureFlags(JSON.parse(storedFlags));
      } catch (e) {
        console.warn('Failed to parse feature flags:', e);
      }
    }
  }, []);

  const saveSettings = (key: string, data: any) => {
    localStorage.setItem(`mc:settings:${key}`, JSON.stringify(data));
    toast({
      title: "Configurações salvas",
      description: "Salvo localmente (UI apenas - não definitivo)",
    });
  };

  const resetSettings = (key: string, defaultData: any, setter: (value: any) => void) => {
    localStorage.removeItem(`mc:settings:${key}`);
    setter(defaultData);
    toast({
      title: "Configurações resetadas",
      description: "Valores padrão restaurados",
    });
  };

  return (
    <RequireRole minRole="admin">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-tomorrow font-bold">Configurações</h1>
            <p className="text-muted-foreground">
              Configurações do sistema e preferências administrativas
            </p>
          </div>
          <Badge variant="outline" className="text-orange-600 border-orange-200">
            <AlertTriangle className="h-3 w-3 mr-1" />
            UI Temporária
          </Badge>
        </div>

        <HelpText>
          As configurações são salvas localmente no navegador. A persistência definitiva no backend será implementada em etapa futura.
        </HelpText>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="general">Geral</TabsTrigger>
            <TabsTrigger value="sla">Políticas & SLAs</TabsTrigger>
            <TabsTrigger value="board">Quadro & UX</TabsTrigger>
            <TabsTrigger value="privacy">Privacidade</TabsTrigger>
            <TabsTrigger value="notifications">Notificações</TabsTrigger>
            <TabsTrigger value="flags">Feature Flags</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>Configurações Gerais</CardTitle>
                <CardDescription>
                  Configurações básicas da organização e formato de exibição
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="orgName">Nome da Organização</Label>
                  <Input
                    id="orgName"
                    value={generalSettings.orgName}
                    onChange={(e) => setGeneralSettings(prev => ({ ...prev, orgName: e.target.value }))}
                    placeholder="Ex: Cupcode Mission Control"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Fuso Horário</Label>
                  <Select value={generalSettings.timezone} onValueChange={(value) => setGeneralSettings(prev => ({ ...prev, timezone: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/Sao_Paulo">America/São_Paulo (BRT)</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Formato de Data</Label>
                    <Select value={generalSettings.dateFormat} onValueChange={(value) => setGeneralSettings(prev => ({ ...prev, dateFormat: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                        <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                        <SelectItem value="YYYY-MM-DD">YYYY-MM-DD (ISO)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Formato de Hora</Label>
                    <Select value={generalSettings.timeFormat} onValueChange={(value) => setGeneralSettings(prev => ({ ...prev, timeFormat: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="24h">24h (14:30)</SelectItem>
                        <SelectItem value="12h">12h (2:30 PM)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="pt-4 text-sm text-muted-foreground">
                  <p>Preview: {new Date().toLocaleDateString('pt-BR')} - {new Date().toLocaleTimeString('pt-BR', { hour12: generalSettings.timeFormat === '12h' })}</p>
                </div>

                <Separator />
                
                <div className="flex gap-2">
                  <Button onClick={() => saveSettings('general', generalSettings)}>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar
                  </Button>
                  <Button variant="outline" onClick={() => resetSettings('general', {
                    orgName: 'Mission Control',
                    timezone: 'America/Sao_Paulo',
                    dateFormat: 'DD/MM/YYYY',
                    timeFormat: '24h'
                  }, setGeneralSettings)}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sla">
            <Card>
              <CardHeader>
                <CardTitle>Políticas & SLAs</CardTitle>
                <CardDescription>
                  Configurações de SLA padrão e políticas de execução
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <HelpText>
                  SLAs serão aplicados automaticamente aos novos nós. Configuração definitiva será feita no backend.
                </HelpText>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="taskSla">SLA Tarefas (horas)</Label>
                    <Input
                      id="taskSla"
                      type="number"
                      value={slaSettings.defaultTaskSla}
                      onChange={(e) => setSlaSettings(prev => ({ ...prev, defaultTaskSla: parseInt(e.target.value) || 0 }))}
                    />
                    <Badge variant="outline" className="text-xs">Em breve (somente UI)</Badge>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="approvalSla">SLA Aprovações (horas)</Label>
                    <Input
                      id="approvalSla"
                      type="number"
                      value={slaSettings.defaultApprovalSla}
                      onChange={(e) => setSlaSettings(prev => ({ ...prev, defaultApprovalSla: parseInt(e.target.value) || 0 }))}
                    />
                    <Badge variant="outline" className="text-xs">Em breve (somente UI)</Badge>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="formSla">SLA Formulários (horas)</Label>
                    <Input
                      id="formSla"
                      type="number"
                      value={slaSettings.defaultFormSla}
                      onChange={(e) => setSlaSettings(prev => ({ ...prev, defaultFormSla: parseInt(e.target.value) || 0 }))}
                    />
                    <Badge variant="outline" className="text-xs">Em breve (somente UI)</Badge>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="automationSla">SLA Automações (horas)</Label>
                    <Input
                      id="automationSla"
                      type="number"
                      value={slaSettings.defaultAutomationSla}
                      onChange={(e) => setSlaSettings(prev => ({ ...prev, defaultAutomationSla: parseInt(e.target.value) || 0 }))}
                    />
                    <Badge variant="outline" className="text-xs">Em breve (somente UI)</Badge>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="dueDateFallback" className="text-base">
                        Usar due_at quando SLA não definido
                      </Label>
                      <div className="text-sm text-muted-foreground">
                        Considera data de vencimento quando sla_hours não existir
                      </div>
                    </div>
                    <Switch
                      id="dueDateFallback"
                      checked={slaSettings.useDueDateFallback}
                      onCheckedChange={(checked) => setSlaSettings(prev => ({ ...prev, useDueDateFallback: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="autoComplete" className="text-base">
                        Auto-concluir com checklist
                      </Label>
                      <div className="text-sm text-muted-foreground">
                        Mover para "done" ao concluir todos os itens do checklist
                      </div>
                    </div>
                    <Switch
                      id="autoComplete"
                      checked={slaSettings.autoCompleteOnChecklist}
                      onCheckedChange={(checked) => setSlaSettings(prev => ({ ...prev, autoCompleteOnChecklist: checked }))}
                    />
                  </div>
                </div>

                <Separator />
                
                <div className="flex gap-2">
                  <Button onClick={() => saveSettings('sla', slaSettings)}>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar
                  </Button>
                  <Button variant="outline" onClick={() => resetSettings('sla', {
                    defaultTaskSla: 24,
                    defaultApprovalSla: 8,
                    defaultFormSla: 72,
                    defaultAutomationSla: 1,
                    useDueDateFallback: true,
                    autoCompleteOnChecklist: false
                  }, setSlaSettings)}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="board">
            <Card>
              <CardHeader>
                <CardTitle>Quadro & UX</CardTitle>
                <CardDescription>
                  Configurações de visualização e comportamento do quadro Kanban
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-base">Ordem padrão dos cards</Label>
                  <div className="space-y-2">
                    {[
                      { value: 'priority', label: 'Prioridade' },
                      { value: 'due_date', label: 'Data de vencimento' },
                      { value: 'created_at', label: 'Data de criação' }
                    ].map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id={option.value}
                          name="defaultOrder"
                          value={option.value}
                          checked={boardSettings.defaultOrder === option.value}
                          onChange={(e) => setBoardSettings(prev => ({ ...prev, defaultOrder: e.target.value }))}
                          className="h-4 w-4 text-primary"
                        />
                        <Label htmlFor={option.value}>{option.label}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Mostrar indicadores de SLA</Label>
                      <div className="text-sm text-muted-foreground">
                        Exibe badges coloridos para status de SLA nos cards
                      </div>
                    </div>
                    <Switch
                      checked={boardSettings.showSlaIndicators}
                      onCheckedChange={(checked) => setBoardSettings(prev => ({ ...prev, showSlaIndicators: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Permitir reordenação manual</Label>
                      <div className="text-sm text-muted-foreground">
                        Usuários podem arrastar cards dentro da coluna (fields.order)
                      </div>
                    </div>
                    <Switch
                      checked={boardSettings.allowManualReorder}
                      onCheckedChange={(checked) => setBoardSettings(prev => ({ ...prev, allowManualReorder: checked }))}
                    />
                  </div>
                </div>

                <Separator />
                
                <div className="flex gap-2">
                  <Button onClick={() => saveSettings('board', boardSettings)}>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar
                  </Button>
                  <Button variant="outline" onClick={() => resetSettings('board', {
                    defaultOrder: 'priority',
                    showSlaIndicators: true,
                    allowManualReorder: true
                  }, setBoardSettings)}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="privacy">
            <Card>
              <CardHeader>
                <CardTitle>Privacidade & Acesso</CardTitle>
                <CardDescription>
                  Configurações de visibilidade e acesso às informações
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-base">Visibilidade padrão das instâncias</Label>
                  <div className="space-y-2">
                    {[
                      { value: 'participants', label: 'Apenas participantes', desc: 'Somente usuários atribuídos podem ver' },
                      { value: 'team', label: 'Equipe interna', desc: 'Todos os colaboradores podem ver' },
                      { value: 'admin', label: 'Admin+', desc: 'Apenas administradores podem ver' }
                    ].map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id={option.value}
                          name="defaultVisibility"
                          value={option.value}
                          checked={privacySettings.defaultVisibility === option.value}
                          onChange={(e) => setPrivacySettings(prev => ({ ...prev, defaultVisibility: e.target.value }))}
                          className="h-4 w-4 text-primary"
                        />
                        <div>
                          <Label htmlFor={option.value}>{option.label}</Label>
                          <div className="text-xs text-muted-foreground">{option.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Badge variant="outline" className="text-xs">Descritivo - não vinculante</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Exibir e-mail para clientes</Label>
                    <div className="text-sm text-muted-foreground">
                      Clientes podem ver e-mails dos responsáveis
                    </div>
                  </div>
                  <Switch
                    checked={privacySettings.showEmailToClients}
                    onCheckedChange={(checked) => setPrivacySettings(prev => ({ ...prev, showEmailToClients: checked }))}
                  />
                </div>

                <Separator />
                
                <div className="flex gap-2">
                  <Button onClick={() => saveSettings('privacy', privacySettings)}>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar
                  </Button>
                  <Button variant="outline" onClick={() => resetSettings('privacy', {
                    defaultVisibility: 'participants',
                    showEmailToClients: false
                  }, setPrivacySettings)}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notificações (UI)</CardTitle>
                <CardDescription>
                  Configurações de notificações por evento e canal
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <HelpText>
                  Preview das notificações. O disparo real será implementado no backend.
                </HelpText>

                <div className="space-y-4">
                  {Object.entries(notificationSettings).map(([event, channels]) => (
                    <div key={event} className="border rounded-lg p-4">
                      <h4 className="font-medium mb-3 capitalize">
                        {event.replace(/([A-Z])/g, ' $1').trim()}
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center justify-between">
                          <Label htmlFor={`${event}-email`}>Email</Label>
                          <Switch
                            id={`${event}-email`}
                            checked={channels.email}
                            onCheckedChange={(checked) => 
                              setNotificationSettings(prev => ({
                                ...prev,
                                [event]: { ...prev[event], email: checked }
                              }))
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor={`${event}-slack`}>Slack</Label>
                          <Switch
                            id={`${event}-slack`}
                            checked={channels.slack}
                            onCheckedChange={(checked) => 
                              setNotificationSettings(prev => ({
                                ...prev,
                                [event]: { ...prev[event], slack: checked }
                              }))
                            }
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Button 
                  variant="outline" 
                  onClick={() => toast({
                    title: "Preview de notificação",
                    description: "Em breve - será implementado no backend",
                  })}
                >
                  Testar Notificação
                </Button>

                <Separator />
                
                <div className="flex gap-2">
                  <Button onClick={() => saveSettings('notif', notificationSettings)}>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar
                  </Button>
                  <Button variant="outline" onClick={() => resetSettings('notif', {
                    assignment: { email: true, slack: false },
                    comment: { email: true, slack: true },
                    approval: { email: true, slack: true },
                    slaDelay: { email: true, slack: false }
                  }, setNotificationSettings)}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="flags">
            <Card>
              <CardHeader>
                <CardTitle>Feature Flags (UI)</CardTitle>
                <CardDescription>
                  Funcionalidades experimentais - controladas localmente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <HelpText>
                  Feature flags controlam funcionalidades experimentais. Configuração local apenas.
                </HelpText>

                <div className="space-y-4">
                  {[
                    { key: 'dagVisual', label: 'Editor Visual DAG', desc: 'Interface visual para criar workflows' },
                    { key: 'timeTracking', label: 'Controle de Tempo', desc: 'Tracking de tempo por tarefa' },
                    { key: 'publicLinks', label: 'Links Públicos', desc: 'Links públicos para clientes' },
                    { key: 'persistentReorder', label: 'Reordenação Persistente', desc: 'Salvar ordem dos cards' },
                    { key: 'automations', label: 'Automações', desc: 'Nós de automação no workflow' }
                  ].map((flag) => (
                    <div key={flag.key} className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <Label className="text-base">{flag.label}</Label>
                          {featureFlags[flag.key as keyof typeof featureFlags] && (
                            <Badge variant="secondary" className="text-xs">Experimental</Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">{flag.desc}</div>
                      </div>
                      <Switch
                        checked={featureFlags[flag.key as keyof typeof featureFlags]}
                        onCheckedChange={(checked) => {
                          const newFlags = { ...featureFlags, [flag.key]: checked };
                          setFeatureFlags(newFlags);
                          localStorage.setItem('mc:flags', JSON.stringify(newFlags));
                        }}
                      />
                    </div>
                  ))}
                </div>

                <Separator />
                
                <div className="flex gap-2">
                  <Button onClick={() => {
                    localStorage.setItem('mc:flags', JSON.stringify(featureFlags));
                    toast({
                      title: "Feature flags salvos",
                      description: "Configurações experimentais atualizadas",
                    });
                  }}>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar
                  </Button>
                  <Button variant="outline" onClick={() => {
                    const defaultFlags = {
                      dagVisual: false,
                      timeTracking: false,
                      publicLinks: false,
                      persistentReorder: true,
                      automations: false
                    };
                    setFeatureFlags(defaultFlags);
                    localStorage.setItem('mc:flags', JSON.stringify(defaultFlags));
                    toast({
                      title: "Feature flags resetados",
                      description: "Valores padrão restaurados",
                    });
                  }}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </RequireRole>
  );
};