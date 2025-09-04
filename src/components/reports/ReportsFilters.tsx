import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Filter } from 'lucide-react';
import { ReportsFilter } from '@/data/mc/reportsRepo';

interface ReportsFiltersProps {
  filters: ReportsFilter;
  onFiltersChange: (filters: ReportsFilter) => void;
}

export const ReportsFilters = ({ filters, onFiltersChange }: ReportsFiltersProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateFilter = (key: keyof ReportsFilter, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const clearFilter = (key: keyof ReportsFilter) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    onFiltersChange(newFilters);
  };

  const getActiveFiltersCount = () => {
    return Object.keys(filters).filter(key => 
      key !== 'startDate' && key !== 'endDate' && filters[key as keyof ReportsFilter]
    ).length;
  };

  const resetFilters = () => {
    onFiltersChange({
      startDate: filters.startDate,
      endDate: filters.endDate
    });
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span className="font-medium">Filtros</span>
            {getActiveFiltersCount() > 0 && (
              <Badge variant="secondary">
                {getActiveFiltersCount()}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {getActiveFiltersCount() > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
              >
                Limpar
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Recolher' : 'Expandir'}
            </Button>
          </div>
        </div>

        {/* Always visible: date range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <Label htmlFor="startDate">Data início</Label>
            <Input
              id="startDate"
              type="date"
              value={filters.startDate.split('T')[0]}
              onChange={(e) => updateFilter('startDate', e.target.value + 'T00:00:00.000Z')}
            />
          </div>
          <div>
            <Label htmlFor="endDate">Data fim</Label>
            <Input
              id="endDate"
              type="date"
              value={filters.endDate.split('T')[0]}
              onChange={(e) => updateFilter('endDate', e.target.value + 'T23:59:59.999Z')}
            />
          </div>
        </div>

        {/* Active filters display */}
        {getActiveFiltersCount() > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {filters.domain && (
              <Badge variant="outline" className="gap-1">
                Domínio: {filters.domain}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => clearFilter('domain')}
                />
              </Badge>
            )}
            {filters.assignedRole && (
              <Badge variant="outline" className="gap-1">
                Papel: {filters.assignedRole}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => clearFilter('assignedRole')}
                />
              </Badge>
            )}
            {filters.status && filters.status.length > 0 && (
              <Badge variant="outline" className="gap-1">
                Status: {filters.status.join(', ')}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => clearFilter('status')}
                />
              </Badge>
            )}
          </div>
        )}

        {/* Expanded filters */}
        {isExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t">
            <div>
              <Label htmlFor="domain">Domínio</Label>
              <Select
                value={filters.domain || ''}
                onValueChange={(value) => updateFilter('domain', value || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar domínio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="desenvolvimento">Desenvolvimento</SelectItem>
                  <SelectItem value="vendas">Vendas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="assignedRole">Papel</Label>
              <Select
                value={filters.assignedRole || ''}
                onValueChange={(value) => updateFilter('assignedRole', value || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar papel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="Designer">Designer</SelectItem>
                  <SelectItem value="FrontEnd">Front-end</SelectItem>
                  <SelectItem value="BackEnd">Back-end</SelectItem>
                  <SelectItem value="CS">CS</SelectItem>
                  <SelectItem value="QA">QA</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={filters.status?.[0] || ''}
                onValueChange={(value) => updateFilter('status', value ? [value] : undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="open">Aberta</SelectItem>
                  <SelectItem value="in_progress">Em andamento</SelectItem>
                  <SelectItem value="blocked">Bloqueada</SelectItem>
                  <SelectItem value="done">Concluída</SelectItem>
                  <SelectItem value="rejected">Rejeitada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};