import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, RefreshCw } from 'lucide-react';

interface BoardToolbarProps {
  totalCount: number;
}

export const BoardToolbar = ({ totalCount }: BoardToolbarProps) => {
  return (
    <div className="flex items-center justify-between bg-card border rounded-lg p-4">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold">Board Kanban</h2>
        <Badge variant="secondary">
          {totalCount} tarefa{totalCount !== 1 ? 's' : ''}
        </Badge>
      </div>
      
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
        <Button variant="ghost" size="sm">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};