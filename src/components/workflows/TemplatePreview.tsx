import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { WorkflowSpec, WorkflowNode } from '@/types/mc';

interface TemplatePreviewProps {
  spec: string;
}

export const TemplatePreview = ({ spec }: TemplatePreviewProps) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  let parsedSpec: WorkflowSpec | null = null;
  let parseError = '';

  try {
    if (spec.trim()) {
      parsedSpec = JSON.parse(spec) as WorkflowSpec;
    }
  } catch (error) {
    parseError = 'JSON inválido';
  }

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const getNodeTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      task: 'bg-blue-100 text-blue-800',
      approval: 'bg-yellow-100 text-yellow-800',
      form: 'bg-green-100 text-green-800',
      automation: 'bg-purple-100 text-purple-800'
    };

    return (
      <Badge className={colors[type] || 'bg-gray-100 text-gray-800'}>
        {type}
      </Badge>
    );
  };

  const NodeItem = ({ node }: { node: WorkflowNode }) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasDetails = node.role || node.sla_hours || node.requires?.length || node.outputs?.length;

    return (
      <div className="border rounded-lg p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {hasDetails && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleNode(node.id)}
                className="h-6 w-6 p-0"
              >
                {isExpanded ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </Button>
            )}
            <span className="font-medium text-sm">{node.id}</span>
            {getNodeTypeBadge(node.type)}
          </div>
        </div>
        
        <div className="text-sm font-medium">{node.title}</div>
        
        {isExpanded && hasDetails && (
          <div className="text-xs space-y-1 text-muted-foreground border-t pt-2">
            {node.role && (
              <div><span className="font-medium">Role:</span> {node.role}</div>
            )}
            {node.sla_hours && (
              <div><span className="font-medium">SLA:</span> {node.sla_hours}h</div>
            )}
            {node.requires && node.requires.length > 0 && (
              <div><span className="font-medium">Requires:</span> {node.requires.join(', ')}</div>
            )}
            {node.outputs && node.outputs.length > 0 && (
              <div><span className="font-medium">Outputs:</span> {node.outputs.join(', ')}</div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preview do Template</CardTitle>
      </CardHeader>
      <CardContent>
        {parseError ? (
          <div className="text-center py-8 text-muted-foreground">
            {parseError}
          </div>
        ) : !parsedSpec ? (
          <div className="text-center py-8 text-muted-foreground">
            Digite o JSON do spec para ver o preview
          </div>
        ) : !parsedSpec.nodes || parsedSpec.nodes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum nó encontrado no spec
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              {parsedSpec.nodes.length} nó{parsedSpec.nodes.length !== 1 ? 's' : ''}
            </div>
            <div className="space-y-2">
              {parsedSpec.nodes.map((node) => (
                <NodeItem key={node.id} node={node} />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};