import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { templatesRepo, type WorkflowSpec } from '@/data/mc';
import { RequireRole } from '@/components/RequireRole';
import { TemplatePreview } from '@/components/workflows/TemplatePreview';
import { validateWorkflowSpec } from '@/lib/workflow-validation';

export const WorkflowTemplateNew = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    spec: '',
    is_active: false
  });
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  const handleValidateSpec = () => {
    setIsValidating(true);
    try {
      const spec = JSON.parse(formData.spec) as WorkflowSpec;
      const errors = validateWorkflowSpec(spec);
      setValidationErrors(errors);
      
      if (errors.length === 0) {
        toast({
          title: 'Validação',
          description: 'Spec válido! ✅',
        });
      }
    } catch (error) {
      setValidationErrors(['JSON inválido']);
    } finally {
      setIsValidating(false);
    }
  };

  const handleSave = async (isDraft = false) => {
    try {
      setLoading(true);
      
      // Validar spec antes de salvar
      const spec = JSON.parse(formData.spec) as WorkflowSpec;
      const errors = validateWorkflowSpec(spec);
      
      if (errors.length > 0) {
        setValidationErrors(errors);
        toast({
          title: 'Erro de validação',
          description: 'Corrija os erros antes de salvar.',
          variant: 'destructive',
        });
        return;
      }

      const template = await templatesRepo.create({
        name: formData.name,
        domain: formData.domain,
        spec,
        is_active: isDraft ? false : formData.is_active
      });

      toast({
        title: 'Sucesso',
        description: `Template ${isDraft ? 'salvo como rascunho' : 'criado'} com sucesso.`,
      });

      navigate('/app/workflows/templates');
    } catch (error) {
      console.error('Erro ao salvar template:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o template.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatSpec = () => {
    try {
      const spec = JSON.parse(formData.spec);
      setFormData({ ...formData, spec: JSON.stringify(spec, null, 2) });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'JSON inválido',
        variant: 'destructive',
      });
    }
  };

  const isFormValid = formData.name && formData.domain && formData.spec && validationErrors.length === 0;

  return (
    <RequireRole minRole="admin">
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/app/workflows/templates')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Novo Template de Workflow</h1>
            <p className="text-muted-foreground">
              Crie um novo template de workflow com validação
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Formulário */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações Básicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome do Template</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Onboarding - Desenvolvimento"
                  />
                </div>

                <div>
                  <Label htmlFor="domain">Domínio</Label>
                  <Select value={formData.domain} onValueChange={(value) => setFormData({ ...formData, domain: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um domínio" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="development">Development</SelectItem>
                      <SelectItem value="branding">Branding</SelectItem>
                      <SelectItem value="traffic">Traffic</SelectItem>
                      <SelectItem value="social">Social Media</SelectItem>
                      <SelectItem value="ops">Operations</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: !!checked })}
                  />
                  <Label htmlFor="is_active">Ativar após salvar</Label>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Especificação do Workflow</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="spec">Spec (JSON)</Label>
                  <Textarea
                    id="spec"
                    value={formData.spec}
                    onChange={(e) => setFormData({ ...formData, spec: e.target.value })}
                    placeholder="Cole ou digite o JSON do workflow spec..."
                    className="font-mono text-sm min-h-[300px]"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={formatSpec}
                    disabled={!formData.spec}
                  >
                    Formatar JSON
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleValidateSpec}
                    disabled={!formData.spec || isValidating}
                  >
                    {isValidating ? 'Validando...' : 'Validar Spec'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Validações */}
            {validationErrors.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <strong>Erros de validação:</strong>
                    {validationErrors.map((error, index) => (
                      <div key={index} className="text-sm">• {error}</div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Ações */}
            <div className="flex gap-2">
              <Button
                onClick={() => handleSave(false)}
                disabled={!isFormValid || loading}
                className="flex-1"
              >
                <Check className="h-4 w-4 mr-2" />
                {loading ? 'Salvando...' : 'Salvar Template'}
              </Button>
              <Button
                variant="outline"
                onClick={() => handleSave(true)}
                disabled={!formData.name || !formData.domain || !formData.spec || loading}
              >
                Salvar Rascunho
              </Button>
            </div>
          </div>

          {/* Preview */}
          <div>
            <TemplatePreview spec={formData.spec} />
          </div>
        </div>
      </div>
    </RequireRole>
  );
};