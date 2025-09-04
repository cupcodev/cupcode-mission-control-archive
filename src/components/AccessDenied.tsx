import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldX, ArrowLeft } from 'lucide-react';

export const AccessDenied = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <ShieldX className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-tomorrow">Acesso Negado</CardTitle>
          <CardDescription>
            Você não tem permissão para acessar esta página. 
            Entre em contato com um administrador se precisar de acesso.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => navigate('/app/overview')}
            className="w-full"
            aria-label="Voltar para visão geral"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Overview
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};