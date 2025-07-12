import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Brain, Building2, Loader2, Lightbulb, Plus, X, Sparkles } from 'lucide-react';
import { getIndustryBenchmark, IndustryBenchmark } from '@/data/industryBenchmarks';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  const [benchmark, setBenchmark] = useState<IndustryBenchmark | null>(null);
  const [selectedBenchmarkProcesses, setSelectedBenchmarkProcesses] = useState<string[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isLoadingAiSuggestions, setIsLoadingAiSuggestions] = useState(false);
  const [showAiSuggestions, setShowAiSuggestions] = useState(false);

  useEffect(() => {
    if (industry.trim()) {
      const foundBenchmark = getIndustryBenchmark(industry);
      setBenchmark(foundBenchmark);
    } else {
      setBenchmark(null);
      setSelectedBenchmarkProcesses([]);
    }
  }, [industry]);

  const handleAddBenchmarkProcess = (process: string) => {
    if (!selectedBenchmarkProcesses.includes(process)) {
      const updated = [...selectedBenchmarkProcesses, process];
      setSelectedBenchmarkProcesses(updated);
      onCoreProcessesChange(updated.join('\n'));
    }
  };

  const handleRemoveBenchmarkProcess = (process: string) => {
    const updated = selectedBenchmarkProcesses.filter(p => p !== process);
    setSelectedBenchmarkProcesses(updated);
    onCoreProcessesChange(updated.join('\n'));
  };

  const handleGetAiSuggestions = async () => {
    if (!industry.trim()) {
      toast.error('Please enter an industry first');
      return;
    }

    setIsLoadingAiSuggestions(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-process-map', {
        body: {
          industry: industry,
          coreProcesses: 'Generate industry-specific benchmark processes',
          onlyBenchmarks: true
        }
      });

      if (error) throw error;

      if (data?.processes) {
        const processes = data.processes.map((p: any) => p.name);
        setAiSuggestions(processes);
        setShowAiSuggestions(true);
        toast.success('AI suggestions generated successfully!');
      }
    } catch (error) {
      console.error('Error getting AI suggestions:', error);
      toast.error('Failed to get AI suggestions. Please try again.');
    } finally {
      setIsLoadingAiSuggestions(false);
    }
  };

  const handleAddAiSuggestion = (process: string) => {
    if (!selectedBenchmarkProcesses.includes(process)) {
      const updated = [...selectedBenchmarkProcesses, process];
      setSelectedBenchmarkProcesses(updated);
      onCoreProcessesChange(updated.join('\n'));
    }
  };

  const handleRemoveAiSuggestion = (process: string) => {
    const updated = selectedBenchmarkProcesses.filter(p => p !== process);
    setSelectedBenchmarkProcesses(updated);
    onCoreProcessesChange(updated.join('\n'));
  };

  const handleGenerate = () => {
    onGenerate(); // No API key needed from client
  };

  const canGenerate = industry.trim() && coreProcesses.trim();

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      {/* Welcome Section */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-3 p-6 bg-gradient-to-r from-primary-light to-accent-light rounded-xl animate-pulse-glow">
          <Brain className="h-10 w-10 text-primary" />
          <div className="text-left">
            <h2 className="text-2xl font-bold text-primary">Intelligent Process Generation</h2>
            <p className="text-primary/80">Industry benchmarks + Smart analysis = Comprehensive ISO 9001 documentation</p>
          </div>
        </div>
      </div>


      <div className="grid lg:grid-cols-2 gap-8">
        {/* Input Form */}
        <Card className="shadow-lg border-0 bg-gradient-to-br from-card to-card/80">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Building2 className="h-6 w-6 text-primary" />
              Industry & Process Information
            </CardTitle>
            <CardDescription>
              Start with your industry to get relevant benchmarks and suggestions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="industry" className="text-sm font-medium">Industry or Sector</Label>
              <div className="flex gap-2">
                <Input
                  id="industry"
                  placeholder="e.g., Dental Clinic, Restaurant, Law Firm"
                  value={industry}
                  onChange={(e) => onIndustryChange(e.target.value)}
                  className="h-12 text-base flex-1"
                />
                <Button
                  onClick={handleGetAiSuggestions}
                  disabled={!industry.trim() || isLoadingAiSuggestions}
                  className="h-12 px-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 animate-pulse"
                >
                  {isLoadingAiSuggestions ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Be specific for better results. Click the sparkle button to get industry-specific processes.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="processes" className="text-sm font-medium">Your Processes</Label>
              <Textarea
                id="processes"
                placeholder="Add processes from suggestions or enter your own..."
                value={coreProcesses}
                onChange={(e) => {
                  onCoreProcessesChange(e.target.value);
                  setSelectedBenchmarkProcesses(e.target.value.split('\n').filter(p => p.trim()));
                }}
                className="min-h-[200px] text-base resize-none"
              />
            </div>

            <Button 
              onClick={handleGenerate}
              disabled={!canGenerate || isGenerating}
              className="w-full h-12 text-base font-medium"
              variant="professional"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Generating Comprehensive Process Map...
                </>
              ) : (
                <>
                  <Brain className="h-5 w-5" />
                  Generate ISO 9001 Process Map
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* AI Suggestions */}
        {showAiSuggestions && aiSuggestions.length > 0 && (
          <Card className="shadow-lg border-primary/30 bg-gradient-to-br from-primary-light/20 to-primary-light/10 animate-scale-in">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" />
                Suggested Processes for {industry}
              </CardTitle>
              <CardDescription>
                Industry-specific processes tailored for your business. Select the ones relevant to your needs.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-medium text-sm mb-3 text-primary">SUGGESTED PROCESSES</h4>
                <div className="grid gap-2 max-h-64 overflow-y-auto">
                  {aiSuggestions.map((process, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-card rounded border">
                      <span className="text-sm">{process}</span>
                      {selectedBenchmarkProcesses.includes(process) ? (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleRemoveAiSuggestion(process)}
                          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      ) : (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleAddAiSuggestion(process)}
                          className="h-6 w-6 p-0"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Industry Benchmarks */}
        {benchmark && !showAiSuggestions && (
          <Card className="shadow-lg border-accent/30 bg-gradient-to-br from-accent-light/20 to-accent-light/10 animate-scale-in">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Lightbulb className="h-6 w-6 text-accent" />
                {benchmark.industry} Benchmarks
              </CardTitle>
              <CardDescription>
                Industry-standard processes based on best practices
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Core Processes */}
              <div>
                <h4 className="font-medium text-sm mb-3 text-process-core">CORE PROCESSES</h4>
                <div className="grid gap-2 max-h-48 overflow-y-auto">
                  {benchmark.commonProcesses.core.map((process, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-card rounded border">
                      <span className="text-sm">{process}</span>
                      {selectedBenchmarkProcesses.includes(process) ? (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleRemoveBenchmarkProcess(process)}
                          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      ) : (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleAddBenchmarkProcess(process)}
                          className="h-6 w-6 p-0"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Support Processes Preview */}
              <div>
                <h4 className="font-medium text-sm mb-2 text-process-support">SUPPORT PROCESSES</h4>
                <div className="flex flex-wrap gap-1">
                  {benchmark.commonProcesses.support.slice(0, 4).map((process, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {process}
                    </Badge>
                  ))}
                  <Badge variant="outline" className="text-xs">
                    +{benchmark.commonProcesses.support.length - 4} more
                  </Badge>
                </div>
              </div>

              {/* Management Processes Preview */}
              <div>
                <h4 className="font-medium text-sm mb-2 text-process-management">MANAGEMENT PROCESSES</h4>
                <div className="flex flex-wrap gap-1">
                  {benchmark.commonProcesses.management.slice(0, 3).map((process, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {process}
                    </Badge>
                  ))}
                  <Badge variant="outline" className="text-xs">
                    +{benchmark.commonProcesses.management.length - 3} more
                  </Badge>
                </div>
              </div>

              {/* Industry Insights */}
              <div className="pt-4 border-t">
                <h4 className="font-medium text-sm mb-2">Industry Insights</h4>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p><strong>Common Risks:</strong> {benchmark.industryRisks.slice(0, 2).join(', ')}</p>
                  <p><strong>Key KPIs:</strong> {benchmark.commonKPIs.slice(0, 2).join(', ')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Show both AI suggestions and benchmarks if both exist */}
        {benchmark && showAiSuggestions && (
          <Card className="shadow-lg border-accent/30 bg-gradient-to-br from-accent-light/20 to-accent-light/10">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Lightbulb className="h-6 w-6 text-accent" />
                {benchmark.industry} Standard Benchmarks
              </CardTitle>
              <CardDescription>
                Industry-standard processes for reference
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-sm mb-2 text-process-core">CORE PROCESSES</h4>
                <div className="flex flex-wrap gap-1">
                  {benchmark.commonProcesses.core.slice(0, 4).map((process, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {process}
                    </Badge>
                  ))}
                  <Badge variant="outline" className="text-xs">
                    +{benchmark.commonProcesses.core.length - 4} more
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Feature Preview */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="border-accent/20 bg-accent-light/30 hover:shadow-lg transition-shadow">
          <CardContent className="p-4 text-center">
            <div className="w-8 h-8 bg-accent/20 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Brain className="h-4 w-4 text-accent" />
            </div>
            <h3 className="font-medium text-sm mb-1">Smart Analysis</h3>
            <p className="text-xs text-muted-foreground">Real-time industry trends and process optimization</p>
          </CardContent>
        </Card>
        
        <Card className="border-primary/20 bg-primary-light/30 hover:shadow-lg transition-shadow">
          <CardContent className="p-4 text-center">
            <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Building2 className="h-4 w-4 text-primary" />
            </div>
            <h3 className="font-medium text-sm mb-1">Benchmark Data</h3>
            <p className="text-xs text-muted-foreground">Industry-standard processes and best practices</p>
          </CardContent>
        </Card>
        
        <Card className="border-success/20 bg-success/10 hover:shadow-lg transition-shadow">
          <CardContent className="p-4 text-center">
            <div className="w-8 h-8 bg-success/20 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Building2 className="h-4 w-4 text-success" />
            </div>
            <h3 className="font-medium text-sm mb-1">ISO Compliance</h3>
            <p className="text-xs text-muted-foreground">Automatic mapping to ISO 9001:2015 clauses</p>
          </CardContent>
        </Card>

        <Card className="border-warning/20 bg-warning/10 hover:shadow-lg transition-shadow">
          <CardContent className="p-4 text-center">
            <div className="w-8 h-8 bg-warning/20 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Lightbulb className="h-4 w-4 text-warning" />
            </div>
            <h3 className="font-medium text-sm mb-1">Process Flow</h3>
            <p className="text-xs text-muted-foreground">Detailed interaction mapping and dependencies</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};