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
    const { processData, industry, userEmail } = await req.json();

    console.log('Generating PDF for:', industry, 'User:', userEmail);

    // Generate a styled HTML report
    const htmlReport = generateStyledReport(processData, industry);
    
    // For now, we'll return the HTML as base64 but with proper PDF generation
    // In a production environment, you would use puppeteer or similar to convert HTML to actual PDF
    // For this demo, we'll create a downloadable HTML file with PDF styling
    const htmlBase64 = btoa(unescape(encodeURIComponent(htmlReport)));

    console.log('PDF generation successful');

    return new Response(JSON.stringify({ 
      pdf: htmlBase64,
      filename: `${industry.replace(/\s+/g, '_')}_ISO9001_Process_Report.html`,
      contentType: 'text/html'
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
        .process-flow { 
            background: #f8fafc; 
            border: 1px solid #e5e7eb; 
            border-radius: 8px; 
            padding: 20px; 
            overflow-x: auto;
        }
        .hierarchy-container {
            display: flex;
            flex-direction: column;
            gap: 30px;
            align-items: center;
        }
        .hierarchy-level {
            display: flex;
            flex-wrap: wrap;
            gap: 15px;
            justify-content: center;
            width: 100%;
        }
        .hierarchy-title {
            font-weight: bold;
            color: #374151;
            margin-bottom: 15px;
            text-align: center;
            width: 100%;
        }
        .network-container {
            position: relative;
            min-height: 400px;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 20px;
            align-items: start;
        }
        .network-process {
            background: #3b82f6;
            color: white;
            padding: 12px;
            border-radius: 8px;
            text-align: center;
            font-weight: bold;
            font-size: 11px;
            position: relative;
            margin: 10px;
        }
        .network-process.core { background: #10b981; }
        .network-process.support { background: #f59e0b; }
        .network-process.management { background: #8b5cf6; }
        .network-connections {
            margin-top: 8px;
            font-size: 10px;
            font-weight: normal;
            opacity: 0.9;
        }
        .connection-arrow {
            color: #374151;
            font-size: 12px;
            margin: 2px 0;
        }
        .flow-container { 
            position: relative; 
            min-height: 300px; 
            display: flex; 
            flex-wrap: wrap; 
            gap: 20px; 
            justify-content: center;
        }
        .flow-process { 
            background: #3b82f6; 
            color: white; 
            padding: 15px; 
            border-radius: 8px; 
            min-width: 120px; 
            text-align: center; 
            font-weight: bold; 
            font-size: 12px; 
            position: relative;
        }
        .flow-process.core { background: #10b981; }
        .flow-process.support { background: #f59e0b; }
        .flow-process.management { background: #8b5cf6; }
        .flow-arrow { 
            color: #6b7280; 
            margin: 0 10px; 
            font-size: 18px; 
            align-self: center;
        }
        .flow-legend { 
            margin-top: 15px; 
            display: flex; 
            gap: 20px; 
            justify-content: center; 
            flex-wrap: wrap;
        }
        .flow-legend-item { 
            display: flex; 
            align-items: center; 
            gap: 8px; 
            font-size: 12px;
        }
        .flow-legend-box { 
            width: 20px; 
            height: 15px; 
            border-radius: 3px;
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
    <div class="section">
        <h3>Process Hierarchy & Network</h3>
        <div class="process-flow">
            ${generateProcessHierarchyHtml(processes)}
        </div>
    </div>

    <div class="section">
        <h3>Process Interaction Network</h3>
        <div class="process-flow">
            ${generateProcessNetworkHtml(processes, interactions)}
        </div>
    </div>

    <div class="section interactions">
        <h3>Detailed Process Interactions</h3>
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

function generateProcessFlowHtml(processes: any[], interactions: any[]): string {
  // Create a simple flow visualization showing process connections
  const processMap = new Map();
  processes.forEach((process, index) => {
    processMap.set(process.name, { ...process, index });
  });

  // Build flow chains based on interactions
  const flowChains: string[][] = [];
  const visited = new Set();

  interactions.forEach((interaction) => {
    if (!visited.has(interaction.from)) {
      const chain = [interaction.from];
      let current = interaction.from;
      
      // Follow the chain of interactions
      while (true) {
        const nextInteraction = interactions.find(i => i.from === current && !chain.includes(i.to));
        if (nextInteraction) {
          chain.push(nextInteraction.to);
          current = nextInteraction.to;
        } else {
          break;
        }
      }
      
      chain.forEach(processName => visited.add(processName));
      if (chain.length > 1) {
        flowChains.push(chain);
      }
    }
  });

  // Add standalone processes that aren't in any flow
  const standaloneProcesses = processes
    .filter(p => !visited.has(p.name))
    .map(p => [p.name]);

  const allChains = [...flowChains, ...standaloneProcesses];

  let html = '<div class="flow-container">';
  
  allChains.forEach((chain, chainIndex) => {
    if (chainIndex > 0) html += '<div style="width: 100%; height: 20px;"></div>';
    
    html += '<div style="display: flex; align-items: center; flex-wrap: wrap; justify-content: center;">';
    
    chain.forEach((processName, index) => {
      const process = processMap.get(processName);
      if (process) {
        html += `<div class="flow-process ${process.category}">${processName}</div>`;
        if (index < chain.length - 1) {
          html += '<div class="flow-arrow">→</div>';
        }
      }
    });
    
    html += '</div>';
  });

  html += '</div>';

  // Add legend
  html += `
    <div class="flow-legend">
      <div class="flow-legend-item">
        <div class="flow-legend-box" style="background: #10b981;"></div>
        <span>Core Processes</span>
      </div>
      <div class="flow-legend-item">
        <div class="flow-legend-box" style="background: #f59e0b;"></div>
        <span>Support Processes</span>
      </div>
      <div class="flow-legend-item">
        <div class="flow-legend-box" style="background: #8b5cf6;"></div>
        <span>Management Processes</span>
      </div>
    </div>
  `;

  return html;
}

function generateProcessHierarchyHtml(processes: any[]): string {
  const coreProcesses = processes.filter(p => p.category === 'core');
  const supportProcesses = processes.filter(p => p.category === 'support');
  const managementProcesses = processes.filter(p => p.category === 'management');

  let html = '<div class="hierarchy-container">';

  // Management processes at the top
  if (managementProcesses.length > 0) {
    html += `
      <div class="hierarchy-level">
        <div class="hierarchy-title">Management Processes</div>
        ${managementProcesses.map(process => `
          <div class="flow-process management">${process.name}</div>
        `).join('')}
      </div>
    `;
  }

  // Arrows pointing down
  if (managementProcesses.length > 0 && coreProcesses.length > 0) {
    html += '<div style="font-size: 24px; color: #6b7280;">⬇️</div>';
  }

  // Core processes in the middle
  if (coreProcesses.length > 0) {
    html += `
      <div class="hierarchy-level">
        <div class="hierarchy-title">Core Processes</div>
        ${coreProcesses.map(process => `
          <div class="flow-process core">${process.name}</div>
        `).join('')}
      </div>
    `;
  }

  // Arrows pointing to support
  if (coreProcesses.length > 0 && supportProcesses.length > 0) {
    html += '<div style="font-size: 24px; color: #6b7280;">⬇️</div>';
  }

  // Support processes at the bottom
  if (supportProcesses.length > 0) {
    html += `
      <div class="hierarchy-level">
        <div class="hierarchy-title">Support Processes</div>
        ${supportProcesses.map(process => `
          <div class="flow-process support">${process.name}</div>
        `).join('')}
      </div>
    `;
  }

  html += '</div>';
  return html;
}

function generateProcessNetworkHtml(processes: any[], interactions: any[]): string {
  // Create network view showing all processes with their connections
  let html = '<div class="network-container">';

  processes.forEach(process => {
    // Find incoming and outgoing connections
    const incomingConnections = interactions
      .filter(i => i.to === process.name)
      .map(i => i.from);
    
    const outgoingConnections = interactions
      .filter(i => i.from === process.name)
      .map(i => i.to);

    html += `
      <div class="network-process ${process.category}">
        <div>${process.name}</div>
        
        ${incomingConnections.length > 0 ? `
          <div class="network-connections">
            <div style="font-weight: bold; margin-bottom: 4px;">Inputs from:</div>
            ${incomingConnections.map(conn => `
              <div class="connection-arrow">← ${conn}</div>
            `).join('')}
          </div>
        ` : ''}
        
        ${outgoingConnections.length > 0 ? `
          <div class="network-connections">
            <div style="font-weight: bold; margin-bottom: 4px;">Outputs to:</div>
            ${outgoingConnections.map(conn => `
              <div class="connection-arrow">→ ${conn}</div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;
  });

  html += '</div>';

  // Add network legend
  html += `
    <div class="flow-legend">
      <div class="flow-legend-item">
        <div class="flow-legend-box" style="background: #10b981;"></div>
        <span>Core Processes</span>
      </div>
      <div class="flow-legend-item">
        <div class="flow-legend-box" style="background: #f59e0b;"></div>
        <span>Support Processes</span>
      </div>
      <div class="flow-legend-item">
        <div class="flow-legend-box" style="background: #8b5cf6;"></div>
        <span>Management Processes</span>
      </div>
      <div class="flow-legend-item">
        <span style="font-size: 12px;">← Inputs | Outputs →</span>
      </div>
    </div>
  `;

  return html;
}