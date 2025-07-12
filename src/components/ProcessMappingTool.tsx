import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Building2, Brain, FileText, Download, Plus, Trash2, Edit, ArrowRight } from 'lucide-react';
import { ProcessInput } from './ProcessInput';
import { ProcessList } from './ProcessList';
import { ProcessFlow } from './ProcessFlow';
import { ExportOptions } from './ExportOptions';

export interface ProcessData {
  id: string;
  name: string;
  category: 'core' | 'support' | 'management';
  inputs: string[];
  outputs: string[];
  risk: string;
  kpi: string;
  owner: string;
  isoClauses: string[];
}

export interface ProcessInteraction {
  from: string;
  to: string;
  description?: string;
}

export interface ProcessMappingData {
  processes: ProcessData[];
  interactions: ProcessInteraction[];
}

export const ProcessMappingTool: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<'input' | 'generated' | 'editing'>('input');
  const [industry, setIndustry] = useState('');
  const [coreProcesses, setCoreProcesses] = useState('');
  const [generatedData, setGeneratedData] = useState<ProcessMappingData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!industry.trim() || !coreProcesses.trim()) return;
    
    setIsGenerating(true);
    
    // Simulate AI generation - replace with actual AI call
    setTimeout(() => {
      const mockData: ProcessMappingData = {
        processes: [
          {
            id: '1',
            name: 'Purchasing',
            category: 'core',
            inputs: ['Supplier catalogs', 'Purchase requests', 'Quality specs'],
            outputs: ['Purchase orders', 'Supplier agreements', 'Materials'],
            risk: 'Poor supplier quality leading to production delays',
            kpi: 'Supplier quality rating (%)',
            owner: 'Purchasing Manager',
            isoClauses: ['8.4.1', '8.4.2', '8.4.3']
          },
          {
            id: '2',
            name: 'Production',
            category: 'core',
            inputs: ['Raw materials', 'Work orders', 'Quality standards'],
            outputs: ['Finished products', 'Production reports', 'Quality records'],
            risk: 'Equipment failure causing production downtime',
            kpi: 'Overall Equipment Effectiveness (%)',
            owner: 'Production Manager',
            isoClauses: ['8.5.1', '8.5.2', '8.5.3']
          },
          {
            id: '3',
            name: 'Customer Service',
            category: 'support',
            inputs: ['Customer inquiries', 'Order status', 'Product information'],
            outputs: ['Order confirmations', 'Customer feedback', 'Issue resolutions'],
            risk: 'Delayed response to customer complaints',
            kpi: 'Customer satisfaction score',
            owner: 'Customer Service Manager',
            isoClauses: ['9.1.2', '10.2.1']
          }
        ],
        interactions: [
          { from: 'Purchasing', to: 'Production', description: 'Materials supply' },
          { from: 'Production', to: 'Customer Service', description: 'Product delivery' }
        ]
      };
      
      setGeneratedData(mockData);
      setCurrentStep('generated');
      setIsGenerating(false);
    }, 2000);
  };

  const handleEdit = () => {
    setCurrentStep('editing');
  };

  const handleBackToInput = () => {
    setCurrentStep('input');
    setGeneratedData(null);
  };

  const updateProcessData = (updatedData: ProcessMappingData) => {
    setGeneratedData(updatedData);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-light rounded-lg">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">ISO 9001 Process Mapper</h1>
              <p className="text-muted-foreground">AI-powered process mapping and documentation</p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 ${currentStep === 'input' ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep === 'input' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                1
              </div>
              <span className="font-medium">Input</span>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className={`flex items-center gap-2 ${currentStep === 'generated' || currentStep === 'editing' ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep === 'generated' || currentStep === 'editing' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                2
              </div>
              <span className="font-medium">Generate</span>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className={`flex items-center gap-2 ${currentStep === 'editing' ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep === 'editing' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                3
              </div>
              <span className="font-medium">Customize</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {currentStep === 'input' && (
          <ProcessInput
            industry={industry}
            coreProcesses={coreProcesses}
            onIndustryChange={setIndustry}
            onCoreProcessesChange={setCoreProcesses}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
          />
        )}

        {currentStep === 'generated' && generatedData && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Generated Process Map</h2>
                <p className="text-muted-foreground">Review and customize your process documentation</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleBackToInput}>
                  Back to Input
                </Button>
                <Button onClick={handleEdit} className="gap-2">
                  <Edit className="h-4 w-4" />
                  Customize
                </Button>
              </div>
            </div>
            <ProcessList data={generatedData} onUpdate={updateProcessData} readOnly />
            <ProcessFlow data={generatedData} />
          </div>
        )}

        {currentStep === 'editing' && generatedData && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Customize Process Map</h2>
                <p className="text-muted-foreground">Edit processes and export your documentation</p>
              </div>
              <ExportOptions data={generatedData} />
            </div>
            <ProcessList data={generatedData} onUpdate={updateProcessData} />
            <ProcessFlow data={generatedData} />
          </div>
        )}
      </div>
    </div>
  );
};