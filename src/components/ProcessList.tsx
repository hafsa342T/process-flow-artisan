import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Edit, Trash2, Plus, Save, X } from 'lucide-react';
import { ProcessData, ProcessMappingData } from './ProcessMappingTool';

interface ProcessListProps {
  data: ProcessMappingData;
  onUpdate: (data: ProcessMappingData) => void;
  readOnly?: boolean;
}

export const ProcessList: React.FC<ProcessListProps> = ({ data, onUpdate, readOnly = false }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<ProcessData | null>(null);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'core': return 'bg-process-core text-white';
      case 'support': return 'bg-process-support text-white';
      case 'management': return 'bg-process-management text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const handleEdit = (process: ProcessData) => {
    setEditingId(process.id);
    setEditData({ ...process });
  };

  const handleSave = () => {
    if (!editData) return;
    
    const updatedProcesses = data.processes.map(p => 
      p.id === editData.id ? editData : p
    );
    
    onUpdate({
      ...data,
      processes: updatedProcesses
    });
    
    setEditingId(null);
    setEditData(null);
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData(null);
  };

  const handleDelete = (id: string) => {
    const updatedProcesses = data.processes.filter(p => p.id !== id);
    const updatedInteractions = data.interactions.filter(i => 
      i.from !== data.processes.find(p => p.id === id)?.name && 
      i.to !== data.processes.find(p => p.id === id)?.name
    );
    
    onUpdate({
      processes: updatedProcesses,
      interactions: updatedInteractions
    });
  };

  const renderProcessCard = (process: ProcessData) => {
    const isEditing = editingId === process.id;
    const displayData = isEditing ? editData! : process;

    return (
      <Card key={process.id} className="shadow-lg border-0 bg-gradient-to-br from-card to-card/80">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {isEditing ? (
                <Input
                  value={displayData.name}
                  onChange={(e) => setEditData({ ...displayData, name: e.target.value })}
                  className="text-lg font-semibold"
                />
              ) : (
                <CardTitle className="text-lg">{process.name}</CardTitle>
              )}
              <Badge className={getCategoryColor(displayData.category)}>
                {displayData.category}
              </Badge>
            </div>
            {!readOnly && (
              <div className="flex gap-1">
                {isEditing ? (
                  <>
                    <Button size="sm" onClick={handleSave} className="h-8 w-8 p-0">
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleCancel} className="h-8 w-8 p-0">
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button size="sm" variant="outline" onClick={() => handleEdit(process)} className="h-8 w-8 p-0">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(process.id)} className="h-8 w-8 p-0 text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-medium text-muted-foreground">INPUTS</Label>
              {isEditing ? (
                <Textarea
                  value={displayData.inputs.join('\n')}
                  onChange={(e) => setEditData({ 
                    ...displayData, 
                    inputs: e.target.value.split('\n').filter(i => i.trim()) 
                  })}
                  className="mt-1 min-h-[80px]"
                />
              ) : (
                <ul className="mt-1 space-y-1">
                  {process.inputs.map((input, idx) => (
                    <li key={idx} className="text-sm flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-accent rounded-full" />
                      {input}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            
            <div>
              <Label className="text-xs font-medium text-muted-foreground">OUTPUTS</Label>
              {isEditing ? (
                <Textarea
                  value={displayData.outputs.join('\n')}
                  onChange={(e) => setEditData({ 
                    ...displayData, 
                    outputs: e.target.value.split('\n').filter(o => o.trim()) 
                  })}
                  className="mt-1 min-h-[80px]"
                />
              ) : (
                <ul className="mt-1 space-y-1">
                  {process.outputs.map((output, idx) => (
                    <li key={idx} className="text-sm flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                      {output}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div>
            <Label className="text-xs font-medium text-muted-foreground">KEY RISK</Label>
            {isEditing ? (
              <Input
                value={displayData.risk}
                onChange={(e) => setEditData({ ...displayData, risk: e.target.value })}
                className="mt-1"
              />
            ) : (
              <p className="mt-1 text-sm text-warning bg-warning/10 p-2 rounded">{process.risk}</p>
            )}
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs font-medium text-muted-foreground">KPI</Label>
              {isEditing ? (
                <Input
                  value={displayData.kpi}
                  onChange={(e) => setEditData({ ...displayData, kpi: e.target.value })}
                  className="mt-1"
                />
              ) : (
                <p className="mt-1 text-sm font-medium">{process.kpi}</p>
              )}
            </div>
            
            <div>
              <Label className="text-xs font-medium text-muted-foreground">OWNER</Label>
              {isEditing ? (
                <Input
                  value={displayData.owner}
                  onChange={(e) => setEditData({ ...displayData, owner: e.target.value })}
                  className="mt-1"
                />
              ) : (
                <p className="mt-1 text-sm font-medium">{process.owner}</p>
              )}
            </div>
            
            <div>
              <Label className="text-xs font-medium text-muted-foreground">ISO CLAUSES</Label>
              <div className="mt-1 flex flex-wrap gap-1">
                {process.isoClauses.map((clause, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {clause}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Process Details</h3>
        {!readOnly && (
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Process
          </Button>
        )}
      </div>
      
      <div className="grid gap-4">
        {data.processes.map(renderProcessCard)}
      </div>
    </div>
  );
};