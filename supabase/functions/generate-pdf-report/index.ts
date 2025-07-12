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

    // Generate PDF content using jsPDF-like functionality
    const pdfContent = generatePDFReport(processData, industry);

    // For now, return a base64 encoded simple PDF
    // In production, you could use puppeteer or other PDF libraries
    const pdfBase64 = btoa(pdfContent);

    return new Response(JSON.stringify({ 
      pdf: pdfBase64,
      filename: `${industry.replace(/\s+/g, '_')}_Process_Map.pdf`
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

function generatePDFReport(processData: any, industry: string): string {
  // Simple text-based PDF content
  // In production, use proper PDF generation libraries
  const header = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/Resources <<
/Font <<
/F1 4 0 R
>>
>>
/MediaBox [0 0 612 792]
/Contents 5 0 R
>>
endobj

4 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Times-Roman
>>
endobj

5 0 obj
<<
/Length ${calculateContentLength(processData, industry)}
>>
stream
BT
/F1 18 Tf
72 720 Td
(ISO 9001 Process Map Report) Tj
0 -30 Td
/F1 14 Tf
(Industry: ${industry}) Tj
0 -40 Td
/F1 12 Tf`;

  let content = header;
  let yPos = 640;

  // Add process details
  if (processData?.processes) {
    content += `
0 -20 Td
(PROCESSES:) Tj`;
    yPos -= 40;

    processData.processes.forEach((process: any, index: number) => {
      if (yPos < 100) return; // Prevent overflow
      content += `
0 -20 Td
(${index + 1}. ${process.name}) Tj
0 -15 Td
(   Category: ${process.category}) Tj
0 -15 Td
(   Owner: ${process.owner}) Tj`;
      yPos -= 50;
    });
  }

  content += `
ET
endstream
endobj

xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000074 00000 n 
0000000120 00000 n 
0000000274 00000 n 
0000000365 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
${content.length}
%%EOF`;

  return content;
}

function calculateContentLength(processData: any, industry: string): number {
  // Rough calculation of content length
  let length = 200; // Base content
  length += industry.length * 2;
  if (processData?.processes) {
    processData.processes.forEach((process: any) => {
      length += process.name.length * 3;
      length += 100; // Other fields
    });
  }
  return length;
}