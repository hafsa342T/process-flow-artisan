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
    
    // Return SVG content as base64 since PNG conversion is complex in edge functions
    const base64Data = btoa(unescape(encodeURIComponent(svgContent)));

    return new Response(JSON.stringify({ 
      png: base64Data,
      filename: `${industry.replace(/\s+/g, '_')}_Process_Diagram.svg`,
      contentType: 'image/svg+xml'
    }), {
      headers: { 
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Error generating PNG:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to generate process diagram'
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
  const interactions = processData?.interactions || [];
  
  let svgContent = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          .process-box { fill: #3b82f6; stroke: #1e40af; stroke-width: 2; }
          .core-process { fill: #10b981; stroke: #047857; }
          .support-process { fill: #f59e0b; stroke: #d97706; }
          .management-process { fill: #8b5cf6; stroke: #7c3aed; }
          .process-text { fill: white; font-family: Arial, sans-serif; font-size: 12px; text-anchor: middle; font-weight: bold; }
          .category-text { fill: white; font-family: Arial, sans-serif; font-size: 10px; text-anchor: middle; opacity: 0.9; }
          .title-text { fill: #1f2937; font-family: Arial, sans-serif; font-size: 24px; font-weight: bold; text-anchor: middle; }
          .subtitle-text { fill: #6b7280; font-family: Arial, sans-serif; font-size: 16px; text-anchor: middle; }
          .arrow { stroke: #6b7280; stroke-width: 2; fill: none; marker-end: url(#arrowhead); }
          .legend-text { fill: #1f2937; font-family: Arial, sans-serif; font-size: 12px; }
          .legend-title { fill: #1f2937; font-family: Arial, sans-serif; font-size: 14px; font-weight: bold; }
        </style>
        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#6b7280" />
        </marker>
        <filter id="shadow">
          <feDropShadow dx="2" dy="2" stdDeviation="2" flood-opacity="0.2"/>
        </filter>
      </defs>
      
      <!-- Background -->
      <rect width="${width}" height="${height}" fill="#f8fafc"/>
      
      <!-- Title -->
      <text x="${width/2}" y="40" class="title-text">ISO 9001 Process Map</text>
      <text x="${width/2}" y="65" class="subtitle-text">${escapeXml(industry)}</text>
  `;

  // Position processes in a smart grid
  const cols = Math.ceil(Math.sqrt(processes.length));
  const rows = Math.ceil(processes.length / cols);
  const boxWidth = 180;
  const boxHeight = 90;
  const spacingX = (width - 100) / cols;
  const spacingY = (height - 200) / rows;

  // First draw all arrows behind the boxes
  interactions.forEach((interaction: any) => {
    const sourceIndex = processes.findIndex((p: any) => p.name === interaction.from);
    const targetIndex = processes.findIndex((p: any) => p.name === interaction.to);
    
    if (sourceIndex !== -1 && targetIndex !== -1) {
      const sourceCol = sourceIndex % cols;
      const sourceRow = Math.floor(sourceIndex / cols);
      const sourceX = 50 + sourceCol * spacingX + (spacingX - boxWidth) / 2;
      const sourceY = 100 + sourceRow * spacingY + (spacingY - boxHeight) / 2;
      
      const targetCol = targetIndex % cols;
      const targetRow = Math.floor(targetIndex / cols);
      const targetX = 50 + targetCol * spacingX + (spacingX - boxWidth) / 2;
      const targetY = 100 + targetRow * spacingY + (spacingY - boxHeight) / 2;

      // Draw arrow from center of source to center of target
      const fromX = sourceX + boxWidth / 2;
      const fromY = sourceY + boxHeight / 2;
      const toX = targetX + boxWidth / 2;
      const toY = targetY + boxHeight / 2;

      svgContent += `
        <line x1="${fromX}" y1="${fromY}" x2="${toX}" y2="${toY}" class="arrow"/>
      `;
    }
  });

  // Then draw all process boxes on top
  processes.forEach((process: any, index: number) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    const x = 50 + col * spacingX + (spacingX - boxWidth) / 2;
    const y = 100 + row * spacingY + (spacingY - boxHeight) / 2;

    const categoryClass = process.category === 'core' ? 'core-process' : 
                         process.category === 'support' ? 'support-process' : 
                         'management-process';

    // Process box with shadow
    svgContent += `
      <rect x="${x}" y="${y}" width="${boxWidth}" height="${boxHeight}" 
            class="process-box ${categoryClass}" rx="12" filter="url(#shadow)"/>
    `;

    // Process name (split long names)
    const name = process.name;
    const lines = splitText(name, 22);
    lines.forEach((line: string, lineIndex: number) => {
      svgContent += `
        <text x="${x + boxWidth/2}" y="${y + 25 + lineIndex * 14}" class="process-text">${escapeXml(line)}</text>
      `;
    });

    // Category label
    svgContent += `
      <text x="${x + boxWidth/2}" y="${y + boxHeight - 12}" class="category-text">${escapeXml(process.category.toUpperCase())}</text>
    `;
  });

  // Add legend
  const legendY = height - 120;
  svgContent += `
    <g transform="translate(50, ${legendY})">
      <text x="0" y="0" class="legend-title">Process Categories:</text>
      
      <rect x="0" y="15" width="25" height="20" class="process-box core-process" rx="5"/>
      <text x="35" y="29" class="legend-text">Core Processes</text>
      
      <rect x="150" y="15" width="25" height="20" class="process-box support-process" rx="5"/>
      <text x="185" y="29" class="legend-text">Support Processes</text>
      
      <rect x="320" y="15" width="25" height="20" class="process-box management-process" rx="5"/>
      <text x="355" y="29" class="legend-text">Management Processes</text>
      
      <line x1="0" y1="50" x2="30" y2="50" class="arrow"/>
      <text x="40" y="54" class="legend-text">Process Flow</text>
    </g>
  `;

  // Add process count info at the bottom of the page
  const coreCount = processes.filter((p: any) => p.category === 'core').length;
  const supportCount = processes.filter((p: any) => p.category === 'support').length;
  const managementCount = processes.filter((p: any) => p.category === 'management').length;

  svgContent += `
    <g transform="translate(${width - 200}, ${height - 80})">
      <text x="0" y="0" class="legend-title">Process Summary:</text>
      <text x="0" y="20" class="legend-text">Core: ${coreCount}</text>
      <text x="0" y="35" class="legend-text">Support: ${supportCount}</text>
      <text x="0" y="50" class="legend-text">Management: ${managementCount}</text>
      <text x="0" y="65" class="legend-text">Total: ${processes.length}</text>
    </g>
  `;

  svgContent += '</svg>';
  return svgContent;
}

function splitText(text: string, maxLength: number): string[] {
  if (text.length <= maxLength) return [text];
  
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  for (const word of words) {
    if ((currentLine + ' ' + word).length <= maxLength) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  
  if (currentLine) lines.push(currentLine);
  return lines.slice(0, 2); // Max 2 lines
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function convertSvgToPng(svgContent: string): Promise<string> {
  try {
    // Clean SVG and ensure proper namespace
    let cleanSvg = svgContent.trim();
    if (!cleanSvg.includes('xmlns')) {
      cleanSvg = cleanSvg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    
    // Use a public API service to convert SVG to PNG
    const apiUrl = 'https://api.htmlcsstoimage.com/v1/image';
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        html: cleanSvg,
        css: '',
        width: 1200,
        height: 800,
        device_scale_factor: 1,
        format: 'png'
      })
    });
    
    if (response.ok) {
      const buffer = await response.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
      return `data:image/png;base64,${base64}`;
    } else {
      throw new Error('PNG conversion service failed');
    }
    
  } catch (error) {
    console.error('Error converting SVG to PNG format:', error);
    // Fallback: create a basic PNG header and encode SVG data
    // This is a simplified approach that creates a readable file
    const base64Svg = btoa(unescape(encodeURIComponent(cleanSvg)));
    
    // Create a minimal PNG with embedded SVG data
    // Note: This is still SVG data but with PNG headers for compatibility
    const pngHeader = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    
    // Return the SVG as base64 - this will work better than fake PNG headers
    return `data:image/svg+xml;base64,${base64Svg}`;
  }
}