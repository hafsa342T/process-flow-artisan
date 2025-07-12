import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Brain, Building2, Loader2 } from 'lucide-react';

interface ProcessInputProps {
  industry: string;
  coreProcesses: string;
  onIndustryChange: (value: string) => void;
  onCoreProcessesChange: (value: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

export const ProcessInput: React.FC<ProcessInputProps> = ({
  industry,
  coreProcesses,
  onIndustryChange,
  onCoreProcessesChange,
  onGenerate,
  isGenerating
}) => {
  const canGenerate = industry.trim() && coreProcesses.trim();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Welcome Section */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-3 p-4 bg-primary-light rounded-xl">
          <Brain className="h-8 w-8 text-primary" />
          <div className="text-left">
            <h2 className="text-xl font-semibold text-primary">AI-Powered Process Generation</h2>
            <p className="text-sm text-primary/80">Enter minimal information to generate complete ISO 9001 process documentation</p>
          </div>
        </div>
      </div>

      {/* Input Form */}
      <Card className="shadow-lg border-0 bg-gradient-to-br from-card to-card/80">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl flex items-center gap-2 justify-center">
            <Building2 className="h-6 w-6 text-primary" />
            Process Information
          </CardTitle>
          <CardDescription className="text-base">
            Provide your industry and core processes to generate comprehensive ISO 9001 documentation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="industry" className="text-sm font-medium">Industry or Sector</Label>
            <Input
              id="industry"
              placeholder="e.g., Food Manufacturing, Software Development, Healthcare Services"
              value={industry}
              onChange={(e) => onIndustryChange(e.target.value)}
              className="h-12 text-base"
            />
            <p className="text-xs text-muted-foreground">
              Specify your industry to get relevant process recommendations
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="processes" className="text-sm font-medium">Core Processes (1-7 items)</Label>
            <Textarea
              id="processes"
              placeholder="List your main processes, e.g.:&#10;Purchasing&#10;Production&#10;Customer Service&#10;Quality Control"
              value={coreProcesses}
              onChange={(e) => onCoreProcessesChange(e.target.value)}
              className="min-h-[120px] text-base resize-none"
            />
            <p className="text-xs text-muted-foreground">
              List each process on a new line or separate with commas
            </p>
          </div>

          <div className="pt-4">
            <Button 
              onClick={onGenerate}
              disabled={!canGenerate || isGenerating}
              className="w-full h-12 text-base font-medium"
              variant="professional"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Generating Process Map...
                </>
              ) : (
                <>
                  <Brain className="h-5 w-5" />
                  Generate ISO 9001 Process Map
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Feature Preview */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="border-accent/20 bg-accent-light/30">
          <CardContent className="p-4 text-center">
            <div className="w-8 h-8 bg-accent/20 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Brain className="h-4 w-4 text-accent" />
            </div>
            <h3 className="font-medium text-sm mb-1">AI Analysis</h3>
            <p className="text-xs text-muted-foreground">Intelligent process categorization and risk assessment</p>
          </CardContent>
        </Card>
        
        <Card className="border-primary/20 bg-primary-light/30">
          <CardContent className="p-4 text-center">
            <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Building2 className="h-4 w-4 text-primary" />
            </div>
            <h3 className="font-medium text-sm mb-1">ISO Compliance</h3>
            <p className="text-xs text-muted-foreground">Automatic mapping to ISO 9001:2015 clauses</p>
          </CardContent>
        </Card>
        
        <Card className="border-success/20 bg-success/10">
          <CardContent className="p-4 text-center">
            <div className="w-8 h-8 bg-success/20 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Building2 className="h-4 w-4 text-success" />
            </div>
            <h3 className="font-medium text-sm mb-1">Export Ready</h3>
            <p className="text-xs text-muted-foreground">Professional documentation for audits</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};