import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Download, 
  FileText, 
  Image, 
  FileSpreadsheet, 
  Mail, 
  ArrowLeft,
  CheckCircle,
  Clock,
  Shield,
  TrendingUp,
  RotateCcw
} from 'lucide-react';
import { ProcessMappingData } from './ProcessMappingTool';
import { ProcessList } from './ProcessList';
import { ProcessFlow } from './ProcessFlow';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ResultsViewProps {
  data: ProcessMappingData;
  industry: string;
  userEmail: string;
  onBack: () => void;
  onStartOver: () => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({ 
  data, 
  industry, 
  userEmail, 
  onBack,
  onStartOver 
}) => {
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownload = async (format: 'pdf' | 'csv' | 'json' | 'png') => {
    setDownloading(format);
    
    try {
      switch (format) {
        case 'csv':
          downloadCSV();
          break;
        case 'json':
          downloadJSON();
          break;
        case 'pdf':
          // This would call a Supabase Edge Function to generate PDF
          await downloadPDF();
          break;
        case 'png':
          // This would call a Supabase Edge Function to generate PNG
          await downloadPNG();
          break;
      }
    } catch (error) {
      console.error(`Error downloading ${format}:`, error);
    } finally {
      setDownloading(null);
    }
  };

  const downloadCSV = () => {
    const headers = ['Process Name', 'Category', 'Inputs', 'Outputs', 'Risk', 'KPI', 'Owner', 'ISO Clauses'];
    const rows = data.processes.map(process => [
      process.name,
      process.category,
      process.inputs.join('; '),
      process.outputs.join('; '),
      process.risk,
      process.kpi,
      process.owner,
      process.isoClauses.join('; ')
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `iso-9001-process-map-${industry.toLowerCase().replace(/\s+/g, '-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadJSON = () => {
    const jsonData = {
      industry,
      generatedAt: new Date().toISOString(),
      userEmail,
      ...data
    };

    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `iso-9001-process-map-${industry.toLowerCase().replace(/\s+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
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

  const downloadPDF = async () => {
    try {
      toast('Generating report...', { duration: 2000 });
      
      const { data: pdfData, error } = await supabase.functions.invoke('generate-pdf-report', {
        body: { processData: data, industry, userEmail }
      });
      
      if (error) {
        console.error('PDF generation error:', error);
        throw error;
      }
      
      console.log('PDF data received:', pdfData);
      
      // Create and download the HTML file
      const htmlBlob = base64ToBlob(pdfData.pdf, 'text/html');
      const url = URL.createObjectURL(htmlBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = pdfData.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast('Report downloaded successfully!');
    } catch (error) {
      console.error('Error downloading report:', error);
      toast('Failed to generate report. Please try again.');
    }
  };

  const downloadPNG = async () => {
    try {
      toast('Generating process diagram...', { duration: 2000 });
      
      const { data: pngData, error } = await supabase.functions.invoke('generate-png-diagram', {
        body: { processData: data, industry }
      });
      
      if (error) throw error;
      
      // Create and download the PNG file
      const pngBlob = base64ToBlob(pngData.png, 'image/png');
      const url = URL.createObjectURL(pngBlob);
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

  const getCoreProcessCount = () => data.processes.filter(p => p.category === 'core').length;
  const getSupportProcessCount = () => data.processes.filter(p => p.category === 'support').length;
  const getManagementProcessCount = () => data.processes.filter(p => p.category === 'management').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with download options */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <div className="h-4 w-px bg-border" />
                <Button variant="ghost" size="sm" onClick={onStartOver} className="gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Try Another
                </Button>
                <div className="h-4 w-px bg-border" />
                <Badge variant="secondary" className="gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Report Sent to {userEmail}
                </Badge>
              </div>
              <CardTitle className="text-2xl">ISO 9001 Process Map - {industry}</CardTitle>
              <CardDescription>
                Complete process documentation with {data.processes.length} processes mapped
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="space-y-2">
              <div className="text-2xl font-bold text-primary">{getCoreProcessCount()}</div>
              <div className="text-sm text-muted-foreground">Core Processes</div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-accent">{getSupportProcessCount()}</div>
              <div className="text-sm text-muted-foreground">Support Processes</div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-warning">{getManagementProcessCount()}</div>
              <div className="text-sm text-muted-foreground">Management Processes</div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-foreground">{data.interactions.length}</div>
              <div className="text-sm text-muted-foreground">Process Interactions</div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">Download Your Report</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button
                variant="outline"
                onClick={() => handleDownload('csv')}
                disabled={downloading === 'csv'}
                className="gap-2 h-auto p-4 flex-col"
              >
                <FileSpreadsheet className="h-5 w-5" />
                <span className="text-xs">CSV Data</span>
                {downloading === 'csv' && <div className="text-xs text-muted-foreground">Downloading...</div>}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => handleDownload('json')}
                disabled={downloading === 'json'}
                className="gap-2 h-auto p-4 flex-col"
              >
                <FileText className="h-5 w-5" />
                <span className="text-xs">JSON Data</span>
                {downloading === 'json' && <div className="text-xs text-muted-foreground">Downloading...</div>}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => handleDownload('pdf')}
                disabled={downloading === 'pdf'}
                className="gap-2 h-auto p-4 flex-col"
              >
                <Download className="h-5 w-5" />
                <span className="text-xs">PDF Report</span>
                {downloading === 'pdf' && <div className="text-xs text-muted-foreground">Generating...</div>}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => handleDownload('png')}
                disabled={downloading === 'png'}
                className="gap-2 h-auto p-4 flex-col"
              >
                <Image className="h-5 w-5" />
                <span className="text-xs">PNG Diagram</span>
                {downloading === 'png' && <div className="text-xs text-muted-foreground">Generating...</div>}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed results */}
      <Tabs defaultValue="processes" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="processes">Process Details</TabsTrigger>
          <TabsTrigger value="flow">Process Flow</TabsTrigger>
        </TabsList>
        
        <TabsContent value="processes" className="space-y-4">
          <ProcessList data={data} onUpdate={() => {}} readOnly />
        </TabsContent>
        
        <TabsContent value="flow" className="space-y-4">
          <ProcessFlow data={data} />
        </TabsContent>
      </Tabs>
    </div>
  );
};