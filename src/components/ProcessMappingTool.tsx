import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Edit, ArrowLeft, Building2, FileText, ArrowRight, Download, ImageIcon, Mail } from 'lucide-react';
import { ProcessInput } from './ProcessInput';
import { ProcessList } from './ProcessList';
import { ProcessFlow } from './ProcessFlow';
import { EmailGate } from './EmailGate';
import { ResultsView } from './ResultsView';
import { getIndustryBenchmark } from '@/data/industryBenchmarks';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
      const { getIndustryBenchmark } = await import('@/data/industryBenchmarks');
      
      // Always try benchmark/industry-specific generation first for speed
      const benchmark = getIndustryBenchmark(industry);
      let processData: ProcessMappingData;
      
      if (benchmark) {
        // Use benchmark data for known industries (fast)
        console.log('Using benchmark data for known industry:', industry);
        processData = generateEnhancedBenchmarkProcessMap(industry, coreProcesses, benchmark);
      } else {
        // Use industry-specific processes (fast fallback)
        console.log('Generating industry-specific processes for:', industry);
        processData = generateIndustrySpecificProcessMap(industry, coreProcesses);
      }
      
      setGeneratedData(processData);
      setCurrentStep('generated');
    } catch (error) {
      console.error('Generation error:', error);
      // Final fallback
      const processData = generateIndustrySpecificProcessMap(industry, coreProcesses);
      setGeneratedData(processData);
      setCurrentStep('generated');
    } finally {
      setIsGenerating(false);
    }
  };

  // This function calls the Supabase Edge Function for AI generation
  const generateWithAI = async (industry: string, processes: string): Promise<ProcessMappingData> => {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const { data, error } = await supabase.functions.invoke('generate-process-map', {
        body: { 
          industry, 
          processes,
          prompt: buildAIPrompt(industry, processes)
        }
      });

      if (error) {
        throw new Error(`Edge Function Error: ${error.message}`);
      }

      return data.processMap;
    } catch (error) {
      console.error('AI generation error:', error);
      throw error; // Re-throw to trigger fallback in handleGenerate
    }
  };

  const buildAIPrompt = (industry: string, userProcesses: string): string => {
    return `
Generate a comprehensive ISO 9001:2015 process map for the ${industry} industry according to ISO 9001:2015 requirements.

User mentioned these processes: ${userProcesses}

CRITICAL: Generate industry-specific processes relevant to ${industry} following ISO 9001:2015 standards. For example:
- If dental clinic: include patient registration, appointment scheduling, clinical examinations, treatment planning, dental procedures, sterilization, billing, patient records management
- If restaurant: include menu planning, inventory management, food preparation, order taking, cooking, serving, cleaning, quality control
- If law firm: include client intake, case management, legal research, document preparation, court representation, billing

Requirements:
1. Focus on user-mentioned processes and relevant industry processes
2. Include realistic ${industry} industry core processes
3. Add supporting management and support processes as needed for ${industry}
4. Add detailed process interactions showing how processes feed into each other
5. Categorize all processes correctly (core/support/management) per ISO 9001:2015
6. Include realistic inputs, outputs, risks, KPIs, and responsible roles for ${industry}
7. Map to relevant ISO 9001:2015 clauses (4.4, 8.1, 8.2, 8.3, etc.)
8. Show process flow relationships with descriptions per ISO 9001:2015 process approach

Return ONLY valid JSON in this exact format:
{
  "processes": [
    {
      "id": "unique_id",
      "name": "Process Name",
      "category": "core|support|management",
      "inputs": ["input1", "input2", "input3"],
      "outputs": ["output1", "output2", "output3"],
      "risk": "Primary risk description",
      "kpi": "Key performance indicator with specific metric",
      "owner": "Responsible role/title",
      "isoClauses": ["clause1", "clause2"]
    }
  ],
  "interactions": [
    {
      "from": "Source Process Name",
      "to": "Target Process Name", 
      "description": "What flows between processes"
    }
  ],
  "processFlow": {
    "primaryFlow": ["process1", "process2", "process3"],
    "supportingFlows": [
      {
        "name": "Support Flow Name",
        "processes": ["support1", "support2"]
      }
    ],
    "feedbackLoops": [
      {
        "from": "end_process",
        "to": "start_process",
        "description": "Improvement feedback"
      }
    ]
  }
}

Focus on ${industry} industry best practices and current ISO 9001:2015 requirements based on user input.
`;
  };
  const generateEnhancedBenchmarkProcessMap = (industry: string, userProcesses: string, benchmark: any): ProcessMappingData => {
    const userProcessList = userProcesses.split('\n').filter(p => p.trim());
    
    // Start with only user processes - no mandatory processes
    const allProcesses = [...userProcessList];
    
    // Add benchmark processes if available
    if (benchmark) {
      benchmark.commonProcesses.core.forEach((process: string) => {
        if (!allProcesses.some(up => up.toLowerCase().includes(process.toLowerCase().split(' ')[0]))) {
          allProcesses.push(process);
        }
      });
      
      benchmark.commonProcesses.support.forEach((process: string) => {
        if (!allProcesses.some(up => up.toLowerCase().includes(process.toLowerCase().split(' ')[0]))) {
          allProcesses.push(process);
        }
      });
      
      benchmark.commonProcesses.management.forEach((process: string) => {
        if (!allProcesses.some(up => up.toLowerCase().includes(process.toLowerCase().split(' ')[0]))) {
          allProcesses.push(process);
        }
      });
    }

    const processes: ProcessData[] = allProcesses.map((name, index) => {
      let category: 'core' | 'support' | 'management' = 'core';
      
      // Categorize processes based on benchmark data or intelligent defaults
      if (benchmark?.commonProcesses.core.includes(name)) {
        category = 'core';
      } else if (benchmark?.commonProcesses.support.includes(name)) {
        category = 'support';
      } else if (benchmark?.commonProcesses.management.includes(name)) {
        category = 'management';
      } else {
        // For user processes without benchmark data, use intelligent categorization
        const nameLower = name.toLowerCase();
        if (nameLower.includes('management') || nameLower.includes('leadership') || nameLower.includes('strategy') || nameLower.includes('planning')) {
          category = 'management';
        } else if (nameLower.includes('support') || nameLower.includes('training') || nameLower.includes('hr') || nameLower.includes('maintenance') || nameLower.includes('it')) {
          category = 'support';
        } else {
          category = 'core'; // Default to core for business processes
        }
      }
      
      return {
        id: String(index + 1),
        name,
        category,
        inputs: [`${name} inputs`, 'Requirements', 'Resources'],
        outputs: [`${name} outputs`, 'Deliverables', 'Reports'],
        risk: benchmark?.industryRisks[index % (benchmark.industryRisks.length || 1)] || 'Process failure risk',
        kpi: benchmark?.commonKPIs[index % (benchmark.commonKPIs.length || 1)] || 'Process performance metric',
        owner: `${name} Manager`,
        isoClauses: ['4.4', '8.1', '8.2', '9.1']
      };
    });

    const interactions: ProcessInteraction[] = [];
    for (let i = 0; i < processes.length - 1; i++) {
      if (processes[i].category === 'core' && processes[i + 1].category === 'core') {
        interactions.push({
          from: processes[i].name,
          to: processes[i + 1].name,
          description: 'Process output feeds next process per ISO 9001:2015'
        });
      }
    }

    return { processes, interactions };
  };

  // Generate industry-specific processes when AI is not available
  const generateIndustrySpecificProcessMap = (industry: string, userProcesses: string): ProcessMappingData => {
    const userProcessList = userProcesses.split('\n').filter(p => p.trim());
    const industryLower = industry.toLowerCase();
    
    // Define industry-specific processes
    let industryProcesses: string[] = [];
    
    if (industryLower.includes('dental') || industryLower.includes('clinic')) {
      industryProcesses = [
        'Patient Registration',
        'Appointment Scheduling', 
        'Clinical Examination',
        'Treatment Planning',
        'Dental Procedures',
        'Sterilization & Infection Control',
        'Patient Records Management',
        'Billing & Insurance Processing',
        'Equipment Maintenance',
        'Quality Assurance'
      ];
    } else if (industryLower.includes('restaurant') || industryLower.includes('food')) {
      industryProcesses = [
        'Menu Planning',
        'Inventory Management',
        'Food Preparation',
        'Order Taking',
        'Cooking & Food Service',
        'Customer Service',
        'Cleaning & Sanitation',
        'Staff Management',
        'Quality Control',
        'Financial Management'
      ];
    } else if (industryLower.includes('law') || industryLower.includes('legal')) {
      industryProcesses = [
        'Client Intake',
        'Case Management',
        'Legal Research',
        'Document Preparation',
        'Court Representation',
        'Client Communication',
        'Billing & Time Tracking',
        'Compliance Management',
        'File Management',
        'Professional Development'
      ];
    } else {
      // Generic business processes
      industryProcesses = [
        'Customer Service',
        'Operations Management',
        'Quality Control',
        'Sales Process',
        'Marketing',
        'Financial Management',
        'Human Resources',
        'Supply Chain',
        'Technology Management',
        'Compliance'
      ];
    }
    
    // Start with only user processes - no mandatory processes
    const allProcesses = [...userProcessList];
    
    // Add industry-specific processes
    industryProcesses.forEach(ip => {
      if (!allProcesses.some(up => up.toLowerCase().includes(ip.toLowerCase().split(' ')[0].toLowerCase()))) {
        allProcesses.push(ip);
      }
    });

    const processes: ProcessData[] = allProcesses.map((name, index) => {
      let category: 'core' | 'support' | 'management' = 'core';
      
      // Categorize processes using intelligent defaults
      const nameLower = name.toLowerCase();
      if (nameLower.includes('management') || nameLower.includes('leadership') || nameLower.includes('strategy') || nameLower.includes('planning')) {
        category = 'management';
      } else if (nameLower.includes('support') || nameLower.includes('training') || nameLower.includes('hr') || nameLower.includes('maintenance') || nameLower.includes('it')) {
        category = 'support';
      } else {
        // Industry processes are typically core, but use intelligent categorization
        if (industryProcesses.includes(name)) {
          category = 'core';
        } else {
          // For user processes, make intelligent decisions
          if (nameLower.includes('quality') || nameLower.includes('control') || nameLower.includes('assurance')) {
            category = 'support';
          } else if (nameLower.includes('admin') || nameLower.includes('oversight')) {
            category = 'management';
          } else {
            category = 'core'; // Default to core for business processes
          }
        }
      }
      
      return {
        id: String(index + 1),
        name,
        category,
        inputs: [`${name} requirements`, 'Resources', 'Information'],
        outputs: [`${name} deliverables`, 'Documentation', 'Reports'],
        risk: `${name} failure or delays`,
        kpi: `${name} efficiency and quality metrics`,
        owner: `${name.split(' ')[0]} Manager`,
        isoClauses: ['4.4', '8.1', '8.2', '9.1']
      };
    });

    const interactions: ProcessInteraction[] = [];
    for (let i = 0; i < Math.min(processes.length - 1, 8); i++) {
      interactions.push({
        from: processes[i].name,
        to: processes[i + 1].name,
        description: `${processes[i].name} output feeds into ${processes[i + 1].name}`
      });
    }

    return { processes, interactions };
  };

  // Download functions
  const downloadPDF = async (data: ProcessMappingData, industry: string) => {
    try {
      toast('Generating PDF report...', { duration: 2000 });
      
      const { data: pdfData, error } = await supabase.functions.invoke('generate-pdf-report', {
        body: { processData: data, industry }
      });
      
      if (error) throw error;
      
      // Create and download the PDF file
      const pdfBlob = base64ToBlob(pdfData.pdf, 'text/html');
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = pdfData.filename.replace('.pdf', '.html');
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast('PDF report downloaded successfully!');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast('Failed to generate PDF report. Please try again.');
    }
  };

  const downloadPNG = async (data: ProcessMappingData, industry: string) => {
    try {
      toast('Generating process diagram...', { duration: 2000 });
      
      const { data: pngData, error } = await supabase.functions.invoke('generate-png-diagram', {
        body: { processData: data, industry }
      });
      
      if (error) throw error;
      
      // Create and download the SVG file
      const svgBlob = base64ToBlob(pngData.png, 'image/svg+xml');
      const url = URL.createObjectURL(svgBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = pngData.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast('Process diagram downloaded successfully!');
    } catch (error) {
      console.error('Error downloading PNG:', error);
      toast('Failed to generate process diagram. Please try again.');
    }
  };

  // Utility function to convert base64 to blob
  const base64ToBlob = (base64: string, mimeType: string): Blob => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
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

  const handleStartOver = () => {
    setCurrentStep('input');
    setIndustry('');
    setCoreProcesses('');
    setGeneratedData(null);
    setUserEmail('');
  };

  const handleEmailSubmitted = (email: string) => {
    setUserEmail(email);
    
    // Store process data in localStorage for payment page
    if (generatedData) {
      localStorage.setItem('processData', JSON.stringify(generatedData));
    }
    
    // Redirect to payment page instead of results
    window.location.href = `/payment?email=${encodeURIComponent(email)}&industry=${encodeURIComponent(industry)}`;
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
              <p className="text-muted-foreground">Making ISO Certification Accessible</p>
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
                <Button 
                  onClick={() => setCurrentStep('email-gate')}
                  className="gap-2"
                >
                  <Mail className="h-4 w-4" />
                  Get Report
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
            onStartOver={handleStartOver}
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