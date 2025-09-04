import { Search, Filter, SortAsc } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';

interface Filters {
  search: string;
  statuses: string[];
  roles: string[];
  assignees: string[];
  priorities: number[];
  dueDates: string[];
  myTasksOnly: boolean;
}

interface BoardFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  sortBy: 'priority' | 'due_date' | 'created_at';
  onSortChange: (sort: 'priority' | 'due_date' | 'created_at') => void;
  availableRoles: string[];
  availableAssignees: string[];
}

const STATUS_OPTIONS = [
  { value: 'open', label: 'Aberto' },
  { value: 'in_progress', label: 'Em Progresso' },
  { value: 'blocked', label: 'Bloqueado' },
  { value: 'done', label: 'Concluído' }
];

const PRIORITY_OPTIONS = [
  { value: 5, label: 'Crítica (5)' },
  { value: 4, label: 'Alta (4)' },
  { value: 3, label: 'Média (3)' },
  { value: 2, label: 'Baixa (2)' },
  { value: 1, label: 'Muito Baixa (1)' }
];

const DUE_DATE_OPTIONS = [
  { value: 'overdue', label: 'Atrasadas' },
  { value: 'today', label: 'Hoje' },
  { value: 'this_week', label: 'Esta semana' }
];

const SORT_OPTIONS = [
  { value: 'priority', label: 'Prioridade' },
  { value: 'due_date', label: 'Data de vencimento' },
  { value: 'created_at', label: 'Data de criação' }
];

export const BoardFilters = ({
  filters,
  onFiltersChange,
  sortBy,
  onSortChange,
  availableRoles,
  availableAssignees
}: BoardFiltersProps) => {
  const updateFilters = (updates: Partial<Filters>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const toggleArrayFilter = (key: keyof Filters, value: string | number) => {
    const currentArray = filters[key] as (string | number)[];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    
    updateFilters({ [key]: newArray });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.statuses.length < STATUS_OPTIONS.length) count++;
    if (filters.roles.length > 0) count++;
    if (filters.priorities.length > 0) count++;
    if (filters.dueDates.length > 0) count++;
    if (filters.myTasksOnly) count++;
    return count;
  };

  const clearAllFilters = () => {
    onFiltersChange({
      search: '',
      statuses: STATUS_OPTIONS.map(s => s.value),
      roles: [],
      assignees: [],
      priorities: [],
      dueDates: [],
      myTasksOnly: false
    });
  };

  return (
    <div className="bg-card border rounded-lg p-4 space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar tarefas..."
            value={filters.search}
            onChange={(e) => updateFilters({ search: e.target.value })}
            className="pl-10"
          />
        </div>

        {/* My Tasks Toggle */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="my-tasks"
            checked={filters.myTasksOnly}
            onCheckedChange={(checked) => updateFilters({ myTasksOnly: !!checked })}
          />
          <Label htmlFor="my-tasks" className="text-sm font-medium">
            Minhas tarefas
          </Label>
        </div>

        {/* Sort */}
        <Select value={sortBy} onValueChange={(value) => onSortChange(value as any)}>
          <SelectTrigger className="w-48">
            <SortAsc className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Ordenar por" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Filters */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filtros
              {getActiveFiltersCount() > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {getActiveFiltersCount()}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96 p-0" align="end">
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Filtros</h4>
                {getActiveFiltersCount() > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                    Limpar tudo
                  </Button>
                )}
              </div>

              <Separator />

              {/* Status Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Status</Label>
                <div className="grid grid-cols-2 gap-2">
                  {STATUS_OPTIONS.map(status => (
                    <div key={status.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`status-${status.value}`}
                        checked={filters.statuses.includes(status.value)}
                        onCheckedChange={() => toggleArrayFilter('statuses', status.value)}
                      />
                      <Label 
                        htmlFor={`status-${status.value}`} 
                        className="text-sm"
                      >
                        {status.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Priority Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Prioridade</Label>
                <div className="space-y-2">
                  {PRIORITY_OPTIONS.map(priority => (
                    <div key={priority.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`priority-${priority.value}`}
                        checked={filters.priorities.includes(priority.value)}
                        onCheckedChange={() => toggleArrayFilter('priorities', priority.value)}
                      />
                      <Label 
                        htmlFor={`priority-${priority.value}`} 
                        className="text-sm"
                      >
                        {priority.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Role Filter */}
              {availableRoles.length > 0 && (
                <>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Papel</Label>
                    <div className="space-y-2">
                      {availableRoles.map(role => (
                        <div key={role} className="flex items-center space-x-2">
                          <Checkbox
                            id={`role-${role}`}
                            checked={filters.roles.includes(role)}
                            onCheckedChange={() => toggleArrayFilter('roles', role)}
                          />
                          <Label 
                            htmlFor={`role-${role}`} 
                            className="text-sm"
                          >
                            {role}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              {/* Due Date Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Vencimento</Label>
                <div className="space-y-2">
                  {DUE_DATE_OPTIONS.map(dueDateOption => (
                    <div key={dueDateOption.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`due-${dueDateOption.value}`}
                        checked={filters.dueDates.includes(dueDateOption.value)}
                        onCheckedChange={() => toggleArrayFilter('dueDates', dueDateOption.value)}
                      />
                      <Label 
                        htmlFor={`due-${dueDateOption.value}`} 
                        className="text-sm"
                      >
                        {dueDateOption.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};