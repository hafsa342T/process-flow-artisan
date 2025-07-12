import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { processData, industry } = await req.json();

    // Generate a styled HTML report
    const htmlReport = generateStyledReport(processData, industry);
    
    // Convert HTML to a simple text-based PDF (for now)
    // In production, you would use puppeteer or similar
    const pdfBase64 = btoa(htmlReport);

    return new Response(JSON.stringify({ 
      pdf: pdfBase64,
      filename: `${industry.replace(/\s+/g, '_')}_ISO9001_Process_Map.pdf`
    }), {
      headers: { 
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Error generating PDF:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to generate PDF'
    }), {
      status: 500,
      headers: { 
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});

function generateStyledReport(processData: any, industry: string): string {
  const processes = processData?.processes || [];
  const interactions = processData?.interactions || [];
  
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>ISO 9001 Process Map - ${industry}</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            margin: 40px; 
            line-height: 1.6; 
            color: #333;
        }
        .header { 
            text-align: center; 
            border-bottom: 3px solid #3b82f6; 
            padding-bottom: 20px; 
            margin-bottom: 30px;
        }
        .header h1 { 
            color: #1e40af; 
            margin: 0; 
            font-size: 28px;
        }
        .header h2 { 
            color: #6b7280; 
            margin: 5px 0 0 0; 
            font-weight: normal;
        }
        .section { 
            margin: 30px 0; 
        }
        .section h3 { 
            color: #1e40af; 
            border-bottom: 2px solid #e5e7eb; 
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        .process-card { 
            border: 1px solid #d1d5db; 
            border-radius: 8px; 
            padding: 20px; 
            margin: 15px 0; 
            background: #f9fafb;
        }
        .process-title { 
            font-size: 18px; 
            font-weight: bold; 
            color: #1f2937; 
            margin-bottom: 10px;
        }
        .process-category { 
            display: inline-block; 
            padding: 4px 12px; 
            border-radius: 20px; 
            font-size: 12px; 
            font-weight: bold; 
            text-transform: uppercase;
            margin-bottom: 15px;
        }
        .core { background: #dcfce7; color: #166534; }
        .support { background: #fef3c7; color: #92400e; }
        .management { background: #e0e7ff; color: #3730a3; }
        .process-details { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 15px; 
            margin-top: 15px;
        }
        .detail-item { 
            margin-bottom: 10px;
        }
        .detail-label { 
            font-weight: bold; 
            color: #374151; 
            margin-bottom: 5px;
        }
        .detail-content { 
            color: #6b7280; 
            font-size: 14px;
        }
        .interactions { 
            margin-top: 30px;
        }
        .interaction-item { 
            background: #f3f4f6; 
            padding: 15px; 
            margin: 10px 0; 
            border-left: 4px solid #3b82f6; 
            border-radius: 4px;
        }
        .summary { 
            background: #eff6ff; 
            padding: 20px; 
            border-radius: 8px; 
            margin: 30px 0;
        }
        .footer { 
            text-align: center; 
            margin-top: 40px; 
            padding-top: 20px; 
            border-top: 1px solid #e5e7eb; 
            color: #6b7280; 
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>ISO 9001:2015 Process Map</h1>
        <h2>${industry}</h2>
        <p>Generated on ${new Date().toLocaleDateString()}</p>
    </div>

    <div class="summary">
        <h3>Executive Summary</h3>
        <p>This document outlines the process map for <strong>${industry}</strong> operations in accordance with ISO 9001:2015 requirements. 
        The process map includes ${processes.length} processes categorized into core, support, and management processes.</p>
    </div>

    <div class="section">
        <h3>Process Overview</h3>
        ${processes.map((process: any) => `
            <div class="process-card">
                <div class="process-title">${process.name}</div>
                <span class="process-category ${process.category}">${process.category}</span>
                
                <div class="process-details">
                    <div>
                        <div class="detail-item">
                            <div class="detail-label">Process Owner</div>
                            <div class="detail-content">${process.owner}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Key Inputs</div>
                            <div class="detail-content">${process.inputs?.join(', ') || 'Not specified'}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Key Outputs</div>
                            <div class="detail-content">${process.outputs?.join(', ') || 'Not specified'}</div>
                        </div>
                    </div>
                    <div>
                        <div class="detail-item">
                            <div class="detail-label">Primary Risk</div>
                            <div class="detail-content">${process.risk || 'Risk assessment pending'}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Key Performance Indicator</div>
                            <div class="detail-content">${process.kpi || 'KPI to be defined'}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">ISO 9001 Clauses</div>
                            <div class="detail-content">${process.isoClauses?.join(', ') || 'To be mapped'}</div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('')}
    </div>

    ${interactions.length > 0 ? `
    <div class="section interactions">
        <h3>Process Interactions</h3>
        ${interactions.map((interaction: any) => `
            <div class="interaction-item">
                <strong>${interaction.from}</strong> → <strong>${interaction.to}</strong>
                ${interaction.description ? `<br><span style="color: #6b7280; font-size: 14px;">${interaction.description}</span>` : ''}
            </div>
        `).join('')}
    </div>
    ` : ''}

    <div class="footer">
        Generated by ISO 9001 Process Mapper | ${new Date().toLocaleDateString()}
    </div>
</body>
</html>
  `;
}