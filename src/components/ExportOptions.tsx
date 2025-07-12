import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Download, FileText, Image, FileSpreadsheet, ChevronDown } from 'lucide-react';
import { ProcessMappingData } from './ProcessMappingTool';

interface ExportOptionsProps {
  data: ProcessMappingData;
}

export const ExportOptions: React.FC<ExportOptionsProps> = ({ data }) => {
  const exportAsCSV = () => {
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
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'iso9001-process-map.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const exportAsJSON = () => {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'iso9001-process-map.json';
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const exportAsPDF = () => {
    // This would integrate with a PDF library like jsPDF
    // For now, we'll create a printable HTML version
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>ISO 9001 Process Map</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .process { margin-bottom: 20px; border: 1px solid #ddd; padding: 15px; }
            .process-name { font-size: 18px; font-weight: bold; margin-bottom: 10px; }
            .category { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
            .core { background-color: #1e40af; color: white; }
            .support { background-color: #0891b2; color: white; }
            .management { background-color: #7c3aed; color: white; }
            .section { margin: 10px 0; }
            .label { font-weight: bold; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>ISO 9001 Process Map</h1>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
          </div>
          ${data.processes.map(process => `
            <div class="process">
              <div class="process-name">
                ${process.name}
                <span class="category ${process.category}">${process.category.toUpperCase()}</span>
              </div>
              <div class="section">
                <div class="label">INPUTS:</div>
                <div>${process.inputs.join(', ')}</div>
              </div>
              <div class="section">
                <div class="label">OUTPUTS:</div>
                <div>${process.outputs.join(', ')}</div>
              </div>
              <div class="section">
                <div class="label">KEY RISK:</div>
                <div>${process.risk}</div>
              </div>
              <div class="section">
                <div class="label">KPI:</div>
                <div>${process.kpi}</div>
              </div>
              <div class="section">
                <div class="label">OWNER:</div>
                <div>${process.owner}</div>
              </div>
              <div class="section">
                <div class="label">ISO CLAUSES:</div>
                <div>${process.isoClauses.join(', ')}</div>
              </div>
            </div>
          `).join('')}
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="gap-2">
          <Download className="h-4 w-4" />
          Export
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={exportAsCSV} className="gap-2">
          <FileSpreadsheet className="h-4 w-4" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportAsJSON} className="gap-2">
          <FileText className="h-4 w-4" />
          Export as JSON
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportAsPDF} className="gap-2">
          <FileText className="h-4 w-4" />
          Print/Save PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};