import { useEffect } from 'react';
import { Construction, Calendar, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface ComingSoonProps {
  title: string;
  description?: string;
  showToast?: boolean;
}

export const ComingSoon = ({ 
  title, 
  description = "Esta funcionalidade está em desenvolvimento e será lançada em breve.",
  showToast = true 
}: ComingSoonProps) => {
  const { toast } = useToast();

  useEffect(() => {
    if (showToast) {
      toast({
        title: "Em breve",
        description: `${title} está sendo desenvolvido pela equipe Cupcode.`,
        duration: 3000,
      });
    }
  }, [title, showToast, toast]);

  return (
    <div className="max-w-2xl mx-auto mt-12">
      <Card className="border-2 border-dashed border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto w-16 h-16 bg-gradient-brand rounded-full flex items-center justify-center mb-4">
            <Construction className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-tomorrow font-bold bg-gradient-brand bg-clip-text text-transparent">
            {title}
          </CardTitle>
          <CardDescription className="text-base mt-2">
            {description}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3 p-4 bg-background/50 rounded-lg border">
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium text-sm">Próxima Release</p>
                <p className="text-xs text-muted-foreground">Em desenvolvimento</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-4 bg-background/50 rounded-lg border">
              <Zap className="h-5 w-5 text-secondary" />
              <div>
                <p className="font-medium text-sm">Status</p>
                <p className="text-xs text-muted-foreground">Planejamento concluído</p>
              </div>
            </div>
          </div>
          
          <div className="text-center text-sm text-muted-foreground">
            <p>Acompanhe as novidades no repositório da Cupcode</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};