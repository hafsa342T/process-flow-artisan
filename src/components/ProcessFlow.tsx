import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Workflow } from 'lucide-react';
import { ProcessMappingData } from './ProcessMappingTool';

interface ProcessFlowProps {
  data: ProcessMappingData;
}

export const ProcessFlow: React.FC<ProcessFlowProps> = ({ data }) => {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'core': return 'bg-process-core text-white border-process-core';
      case 'support': return 'bg-process-support text-white border-process-support';
      case 'management': return 'bg-process-management text-white border-process-management';
      default: return 'bg-muted text-muted-foreground border-muted';
    }
  };

  const getProcessByName = (name: string) => {
    return data.processes.find(p => p.name === name);
  };

  const processColumns = {
    management: data.processes.filter(p => p.category === 'management'),
    core: data.processes.filter(p => p.category === 'core'),
    support: data.processes.filter(p => p.category === 'support')
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-lg border-0 bg-gradient-to-br from-card to-card/80">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Workflow className="h-5 w-5 text-primary" />
            Process Interaction Flow
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Process Categories Layout */}
          <div className="space-y-6">
            {/* Management Processes */}
            {processColumns.management.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">MANAGEMENT PROCESSES</h4>
                <div className="flex flex-wrap gap-3">
                  {processColumns.management.map(process => (
                    <div key={process.id} className={`px-4 py-2 rounded-lg border-2 ${getCategoryColor(process.category)}`}>
                      <span className="font-medium">{process.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Core Processes */}
            {processColumns.core.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">CORE PROCESSES</h4>
                <div className="flex flex-wrap items-center gap-3">
                  {processColumns.core.map((process, index) => (
                    <React.Fragment key={process.id}>
                      <div className={`px-4 py-3 rounded-lg border-2 ${getCategoryColor(process.category)} shadow-md`}>
                        <span className="font-medium">{process.name}</span>
                      </div>
                      {index < processColumns.core.length - 1 && (
                        <ArrowRight className="h-5 w-5 text-primary" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}

            {/* Support Processes */}
            {processColumns.support.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">SUPPORT PROCESSES</h4>
                <div className="flex flex-wrap gap-3">
                  {processColumns.support.map(process => (
                    <div key={process.id} className={`px-4 py-2 rounded-lg border-2 ${getCategoryColor(process.category)}`}>
                      <span className="font-medium">{process.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Interaction Details */}
          {data.interactions.length > 0 && (
            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium text-muted-foreground mb-3">PROCESS INTERACTIONS</h4>
              <div className="space-y-2">
                {data.interactions.map((interaction, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                    <Badge variant="outline" className="font-medium">
                      {interaction.from}
                    </Badge>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="outline" className="font-medium">
                      {interaction.to}
                    </Badge>
                    {interaction.description && (
                      <span className="text-sm text-muted-foreground ml-2">
                        ({interaction.description})
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Process Statistics */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{data.processes.length}</div>
            <div className="text-sm text-muted-foreground">Total Processes</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-process-core/5 to-process-core/10 border-process-core/20">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-process-core">{processColumns.core.length}</div>
            <div className="text-sm text-muted-foreground">Core Processes</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-process-support/5 to-process-support/10 border-process-support/20">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-process-support">{processColumns.support.length}</div>
            <div className="text-sm text-muted-foreground">Support Processes</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-accent">{data.interactions.length}</div>
            <div className="text-sm text-muted-foreground">Interactions</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};