import { useState, useEffect } from 'react';
import { RequireRole } from '@/components/RequireRole';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, ExternalLink, Copy, CheckCircle, XCircle, Clock, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const HelpText = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg border">
    <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
    <p className="text-sm text-muted-foreground">{children}</p>
  </div>
);

const StatusBadge = ({ connected }: { connected: boolean }) => (
  <Badge variant={connected ? "default" : "secondary"} className="gap-1">
    {connected ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
    {connected ? "Conectado" : "Desconectado"}
  </Badge>
);

const ComingSoonBadge = () => (
  <Badge variant="outline" className="text-orange-600 border-orange-200">
    <Clock className="h-3 w-3 mr-1" />
    Em breve
  </Badge>
);

const CopyButton = ({ text, label }: { text: string; label: string }) => {
  const { toast } = useToast();
  
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: `${label} copiado para a área de transferência`,
    });
  };

  return (
    <Button variant="outline" size="sm" onClick={handleCopy}>
      <Copy className="h-4 w-4 mr-2" />
      Copiar {label}
    </Button>
  );
};

export const Integrations = () => {
  const { toast } = useToast();
  
  // Integration statuses (local state)
  const [integrations, setIntegrations] = useState({
    slack: { connected: false, botToken: '', signingSecret: '' },
    github: { connected: false, owner: '', repo: '', scopes: 'read' },
    gitlab: { connected: false, owner: '', repo: '', scopes: 'read' },
    linear: { connected: false, workspace: '', teamMapping: {} },
    jira: { connected: false, project: '', teamMapping: {} },
    telescup: { baseUrl: 'https://app.telescup.com/deep-link/***' },
    googleDrive: { connected: false, defaultFolder: '', createFolderPerInstance: true }
  });

  const [webhookSettings, setWebhookSettings] = useState({
    outboundUrl: '',
    apiTokenGenerated: false
  });

  // Load from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('mc:integrations');
    if (stored) {
      try {
        setIntegrations(JSON.parse(stored));
      } catch (e) {
        console.warn('Failed to parse integrations:', e);
      }
    }
  }, []);

  const saveIntegrations = () => {
    localStorage.setItem('mc:integrations', JSON.stringify(integrations));
    toast({
      title: "Integrações salvas",
      description: "Configurações salvas localmente (UI apenas)",
    });
  };

  const testConnection = (provider: string) => {
    const success = Math.random() > 0.3; // 70% success rate simulation
    toast({
      title: `Teste ${provider}`,
      description: success ? 
        `Conexão simulada com sucesso! (Em breve: conexão real)` :
        `Falha simulada na conexão. Verifique as configurações.`,
      variant: success ? "default" : "destructive"
    });
  };

  const toggleConnection = (provider: string) => {
    const integration = integrations[provider as keyof typeof integrations];
    
    // Only toggle if the integration has a connected property
    if ('connected' in integration) {
      setIntegrations(prev => ({
        ...prev,
        [provider]: {
          ...prev[provider],
          connected: !integration.connected
        }
      }));
      
      const isConnecting = !integration.connected;
      toast({
        title: isConnecting ? "Conectando..." : "Desconectando...",
        description: `${provider} ${isConnecting ? 'conectado' : 'desconectado'} (simulado)`,
      });
    }
  };

  const examplePayload = {
    event: "task.completed",
    timestamp: "2024-01-15T10:30:00Z",
    data: {
      task_id: "tsk_123",
      instance_id: "inst_456", 
      assignee: "user@example.com",
      status: "done"
    }
  };

  return (
    <RequireRole minRole="admin">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-tomorrow font-bold">Integrações</h1>
            <p className="text-muted-foreground">
              Configure integrações com ferramentas externas e APIs
            </p>
          </div>
          <Badge variant="outline" className="text-orange-600 border-orange-200">
            <AlertTriangle className="h-3 w-3 mr-1" />
            UI Temporária
          </Badge>
        </div>

        <HelpText>
          As integrações são simuladas localmente. Tokens e configurações reais serão implementados no backend.
        </HelpText>

        <Accordion type="multiple" className="space-y-4">
          <AccordionItem value="slack" className="border rounded-lg">
            <AccordionTrigger className="px-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded flex items-center justify-center text-white font-bold text-sm">
                  S
                </div>
                <div className="text-left">
                  <div className="font-medium">Slack</div>
                  <div className="text-sm text-muted-foreground">Notificações e comandos</div>
                </div>
                <StatusBadge connected={integrations.slack.connected} />
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="slackBotToken">Bot Token</Label>
                  <div className="relative">
                    <Input
                      id="slackBotToken"
                      type="password"
                      placeholder="xoxb-..."
                      disabled
                      value={integrations.slack.botToken}
                    />
                    <ComingSoonBadge />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slackSigningSecret">Signing Secret</Label>
                  <div className="relative">
                    <Input
                      id="slackSigningSecret"
                      type="password"
                      placeholder="xxxxxxxxxxxxx"
                      disabled
                      value={integrations.slack.signingSecret}
                    />
                    <ComingSoonBadge />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button onClick={() => toggleConnection('slack')}>
                    {integrations.slack.connected ? 'Desconectar' : 'Conectar'}
                  </Button>
                  <Button variant="outline" onClick={() => testConnection('Slack')}>
                    Testar Conexão
                  </Button>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="github" className="border rounded-lg">
            <AccordionTrigger className="px-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-900 rounded flex items-center justify-center text-white font-bold text-sm">
                  GH
                </div>
                <div className="text-left">
                  <div className="font-medium">GitHub</div>
                  <div className="text-sm text-muted-foreground">Sincronização de issues</div>
                </div>
                <StatusBadge connected={integrations.github.connected} />
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="githubOwner">Owner/Org</Label>
                    <Input
                      id="githubOwner"
                      placeholder="cupcode"
                      value={integrations.github.owner}
                      onChange={(e) => setIntegrations(prev => ({
                        ...prev,
                        github: { ...prev.github, owner: e.target.value }
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="githubRepo">Repository</Label>
                    <Input
                      id="githubRepo"
                      placeholder="mission-control"
                      value={integrations.github.repo}
                      onChange={(e) => setIntegrations(prev => ({
                        ...prev,
                        github: { ...prev.github, repo: e.target.value }
                      }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Scopes</Label>
                  <div className="text-sm text-muted-foreground">read (somente leitura)</div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button onClick={() => toggleConnection('github')}>
                    {integrations.github.connected ? 'Desconectar' : 'Conectar'}
                  </Button>
                  <Button variant="outline" onClick={() => testConnection('GitHub')}>
                    Testar Conexão
                  </Button>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="linear" className="border rounded-lg">
            <AccordionTrigger className="px-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-sm">
                  L
                </div>
                <div className="text-left">
                  <div className="font-medium">Linear</div>
                  <div className="text-sm text-muted-foreground">Gestão de issues</div>
                </div>
                <StatusBadge connected={integrations.linear.connected} />
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="linearWorkspace">Workspace</Label>
                  <Input
                    id="linearWorkspace"
                    placeholder="cupcode"
                    value={integrations.linear.workspace}
                    onChange={(e) => setIntegrations(prev => ({
                      ...prev,
                      linear: { ...prev.linear, workspace: e.target.value }
                    }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Mapeamento de Papéis → Teams</Label>
                  <div className="text-sm text-muted-foreground mb-2">
                    Define qual team do Linear recebe tarefas de cada papel
                  </div>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <span className="font-medium">backend_dev → Backend Team</span>
                      <span className="text-muted-foreground">(UI apenas)</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button onClick={() => toggleConnection('linear')}>
                    {integrations.linear.connected ? 'Desconectar' : 'Conectar'}
                  </Button>
                  <Button variant="outline" onClick={() => testConnection('Linear')}>
                    Testar Conexão
                  </Button>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="telescup" className="border rounded-lg">
            <AccordionTrigger className="px-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-600 rounded flex items-center justify-center text-white font-bold text-sm">
                  T
                </div>
                <div className="text-left">
                  <div className="font-medium">Telescup</div>
                  <div className="text-sm text-muted-foreground">Deep links e integrações</div>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Base URL</Label>
                  <div className="font-mono text-sm p-2 bg-muted rounded border">
                    {integrations.telescup.baseUrl}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    URL base para deep links (configurada via ambiente)
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      window.open('https://example.com/telescup-test', '_blank');
                      toast({
                        title: "Link de teste aberto",
                        description: "Deep link simulado aberto em nova aba",
                      });
                    }}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Testar Link
                  </Button>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="googledrive" className="border rounded-lg">
            <AccordionTrigger className="px-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center text-white font-bold text-sm">
                  GD
                </div>
                <div className="text-left">
                  <div className="font-medium">Google Drive</div>
                  <div className="text-sm text-muted-foreground">Armazenamento de documentos</div>
                </div>
                <StatusBadge connected={integrations.googleDrive.connected} />
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="driveFolder">Pasta Padrão</Label>
                  <Input
                    id="driveFolder"
                    placeholder="Mission Control Files"
                    value={integrations.googleDrive.defaultFolder}
                    onChange={(e) => setIntegrations(prev => ({
                      ...prev,
                      googleDrive: { ...prev.googleDrive, defaultFolder: e.target.value }
                    }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Criar pasta por instância</Label>
                    <div className="text-sm text-muted-foreground">
                      Organizar arquivos em pastas separadas por workflow
                    </div>
                  </div>
                  <Switch
                    checked={integrations.googleDrive.createFolderPerInstance}
                    onCheckedChange={(checked) => setIntegrations(prev => ({
                      ...prev,
                      googleDrive: { ...prev.googleDrive, createFolderPerInstance: checked }
                    }))}
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button onClick={() => toggleConnection('googleDrive')}>
                    {integrations.googleDrive.connected ? 'Desconectar' : 'Conectar'}
                  </Button>
                  <Button variant="outline" onClick={() => testConnection('Google Drive')}>
                    Testar Conexão
                  </Button>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="webhooks" className="border rounded-lg">
            <AccordionTrigger className="px-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-600 rounded flex items-center justify-center text-white font-bold text-sm">
                  W
                </div>
                <div className="text-left">
                  <div className="font-medium">Webhooks & API</div>
                  <div className="text-sm text-muted-foreground">Integrações customizadas</div>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="webhookUrl">Outbound Webhook URL</Label>
                  <div className="relative">
                    <Input
                      id="webhookUrl"
                      placeholder="https://api.example.com/webhooks/mission-control"
                      disabled
                      value={webhookSettings.outboundUrl}
                    />
                    <ComingSoonBadge />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    URL para receber eventos do Mission Control
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Exemplo de Payload</Label>
                  <Textarea
                    value={JSON.stringify(examplePayload, null, 2)}
                    readOnly
                    className="font-mono text-sm"
                    rows={8}
                  />
                  <CopyButton text={JSON.stringify(examplePayload, null, 2)} label="payload" />
                </div>

                <div className="space-y-2">
                  <Label>Token de API</Label>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      disabled
                      className="flex-1"
                    >
                      Gerar Token de API
                    </Button>
                    <ComingSoonBadge />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Token para autenticação em chamadas API (será implementado no backoffice)
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-2">
              <Button onClick={saveIntegrations}>
                Salvar Configurações
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  localStorage.removeItem('mc:integrations');
                  setIntegrations({
                    slack: { connected: false, botToken: '', signingSecret: '' },
                    github: { connected: false, owner: '', repo: '', scopes: 'read' },
                    gitlab: { connected: false, owner: '', repo: '', scopes: 'read' },
                    linear: { connected: false, workspace: '', teamMapping: {} },
                    jira: { connected: false, project: '', teamMapping: {} },
                    telescup: { baseUrl: 'https://app.telescup.com/deep-link/***' },
                    googleDrive: { connected: false, defaultFolder: '', createFolderPerInstance: true }
                  });
                  toast({
                    title: "Configurações resetadas",
                    description: "Todas as integrações foram resetadas",
                  });
                }}
              >
                Reset Tudo
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </RequireRole>
  );
};