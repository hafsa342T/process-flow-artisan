import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowRight, ArrowDown, ArrowDownUp, Workflow, GitBranch, RotateCcw, Eye, EyeOff } from 'lucide-react';
import { ProcessMappingData } from './ProcessMappingTool';

interface ProcessFlowProps {
  data: ProcessMappingData;
}

export const ProcessFlow: React.FC<ProcessFlowProps> = ({ data }) => {
  const [activeView, setActiveView] = useState<'hierarchy' | 'network' | 'interactions'>('hierarchy');
  const [showDetails, setShowDetails] = useState(true);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'core': return {
        bg: 'bg-process-core',
        border: 'border-process-core',
        text: 'text-white',
        light: 'bg-process-core/10 border-process-core/30'
      };
      case 'support': return {
        bg: 'bg-process-support', 
        border: 'border-process-support',
        text: 'text-white',
        light: 'bg-process-support/10 border-process-support/30'
      };
      case 'management': return {
        bg: 'bg-process-management',
        border: 'border-process-management', 
        text: 'text-white',
        light: 'bg-process-management/10 border-process-management/30'
      };
      default: return {
        bg: 'bg-muted',
        border: 'border-muted',
        text: 'text-muted-foreground',
        light: 'bg-muted/10 border-muted/30'
      };
    }
  };

  const processColumns = {
    management: data.processes.filter(p => p.category === 'management'),
    core: data.processes.filter(p => p.category === 'core'),
    support: data.processes.filter(p => p.category === 'support')
  };

  const getProcessFlow = () => {
    // Create a more sophisticated flow based on common patterns
    const coreFlow = processColumns.core.map(p => p.name);
    const supportingProcesses = processColumns.support;
    const managementProcesses = processColumns.management;

    return {
      primaryFlow: coreFlow,
      supportFlows: supportingProcesses.map(p => ({
        name: p.name,
        supports: coreFlow.filter((_, idx) => idx % 2 === 0) // Support every other core process
      })),
      managementOversight: managementProcesses.map(p => ({
        name: p.name,
        oversees: [...coreFlow, ...supportingProcesses.map(sp => sp.name)]
      }))
    };
  };

  const flow = getProcessFlow();

  const renderHierarchyView = () => (
    <div className="space-y-8 animate-fade-in">
      {/* Management Layer */}
      {processColumns.management.length > 0 && (
        <div className="relative">
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-process-management mb-4">Management Processes</h3>
            <div className="flex flex-wrap justify-center gap-4">
              {processColumns.management.map((process, idx) => {
                const colors = getCategoryColor(process.category);
                return (
                  <div 
                    key={process.id} 
                    className={`px-6 py-4 rounded-xl ${colors.bg} ${colors.text} shadow-lg transform hover:scale-105 transition-all duration-200 animate-scale-in`}
                    style={{ animationDelay: `${idx * 100}ms` }}
                  >
                    <div className="font-semibold text-center">{process.name}</div>
                    {showDetails && (
                      <div className="text-xs mt-1 opacity-90">
                        KPI: {process.kpi}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Management oversight arrows */}
          <div className="flex justify-center mb-4">
            <ArrowDown className="h-8 w-8 text-process-management animate-pulse" />
          </div>
        </div>
      )}

      {/* Core Process Flow */}
      {processColumns.core.length > 0 && (
        <div className="relative">
          <h3 className="text-lg font-semibold text-process-core mb-6 text-center">Core Process Flow</h3>
          
          <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
            {processColumns.core.map((process, idx) => {
              const colors = getCategoryColor(process.category);
              return (
                <React.Fragment key={process.id}>
                  <div 
                    className={`px-6 py-4 rounded-xl ${colors.bg} ${colors.text} shadow-lg transform hover:scale-105 transition-all duration-200 animate-scale-in min-w-48`}
                    style={{ animationDelay: `${(idx + processColumns.management.length) * 100}ms` }}
                  >
                    <div className="font-semibold text-center">{process.name}</div>
                    {showDetails && (
                      <div className="text-xs mt-2 space-y-1 opacity-90">
                        <div>Owner: {process.owner}</div>
                        <div>KPI: {process.kpi}</div>
                      </div>
                    )}
                  </div>
                  
                  {idx < processColumns.core.length - 1 && (
                    <ArrowRight className="h-6 w-6 text-process-core animate-pulse" />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Process interactions detail */}
          {data.interactions.length > 0 && (
            <div className="bg-card rounded-lg p-4 border">
              <h4 className="font-medium mb-3 text-center">Process Interactions</h4>
              <div className="grid gap-2">
                {data.interactions.map((interaction, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg animate-fade-in" style={{ animationDelay: `${idx * 50}ms` }}>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="font-medium">
                        {interaction.from}
                      </Badge>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <Badge variant="outline" className="font-medium">
                        {interaction.to}
                      </Badge>
                    </div>
                    {interaction.description && showDetails && (
                      <span className="text-sm text-muted-foreground">
                        {interaction.description}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Support Process Layer */}
      {processColumns.support.length > 0 && (
        <div className="relative">
          <div className="flex justify-center mb-4">
            <ArrowDownUp className="h-8 w-8 text-process-support animate-pulse" />
          </div>
          
          <h3 className="text-lg font-semibold text-process-support mb-6 text-center">Support Processes</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {processColumns.support.map((process, idx) => {
              const colors = getCategoryColor(process.category);
              return (
                <div 
                  key={process.id} 
                  className={`px-4 py-3 rounded-lg ${colors.bg} ${colors.text} shadow-md transform hover:scale-105 transition-all duration-200 animate-scale-in`}
                  style={{ animationDelay: `${(idx + processColumns.management.length + processColumns.core.length) * 100}ms` }}
                >
                  <div className="font-medium text-center">{process.name}</div>
                  {showDetails && (
                    <div className="text-xs mt-1 text-center opacity-90">
                      {process.owner}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  const renderNetworkView = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="grid gap-6">
        {/* Process nodes with connections */}
        {Object.entries(processColumns).map(([category, processes]) => (
          processes.length > 0 && (
            <div key={category} className="space-y-4">
              <h3 className={`text-lg font-semibold text-process-${category} capitalize`}>
                {category} Processes
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {processes.map((process, idx) => {
                  const colors = getCategoryColor(process.category);
                  const incomingInteractions = data.interactions.filter(i => i.to === process.name);
                  const outgoingInteractions = data.interactions.filter(i => i.from === process.name);
                  
                  return (
                    <Card 
                      key={process.id} 
                      className={`${colors.light} hover:shadow-lg transition-all duration-200 animate-scale-in`}
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">{process.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {showDetails && (
                          <>
                            <div className="text-xs">
                              <strong>Owner:</strong> {process.owner}
                            </div>
                            <div className="text-xs">
                              <strong>KPI:</strong> {process.kpi}
                            </div>
                          </>
                        )}
                        
                        {/* Connections */}
                        <div className="space-y-2">
                          {incomingInteractions.length > 0 && (
                            <div>
                              <div className="text-xs font-medium text-success">Receives from:</div>
                              {incomingInteractions.map((interaction, i) => (
                                <div key={i} className="text-xs text-muted-foreground">
                                  • {interaction.from}
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {outgoingInteractions.length > 0 && (
                            <div>
                              <div className="text-xs font-medium text-primary">Sends to:</div>
                              {outgoingInteractions.map((interaction, i) => (
                                <div key={i} className="text-xs text-muted-foreground">
                                  • {interaction.to}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )
        ))}
      </div>
    </div>
  );

  const renderInteractionsView = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="grid gap-4">
        {data.interactions.map((interaction, idx) => {
          const fromProcess = data.processes.find(p => p.name === interaction.from);
          const toProcess = data.processes.find(p => p.name === interaction.to);
          
          return (
            <Card key={idx} className="animate-scale-in" style={{ animationDelay: `${idx * 100}ms` }}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="text-center">
                      <Badge className={getCategoryColor(fromProcess?.category || 'core').bg}>
                        {interaction.from}
                      </Badge>
                      <div className="text-xs text-muted-foreground mt-1">
                        {fromProcess?.category}
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-center gap-2">
                      <ArrowRight className="h-6 w-6 text-primary" />
                      {interaction.description && showDetails && (
                        <div className="text-xs text-center text-muted-foreground max-w-32">
                          {interaction.description}
                        </div>
                      )}
                    </div>
                    
                    <div className="text-center">
                      <Badge className={getCategoryColor(toProcess?.category || 'core').bg}>
                        {interaction.to}
                      </Badge>
                      <div className="text-xs text-muted-foreground mt-1">
                        {toProcess?.category}
                      </div>
                    </div>
                  </div>
                  
                  {showDetails && (
                    <div className="text-sm text-muted-foreground ml-4">
                      <div><strong>From KPI:</strong> {fromProcess?.kpi}</div>
                      <div><strong>To KPI:</strong> {toProcess?.kpi}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );

  return (
    <Card className="shadow-lg border-0 bg-gradient-to-br from-card to-card/80">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Workflow className="h-5 w-5 text-primary" />
            Process Flow Visualization
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="gap-2"
          >
            {showDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showDetails ? 'Hide Details' : 'Show Details'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs value={activeView} onValueChange={(v) => setActiveView(v as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="hierarchy" className="gap-2">
              <GitBranch className="h-4 w-4" />
              Hierarchy
            </TabsTrigger>
            <TabsTrigger value="network" className="gap-2">
              <Workflow className="h-4 w-4" />
              Network
            </TabsTrigger>
            <TabsTrigger value="interactions" className="gap-2">
              <ArrowRight className="h-4 w-4" />
              Interactions
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="hierarchy" className="mt-6">
            {renderHierarchyView()}
          </TabsContent>
          
          <TabsContent value="network" className="mt-6">
            {renderNetworkView()}
          </TabsContent>
          
          <TabsContent value="interactions" className="mt-6">
            {renderInteractionsView()}
          </TabsContent>
        </Tabs>

        {/* Process Statistics */}
        <div className="grid md:grid-cols-5 gap-4 pt-6 border-t">
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
          <Card className="bg-gradient-to-br from-process-management/5 to-process-management/10 border-process-management/20">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-process-management">{processColumns.management.length}</div>
              <div className="text-sm text-muted-foreground">Management</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-accent">{data.interactions.length}</div>
              <div className="text-sm text-muted-foreground">Interactions</div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
};