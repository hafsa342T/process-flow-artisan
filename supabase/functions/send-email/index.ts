import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ProcessEmailRequest {
  email: string;
  industry: string;
  processData: any;
  pdfReport?: string; // Base64 encoded PDF
  isBasicReport?: boolean; // Flag for basic vs premium report
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, industry, processData, pdfReport, isBasicReport = false }: ProcessEmailRequest = await req.json();

    if (!email || !industry || !processData) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const processCount = processData.processes?.length || 0;
    const processes = processData.processes || [];
    
    // Generate HTML report with process cards
    const generateProcessCardsHTML = (processes: any[]) => {
      const getCategoryColor = (category: string) => {
        switch (category) {
          case 'core': return { bg: '#3b82f6', border: '#2563eb', name: 'Core Process' };
          case 'support': return { bg: '#10b981', border: '#059669', name: 'Support Process' };
          case 'management': return { bg: '#8b5cf6', border: '#7c3aed', name: 'Management Process' };
          default: return { bg: '#6b7280', border: '#4b5563', name: 'Process' };
        }
      };

      return processes.map(process => {
        const colors = getCategoryColor(process.category);
        return `
          <div style="background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 20px; overflow: hidden;">
            <div style="background: ${colors.bg}; color: white; padding: 15px; border-bottom: 3px solid ${colors.border};">
              <h3 style="margin: 0; font-size: 18px; font-weight: 600;">${process.name}</h3>
              <span style="background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 500; margin-top: 8px; display: inline-block;">
                ${colors.name}
              </span>
            </div>
            <div style="padding: 20px;">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 15px;">
                <div>
                  <h4 style="color: #374151; margin: 0 0 8px 0; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Inputs</h4>
                  <ul style="margin: 0; padding-left: 15px; color: #6b7280;">
                    ${process.inputs.map((input: string) => `<li style="margin-bottom: 4px;">${input}</li>`).join('')}
                  </ul>
                </div>
                <div>
                  <h4 style="color: #374151; margin: 0 0 8px 0; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Outputs</h4>
                  <ul style="margin: 0; padding-left: 15px; color: #6b7280;">
                    ${process.outputs.map((output: string) => `<li style="margin-bottom: 4px;">${output}</li>`).join('')}
                  </ul>
                </div>
              </div>
              <div style="background: #f9fafb; padding: 15px; border-radius: 6px; margin-bottom: 15px;">
                <div style="margin-bottom: 10px;">
                  <strong style="color: #374151; font-size: 14px;">Process Owner:</strong>
                  <span style="color: #6b7280; margin-left: 8px;">${process.owner}</span>
                </div>
                <div style="margin-bottom: 10px;">
                  <strong style="color: #374151; font-size: 14px;">Key Risk:</strong>
                  <span style="color: #6b7280; margin-left: 8px;">${process.risk}</span>
                </div>
                <div>
                  <strong style="color: #374151; font-size: 14px;">KPI:</strong>
                  <span style="color: #6b7280; margin-left: 8px;">${process.kpi}</span>
                </div>
              </div>
              <div style="text-align: center; padding: 10px 0; border-top: 1px solid #e5e7eb;">
                <span style="background: #f3f4f6; color: #6b7280; padding: 6px 12px; border-radius: 4px; font-size: 12px; font-weight: 500;">
                  ISO 9001 Clauses: ${process.isoClauses?.join(', ') || '4.4, 8.1'}
                </span>
              </div>
            </div>
          </div>
        `;
      }).join('');
    };

    // Prepare email attachments (only for premium reports)
    const attachments = [];
    if (pdfReport && !isBasicReport) {
      // Extract the base64 content (remove data URL prefix if present)
      const base64Content = pdfReport.includes(',') ? pdfReport.split(',')[1] : pdfReport;
      
      attachments.push({
        filename: `${industry.replace(/\s+/g, '_')}_ISO9001_Process_Report.html`,
        content: base64Content,
        type: 'text/html',
      });
    }

    // For basic reports, generate and attach process cards HTML
    if (isBasicReport && processes.length > 0) {
      const processCardsHTML = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>ISO 9001 Process Report - ${industry}</title>
          <style>
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              background: #f8f9fa; 
              margin: 0; 
              padding: 20px; 
            }
            .container { 
              max-width: 800px; 
              margin: 0 auto; 
              background: white; 
              border-radius: 12px; 
              overflow: hidden; 
              box-shadow: 0 4px 20px rgba(0,0,0,0.1); 
            }
            .header { 
              background: linear-gradient(135deg, #0066cc 0%, #004499 100%); 
              color: white; 
              padding: 30px; 
              text-align: center; 
            }
            .content { 
              padding: 30px; 
            }
            .process-stats {
              background: #f8f9fa;
              padding: 20px;
              border-radius: 8px;
              margin-bottom: 30px;
              text-align: center;
            }
            .stats-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
              gap: 20px;
              margin-top: 15px;
            }
            .stat-item {
              background: white;
              padding: 15px;
              border-radius: 6px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .stat-number {
              font-size: 24px;
              font-weight: bold;
              color: #0066cc;
            }
            .stat-label {
              font-size: 12px;
              color: #666;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px; font-weight: 600;">ISO 9001 Process Report</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">${industry} Industry</p>
              <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.8;">Generated on ${new Date().toLocaleDateString()}</p>
            </div>
            
            <div class="content">
              <div class="process-stats">
                <h2 style="color: #0066cc; margin: 0 0 15px 0;">Process Overview</h2>
                <div class="stats-grid">
                  <div class="stat-item">
                    <div class="stat-number">${processCount}</div>
                    <div class="stat-label">Total Processes</div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-number">${processes.filter(p => p.category === 'core').length}</div>
                    <div class="stat-label">Core Processes</div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-number">${processes.filter(p => p.category === 'support').length}</div>
                    <div class="stat-label">Support Processes</div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-number">${processes.filter(p => p.category === 'management').length}</div>
                    <div class="stat-label">Management Processes</div>
                  </div>
                </div>
              </div>
              
              <h2 style="color: #0066cc; margin-bottom: 20px;">Process Details</h2>
              ${generateProcessCardsHTML(processes)}
              
              <div style="background: #e7f3ff; border: 1px solid #b3d9ff; border-radius: 8px; padding: 20px; margin-top: 30px;">
                <h3 style="color: #0066cc; margin: 0 0 15px 0;">About This Report</h3>
                <p style="margin: 0; color: #444;">
                  This process map has been generated according to ISO 9001:2015 standards for the ${industry} industry. 
                  Each process includes inputs, outputs, risks, KPIs, and responsible owners to help you establish 
                  a robust quality management system.
                </p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;
      
      // Convert to base64
      const base64HTML = btoa(unescape(encodeURIComponent(processCardsHTML)));
      
      attachments.push({
        filename: `${industry.replace(/\s+/g, '_')}_Process_Cards_Report.html`,
        content: base64HTML,
        type: 'text/html',
      });
    }

    const subject = isBasicReport 
      ? `Your Process Report - ${industry} (Basic Overview)`
      : `ISO 9001 Process Map Report - ${industry}`;

    const emailContent = isBasicReport ? `
      <div style="max-width: 600px; margin: 0 auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333;">
        <div style="background: #f8f9fa; padding: 30px; text-align: center; border-bottom: 3px solid #0066cc;">
          <h1 style="color: #0066cc; margin: 0; font-size: 24px; font-weight: 600;">
            QSE Academy
          </h1>
          <p style="color: #666; margin: 5px 0 0 0; font-size: 14px;">Quality, Safety & Environmental Training</p>
        </div>
        
        <div style="padding: 30px;">
          <p style="margin-bottom: 20px; font-size: 16px;">Dear Valued Client,</p>
          
          <p style="margin-bottom: 20px;">
            Thank you for using our ISO 9001 Process Mapping Tool. We've analyzed your <strong>${industry}</strong> business and identified <strong>${processCount} key processes</strong> that need documentation for ISO 9001 compliance.
          </p>
          
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 25px; border-radius: 8px; text-align: center; margin: 30px 0;">
            <h2 style="margin: 0 0 15px 0; font-size: 22px;">🚀 Upgrade to Premium Report</h2>
            <p style="margin: 0 0 20px 0; font-size: 16px;">Get your processes professionally reviewed and beautifully branded for just <strong>$99</strong></p>
            
            <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 6px; margin: 20px 0; text-align: left;">
              <h4 style="margin: 0 0 15px 0;">Premium features include:</h4>
              <ul style="margin: 0; padding-left: 20px;">
                <li>Custom branded PDF report with your company logo</li>
                <li>Expert consultant validation and recommendations</li>
                <li>All download formats (PDF, CSV, JSON, PNG)</li>
                <li>ISO 9001:2015 compliance review</li>
                <li>Implementation guidance</li>
              </ul>
            </div>
            
            <a href="${req.headers.get('origin') || 'https://your-domain.com'}/payment?email=${encodeURIComponent(email)}&industry=${encodeURIComponent(industry)}" 
               style="display: inline-block; background: white; color: #667eea; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; margin-top: 10px;">
              Upgrade Now - $99
            </a>
          </div>
          
          <div style="background: #f8f9fa; border-left: 4px solid #0066cc; padding: 20px; margin: 25px 0;">
            <h3 style="color: #0066cc; margin-top: 0; margin-bottom: 15px;">What You Get with Basic Analysis</h3>
            <ul style="margin: 0; padding-left: 20px;">
              <li><strong>Industry Sector:</strong> ${industry}</li>
              <li><strong>Processes Identified:</strong> ${processCount}</li>
              <li><strong>Basic Process Structure:</strong> Management, Core, and Support processes</li>
              <li><strong>ISO 9001 Framework:</strong> High-level compliance overview</li>
            </ul>
          </div>
          
          <p style="margin-bottom: 20px;">
            Ready to take your quality management to the next level? Our premium report provides everything you need for a successful ISO 9001 implementation.
          </p>
          
          <p style="margin-bottom: 30px;">
            Questions? Contact our support team at 
            <a href="mailto:support@qse-academy.com" style="color: #0066cc; text-decoration: none;">support@qse-academy.com</a>.
          </p>
          
          <p style="margin-bottom: 5px;">Best regards,</p>
          <p style="margin-bottom: 20px; font-weight: 600;">QSE Academy Team</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
          <p style="margin: 0; color: #666; font-size: 12px;">
            QSE Academy | Quality, Safety & Environmental Training<br>
            Web: <a href="https://qse-academy.com" style="color: #0066cc;">qse-academy.com</a> | 
            Email: <a href="mailto:support@qse-academy.com" style="color: #0066cc;">support@qse-academy.com</a>
          </p>
        </div>
      </div>
    ` : `
      <div style="max-width: 600px; margin: 0 auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333;">
        <div style="background: #f8f9fa; padding: 30px; text-align: center; border-bottom: 3px solid #0066cc;">
          <h1 style="color: #0066cc; margin: 0; font-size: 24px; font-weight: 600;">
            QSE Academy
          </h1>
          <p style="color: #666; margin: 5px 0 0 0; font-size: 14px;">Quality, Safety & Environmental Training</p>
        </div>
        
        <div style="padding: 30px;">
          <p style="margin-bottom: 20px; font-size: 16px;">Dear Valued Client,</p>
          
          <p style="margin-bottom: 20px;">
            We are pleased to provide you with your customized ISO 9001:2015 Process Map report for the <strong>${industry}</strong> sector.
          </p>
          
          <div style="background: #f8f9fa; border-left: 4px solid #0066cc; padding: 20px; margin: 25px 0;">
            <h3 style="color: #0066cc; margin-top: 0; margin-bottom: 15px;">Report Summary</h3>
            <ul style="margin: 0; padding-left: 20px;">
              <li><strong>Industry Sector:</strong> ${industry}</li>
              <li><strong>Total Processes Identified:</strong> ${processCount}</li>
              <li><strong>Report Generated:</strong> ${new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</li>
            </ul>
          </div>
          
          <p style="margin-bottom: 20px;">
            This comprehensive process map has been developed based on industry best practices and ISO 9001:2015 requirements. 
            The attached HTML report contains detailed process mappings, interactions, and compliance guidelines specific to your sector.
          </p>
          
          <div style="background: #e7f3ff; border: 1px solid #b3d9ff; border-radius: 8px; padding: 20px; margin: 25px 0;">
            <h4 style="color: #0066cc; margin-top: 0; margin-bottom: 15px;">Next Steps & Recommendations</h4>
            <ul style="margin: 0; padding-left: 20px; color: #444;">
              <li>Review the process map with your management team</li>
              <li>Customize processes to align with your organization's specific operations</li>
              <li>Identify process owners and define responsibilities</li>
              <li>Establish monitoring and measurement criteria</li>
              <li>Consider our ISO 9001 implementation training programs</li>
            </ul>
          </div>
          
          <p style="margin-bottom: 20px;">
            Should you require any clarification or additional support with your ISO 9001 implementation, 
            please do not hesitate to contact our support team at 
            <a href="mailto:support@qse-academy.com" style="color: #0066cc; text-decoration: none;">support@qse-academy.com</a>.
          </p>
          
          <p style="margin-bottom: 30px;">
            Thank you for choosing QSE Academy for your quality management system needs.
          </p>
          
          <p style="margin-bottom: 5px;">Best regards,</p>
          <p style="margin-bottom: 20px; font-weight: 600;">QSE Academy Team</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
          <p style="margin: 0; color: #666; font-size: 12px;">
            QSE Academy | Quality, Safety & Environmental Training<br>
            Web: <a href="https://qse-academy.com" style="color: #0066cc;">qse-academy.com</a> | 
            Email: <a href="mailto:support@qse-academy.com" style="color: #0066cc;">support@qse-academy.com</a>
          </p>
          <p style="margin: 10px 0 0 0; color: #999; font-size: 11px;">
            This email was sent automatically. Please do not reply to this email address.
          </p>
        </div>
      </div>
    `;

    const emailResponse = await resend.emails.send({
      from: "QSE Academy <noreply@qse-academy.com>",
      to: [email],
      cc: ["support@qse-academy.com"], // Always CC support@qse-academy.com
      subject,
      attachments,
      html: emailContent,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      messageId: emailResponse.data?.id 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);