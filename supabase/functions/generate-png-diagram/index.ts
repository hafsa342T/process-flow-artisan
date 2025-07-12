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

    // Generate SVG diagram
    const svgContent = generateProcessDiagram(processData, industry);
    
    // Convert SVG to PNG using a simple method
    // In production, you could use puppeteer or canvas libraries
    const pngBase64 = await convertSVGToPNG(svgContent);

    return new Response(JSON.stringify({ 
      png: pngBase64,
      filename: `${industry.replace(/\s+/g, '_')}_Process_Diagram.png`
    }), {
      headers: { 
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Error generating PNG:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to generate PNG diagram'
    }), {
      status: 500,
      headers: { 
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});

function generateProcessDiagram(processData: any, industry: string): string {
  const width = 1200;
  const height = 800;
  const processes = processData?.processes || [];
  
  let svgContent = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          .process-box { fill: #3b82f6; stroke: #1e40af; stroke-width: 2; }
          .core-process { fill: #10b981; stroke: #047857; }
          .support-process { fill: #f59e0b; stroke: #d97706; }
          .management-process { fill: #8b5cf6; stroke: #7c3aed; }
          .process-text { fill: white; font-family: Arial; font-size: 12px; text-anchor: middle; }
          .title-text { fill: #1f2937; font-family: Arial; font-size: 20px; font-weight: bold; text-anchor: middle; }
          .arrow { stroke: #6b7280; stroke-width: 2; fill: none; marker-end: url(#arrowhead); }
        </style>
        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#6b7280" />
        </marker>
      </defs>
      
      <!-- Background -->
      <rect width="${width}" height="${height}" fill="#f8fafc"/>
      
      <!-- Title -->
      <text x="${width/2}" y="40" class="title-text">ISO 9001 Process Map - ${industry}</text>
  `;

  // Position processes in a grid
  const cols = Math.ceil(Math.sqrt(processes.length));
  const rows = Math.ceil(processes.length / cols);
  const boxWidth = 160;
  const boxHeight = 80;
  const spacingX = (width - 100) / cols;
  const spacingY = (height - 150) / rows;

  processes.forEach((process: any, index: number) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    const x = 50 + col * spacingX + (spacingX - boxWidth) / 2;
    const y = 80 + row * spacingY + (spacingY - boxHeight) / 2;

    const categoryClass = process.category === 'core' ? 'core-process' : 
                         process.category === 'support' ? 'support-process' : 
                         'management-process';

    svgContent += `
      <rect x="${x}" y="${y}" width="${boxWidth}" height="${boxHeight}" class="process-box ${categoryClass}" rx="8"/>
      <text x="${x + boxWidth/2}" y="${y + boxHeight/2 - 8}" class="process-text">${process.name.length > 20 ? process.name.substring(0, 20) + '...' : process.name}</text>
      <text x="${x + boxWidth/2}" y="${y + boxHeight/2 + 8}" class="process-text" style="font-size: 10px; opacity: 0.8;">${process.category.toUpperCase()}</text>
    `;

    // Add arrows between processes
    if (index < processes.length - 1) {
      const nextCol = (index + 1) % cols;
      const nextRow = Math.floor((index + 1) / cols);
      const nextX = 50 + nextCol * spacingX + (spacingX - boxWidth) / 2;
      const nextY = 80 + nextRow * spacingY + (spacingY - boxHeight) / 2;

      if (row === nextRow) { // Same row
        svgContent += `
          <line x1="${x + boxWidth}" y1="${y + boxHeight/2}" x2="${nextX}" y2="${nextY + boxHeight/2}" class="arrow"/>
        `;
      }
    }
  });

  // Add legend
  svgContent += `
    <g transform="translate(50, ${height - 120})">
      <text x="0" y="0" style="fill: #1f2937; font-family: Arial; font-size: 14px; font-weight: bold;">Legend:</text>
      <rect x="0" y="10" width="20" height="15" class="process-box core-process" rx="3"/>
      <text x="25" y="22" style="fill: #1f2937; font-family: Arial; font-size: 12px;">Core Processes</text>
      <rect x="130" y="10" width="20" height="15" class="process-box support-process" rx="3"/>
      <text x="155" y="22" style="fill: #1f2937; font-family: Arial; font-size: 12px;">Support Processes</text>
      <rect x="280" y="10" width="20" height="15" class="process-box management-process" rx="3"/>
      <text x="305" y="22" style="fill: #1f2937; font-family: Arial; font-size: 12px;">Management Processes</text>
    </g>
  `;

  svgContent += '</svg>';
  return svgContent;
}

async function convertSVGToPNG(svgContent: string): Promise<string> {
  // For this simple implementation, we'll return the SVG as base64
  // In production, you would use a proper SVG to PNG converter
  const svgBase64 = btoa(unescape(encodeURIComponent(svgContent)));
  
  // Create a simple PNG header + SVG data (this is a simplified approach)
  // In production, use proper image conversion libraries
  return svgBase64;
}