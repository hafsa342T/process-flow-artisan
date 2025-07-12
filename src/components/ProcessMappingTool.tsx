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
import { EmailGate } from './EmailGate';
import { ResultsView } from './ResultsView';

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
  processFlow?: {
    primaryFlow: string[];
    supportingFlows: Array<{
      name: string;
      processes: string[];
    }>;
    feedbackLoops: Array<{
      from: string;
      to: string;
      description: string;
    }>;
  };
}

export const ProcessMappingTool: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<'input' | 'generated' | 'editing' | 'email-gate' | 'results'>('input');
  const [industry, setIndustry] = useState('');
  const [coreProcesses, setCoreProcesses] = useState('');
  const [generatedData, setGeneratedData] = useState<ProcessMappingData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  const handleGenerate = async () => {
    if (!industry.trim() || !coreProcesses.trim()) return;
    
    setIsGenerating(true);
    
    try {
      // Your API key would be stored securely in Supabase Edge Function
      const { aiService } = await import('@/services/aiService');
      const { getIndustryBenchmark } = await import('@/data/industryBenchmarks');
      
      let processData: ProcessMappingData;
      
      // Always try AI service first with your API key
      try {
        // This would call your Supabase Edge Function
        processData = await generateWithAI(industry, coreProcesses);
      } catch (error) {
        console.log('AI service unavailable, using benchmarks:', error);
        // Fallback to benchmark data
        const benchmark = getIndustryBenchmark(industry);
        processData = generateBenchmarkProcessMap(industry, coreProcesses, benchmark);
      }
      
      setGeneratedData(processData);
      setCurrentStep('generated');
    } catch (error) {
      console.error('Generation error:', error);
      // Final fallback to benchmark data
      const { getIndustryBenchmark } = await import('@/data/industryBenchmarks');
      const benchmark = getIndustryBenchmark(industry);
      const fallbackData = generateBenchmarkProcessMap(industry, coreProcesses, benchmark);
      setGeneratedData(fallbackData);
      setCurrentStep('generated');
    } finally {
      setIsGenerating(false);
    }
  };

  // This function would call your Supabase Edge Function
  const generateWithAI = async (industry: string, processes: string): Promise<ProcessMappingData> => {
    // TODO: Replace with actual Supabase Edge Function call
    // const { data } = await supabase.functions.invoke('generate-process-map', {
    //   body: { industry, processes }
    // });
    // return data;
    
    // For now, enhanced benchmark generation
    const { getIndustryBenchmark } = await import('@/data/industryBenchmarks');
    const benchmark = getIndustryBenchmark(industry);
    return generateBenchmarkProcessMap(industry, processes, benchmark);
  };

  const generateBenchmarkProcessMap = (industry: string, userProcesses: string, benchmark: any): ProcessMappingData => {
    const userProcessList = userProcesses.split('\n').filter(p => p.trim());
    const allProcesses = [...userProcessList];
    
    // Add benchmark processes if available
    if (benchmark) {
      // Add some core processes not mentioned by user
      benchmark.commonProcesses.core.forEach((process: string) => {
        if (!allProcesses.some(up => up.toLowerCase().includes(process.toLowerCase().split(' ')[0]))) {
          allProcesses.push(process);
        }
      });
      
      // Add key support processes
      allProcesses.push(...benchmark.commonProcesses.support.slice(0, 3));
      allProcesses.push(...benchmark.commonProcesses.management.slice(0, 2));
    }

    const processes: ProcessData[] = allProcesses.map((name, index) => {
      const category = benchmark?.commonProcesses.core.includes(name) ? 'core' :
                     benchmark?.commonProcesses.support.includes(name) ? 'support' : 
                     benchmark?.commonProcesses.management.includes(name) ? 'management' : 'core';
      
      return {
        id: String(index + 1),
        name,
        category,
        inputs: [`${name} inputs`, 'Requirements', 'Resources'],
        outputs: [`${name} outputs`, 'Deliverables', 'Reports'],
        risk: benchmark?.industryRisks[index % (benchmark.industryRisks.length || 1)] || 'Process failure risk',
        kpi: benchmark?.commonKPIs[index % (benchmark.commonKPIs.length || 1)] || 'Process performance metric',
        owner: `${name} Manager`,
        isoClauses: ['8.1', '8.2', '9.1']
      };
    });

    const interactions: ProcessInteraction[] = [];
    for (let i = 0; i < processes.length - 1; i++) {
      if (processes[i].category === 'core' && processes[i + 1].category === 'core') {
        interactions.push({
          from: processes[i].name,
          to: processes[i + 1].name,
          description: 'Process output feeds next process'
        });
      }
    }

    return { processes, interactions };
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

  const handleEmailSubmitted = (email: string) => {
    setUserEmail(email);
    setCurrentStep('results');
  };

  const handleBackToEmailGate = () => {
    setCurrentStep('email-gate');
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
        
        {currentStep === 'email-gate' && generatedData && (
          <EmailGate 
            data={generatedData} 
            industry={industry}
            onEmailSubmitted={handleEmailSubmitted}
          />
        )}

        {currentStep === 'results' && generatedData && userEmail && (
          <ResultsView 
            data={generatedData} 
            industry={industry}
            userEmail={userEmail}
            onBack={handleBackToEmailGate}
          />
        )}
        {currentStep === 'editing' && generatedData && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Customize Process Map</h2>
                <p className="text-muted-foreground">Edit processes and get your complete report</p>
              </div>
              <Button 
                onClick={() => setCurrentStep('email-gate')} 
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Get Report
              </Button>
            </div>
            <ProcessList data={generatedData} onUpdate={updateProcessData} />
            <ProcessFlow data={generatedData} />
          </div>
        )}
      </div>
    </div>
  );
};