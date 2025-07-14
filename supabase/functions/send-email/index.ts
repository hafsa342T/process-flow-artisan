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
    
    // Generate comprehensive HTML report with full visual representation
    const generateComprehensiveReport = (processes: any[], interactions: any[], industry: string, userEmail: string) => {
      const getCategoryColor = (category: string) => {
        switch (category) {
          case 'core': return { bg: '#3b82f6', border: '#2563eb', name: 'Core Process', light: '#dbeafe' };
          case 'support': return { bg: '#10b981', border: '#059669', name: 'Support Process', light: '#d1fae5' };
          case 'management': return { bg: '#8b5cf6', border: '#7c3aed', name: 'Management Process', light: '#e9d5ff' };
          default: return { bg: '#6b7280', border: '#4b5563', name: 'Process', light: '#f3f4f6' };
        }
      };

      const processColumns = {
        management: processes.filter(p => p.category === 'management'),
        core: processes.filter(p => p.category === 'core'),
        support: processes.filter(p => p.category === 'support')
      };

      // Generate process hierarchy visualization
      const generateHierarchyView = () => {
        let hierarchyHTML = '';
        
        // Management Layer
        if (processColumns.management.length > 0) {
          hierarchyHTML += `
            <div style="text-align: center; margin-bottom: 30px;">
              <h3 style="color: #8b5cf6; margin-bottom: 20px; font-size: 18px; font-weight: 600;">Management Processes</h3>
              <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 15px; margin-bottom: 20px;">
                ${processColumns.management.map(process => {
                  const colors = getCategoryColor(process.category);
                  return `
                    <div style="background: ${colors.bg}; color: white; padding: 15px 20px; border-radius: 8px; font-weight: 500; text-align: center; min-width: 150px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                      <div style="font-size: 14px; font-weight: 600;">${process.name}</div>
                      <div style="font-size: 11px; opacity: 0.9; margin-top: 5px;">KPI: ${process.kpi}</div>
                    </div>
                  `;
                }).join('')}
              </div>
              <div style="text-align: center; margin: 15px 0;">
                <div style="display: inline-block; width: 0; height: 0; border-left: 10px solid transparent; border-right: 10px solid transparent; border-top: 15px solid #8b5cf6;"></div>
              </div>
            </div>
          `;
        }

        // Core Process Flow
        if (processColumns.core.length > 0) {
          hierarchyHTML += `
            <div style="margin-bottom: 30px;">
              <h3 style="color: #3b82f6; margin-bottom: 20px; font-size: 18px; font-weight: 600; text-align: center;">Core Process Flow</h3>
              <div style="display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 10px; margin-bottom: 20px;">
                ${processColumns.core.map((process, idx) => {
                  const colors = getCategoryColor(process.category);
                  const arrow = idx < processColumns.core.length - 1 ? `
                    <div style="display: inline-block; margin: 0 5px;">
                      <div style="width: 0; height: 0; border-top: 8px solid transparent; border-bottom: 8px solid transparent; border-left: 12px solid #3b82f6;"></div>
                    </div>
                  ` : '';
                  return `
                    <div style="display: inline-block;">
                      <div style="background: ${colors.bg}; color: white; padding: 12px 16px; border-radius: 8px; text-align: center; min-width: 140px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <div style="font-size: 13px; font-weight: 600;">${process.name}</div>
                        <div style="font-size: 10px; opacity: 0.9; margin-top: 3px;">Owner: ${process.owner}</div>
                        <div style="font-size: 10px; opacity: 0.9;">KPI: ${process.kpi.substring(0, 30)}...</div>
                      </div>
                    </div>
                    ${arrow}
                  `;
                }).join('')}
              </div>
            </div>
          `;
        }

        // Support Process Layer
        if (processColumns.support.length > 0) {
          hierarchyHTML += `
            <div style="margin-bottom: 30px;">
              <div style="text-align: center; margin: 15px 0;">
                <div style="display: inline-block; width: 0; height: 0; border-left: 10px solid transparent; border-right: 10px solid transparent; border-bottom: 15px solid #10b981;"></div>
              </div>
              <h3 style="color: #10b981; margin-bottom: 20px; font-size: 18px; font-weight: 600; text-align: center;">Support Processes</h3>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                ${processColumns.support.map(process => {
                  const colors = getCategoryColor(process.category);
                  return `
                    <div style="background: ${colors.bg}; color: white; padding: 12px 16px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                      <div style="font-size: 13px; font-weight: 600;">${process.name}</div>
                      <div style="font-size: 10px; opacity: 0.9; margin-top: 3px;">${process.owner}</div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          `;
        }

        return hierarchyHTML;
      };

      // Generate process interactions table
      const generateInteractionsTable = () => {
        if (interactions.length === 0) return '';
        
        return `
          <div style="margin-top: 30px;">
            <h3 style="color: #374151; margin-bottom: 15px; font-size: 18px; font-weight: 600;">Process Interactions</h3>
            <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <thead>
                <tr style="background: #f8fafc;">
                  <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151; border-bottom: 2px solid #e2e8f0;">From Process</th>
                  <th style="padding: 12px; text-align: center; font-weight: 600; color: #374151; border-bottom: 2px solid #e2e8f0;">→</th>
                  <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151; border-bottom: 2px solid #e2e8f0;">To Process</th>
                  <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151; border-bottom: 2px solid #e2e8f0;">Description</th>
                </tr>
              </thead>
              <tbody>
                ${interactions.map((interaction, idx) => {
                  const fromProcess = processes.find(p => p.name === interaction.from);
                  const toProcess = processes.find(p => p.name === interaction.to);
                  const fromColors = getCategoryColor(fromProcess?.category || 'core');
                  const toColors = getCategoryColor(toProcess?.category || 'core');
                  
                  return `
                    <tr style="border-bottom: 1px solid #e2e8f0;">
                      <td style="padding: 12px;">
                        <span style="background: ${fromColors.light}; color: ${fromColors.bg}; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500;">
                          ${interaction.from}
                        </span>
                      </td>
                      <td style="padding: 12px; text-align: center;">
                        <div style="width: 0; height: 0; border-top: 6px solid transparent; border-bottom: 6px solid transparent; border-left: 10px solid #3b82f6; margin: 0 auto;"></div>
                      </td>
                      <td style="padding: 12px;">
                        <span style="background: ${toColors.light}; color: ${toColors.bg}; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500;">
                          ${interaction.to}
                        </span>
                      </td>
                      <td style="padding: 12px; font-size: 12px; color: #6b7280;">
                        ${interaction.description || 'Process flow connection'}
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        `;
      };

      // Generate detailed process cards
      const generateDetailedProcessCards = () => {
        return `
          <div style="margin-top: 30px;">
            <h3 style="color: #374151; margin-bottom: 20px; font-size: 18px; font-weight: 600;">Detailed Process Information</h3>
            ${processes.map(process => {
              const colors = getCategoryColor(process.category);
              return `
                <div style="background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 20px; overflow: hidden; border-left: 4px solid ${colors.bg};">
                  <div style="background: ${colors.light}; padding: 15px; border-bottom: 1px solid #e2e8f0;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                      <h4 style="margin: 0; font-size: 16px; font-weight: 600; color: #374151;">${process.name}</h4>
                      <span style="background: ${colors.bg}; color: white; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 500;">
                        ${colors.name}
                      </span>
                    </div>
                  </div>
                  <div style="padding: 20px;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 15px;">
                      <div>
                        <h5 style="color: #374151; margin: 0 0 8px 0; font-size: 14px; font-weight: 600;">Inputs</h5>
                        <ul style="margin: 0; padding-left: 15px; color: #6b7280; font-size: 13px;">
                          ${process.inputs.map((input: string) => `<li style="margin-bottom: 4px;">${input}</li>`).join('')}
                        </ul>
                      </div>
                      <div>
                        <h5 style="color: #374151; margin: 0 0 8px 0; font-size: 14px; font-weight: 600;">Outputs</h5>
                        <ul style="margin: 0; padding-left: 15px; color: #6b7280; font-size: 13px;">
                          ${process.outputs.map((output: string) => `<li style="margin-bottom: 4px;">${output}</li>`).join('')}
                        </ul>
                      </div>
                    </div>
                    <div style="background: #f8fafc; padding: 15px; border-radius: 6px; margin-bottom: 15px;">
                      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div>
                          <strong style="color: #374151; font-size: 13px; display: block; margin-bottom: 5px;">Process Owner</strong>
                          <span style="color: #6b7280; font-size: 13px;">${process.owner}</span>
                        </div>
                        <div>
                          <strong style="color: #374151; font-size: 13px; display: block; margin-bottom: 5px;">ISO 9001 Clauses</strong>
                          <span style="color: #6b7280; font-size: 13px;">${process.isoClauses?.join(', ') || '4.4, 8.1'}</span>
                        </div>
                      </div>
                      <div style="margin-top: 10px;">
                        <strong style="color: #374151; font-size: 13px; display: block; margin-bottom: 5px;">Key Risk</strong>
                        <span style="color: #6b7280; font-size: 13px;">${process.risk}</span>
                      </div>
                      <div style="margin-top: 10px;">
                        <strong style="color: #374151; font-size: 13px; display: block; margin-bottom: 5px;">Key Performance Indicator</strong>
                        <span style="color: #6b7280; font-size: 13px;">${process.kpi}</span>
                      </div>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `;
      };

      return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Comprehensive ISO 9001 Process Report - ${industry}</title>
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background: #f8fafc; margin: 0; padding: 0;">
          <div style="max-width: 1000px; margin: 0 auto; background: white; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #0066cc 0%, #004499 100%); color: white; padding: 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 600;">Comprehensive ISO 9001 Process Report</h1>
              <p style="margin: 10px 0 5px 0; font-size: 18px; opacity: 0.9;">${industry} Industry Analysis</p>
              <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.8;">Generated: ${new Date().toLocaleDateString()} | Client: ${userEmail}</p>
            </div>
            
            <!-- Executive Summary -->
            <div style="padding: 30px; background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
              <h2 style="color: #0066cc; margin: 0 0 20px 0; font-size: 22px;">Executive Summary</h2>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
                <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border-left: 4px solid #3b82f6;">
                  <div style="font-size: 32px; font-weight: bold; color: #3b82f6; margin-bottom: 5px;">${processes.length}</div>
                  <div style="font-size: 14px; color: #6b7280; font-weight: 500;">Total Processes</div>
                </div>
                <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border-left: 4px solid #3b82f6;">
                  <div style="font-size: 32px; font-weight: bold; color: #3b82f6; margin-bottom: 5px;">${processColumns.core.length}</div>
                  <div style="font-size: 14px; color: #6b7280; font-weight: 500;">Core Processes</div>
                </div>
                <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border-left: 4px solid #10b981;">
                  <div style="font-size: 32px; font-weight: bold; color: #10b981; margin-bottom: 5px;">${processColumns.support.length}</div>
                  <div style="font-size: 14px; color: #6b7280; font-weight: 500;">Support Processes</div>
                </div>
                <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border-left: 4px solid #8b5cf6;">
                  <div style="font-size: 32px; font-weight: bold; color: #8b5cf6; margin-bottom: 5px;">${processColumns.management.length}</div>
                  <div style="font-size: 14px; color: #6b7280; font-weight: 500;">Management Processes</div>
                </div>
                <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border-left: 4px solid #f59e0b;">
                  <div style="font-size: 32px; font-weight: bold; color: #f59e0b; margin-bottom: 5px;">${interactions.length}</div>
                  <div style="font-size: 14px; color: #6b7280; font-weight: 500;">Process Interactions</div>
                </div>
              </div>
            </div>
            
            <!-- Process Hierarchy Visualization -->
            <div style="padding: 30px;">
              <h2 style="color: #0066cc; margin: 0 0 25px 0; font-size: 22px;">Process Hierarchy & Flow</h2>
              ${generateHierarchyView()}
            </div>
            
            <!-- Process Interactions -->
            <div style="padding: 0 30px 30px;">
              ${generateInteractionsTable()}
            </div>
            
            <!-- Detailed Process Cards -->
            <div style="padding: 0 30px 30px;">
              ${generateDetailedProcessCards()}
            </div>
            
            <!-- Footer -->
            <div style="background: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #6b7280; font-size: 14px;">
                <strong>QSE Academy</strong> | Making ISO Certification Accessible<br>
                This report was generated using our ISO 9001 Process Mapping Tool<br>
                For questions, contact: <a href="mailto:support@qse-academy.com" style="color: #0066cc;">support@qse-academy.com</a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `;
    };

    // Prepare client email attachments (only for premium reports)
    const clientAttachments = [];
    if (pdfReport && !isBasicReport) {
      // Extract the base64 content (remove data URL prefix if present)
      const base64Content = pdfReport.includes(',') ? pdfReport.split(',')[1] : pdfReport;
      
      clientAttachments.push({
        filename: `${industry.replace(/\s+/g, '_')}_ISO9001_Process_Report.pdf`,
        content: base64Content,
        type: 'application/pdf',
      });
    }
    // NOTE: Basic reports do NOT get comprehensive report attachment

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

    // Send client email
    const clientEmailResponse = await resend.emails.send({
      from: "QSE Academy <noreply@qse-academy.com>",
      to: [email],
      subject,
      attachments: clientAttachments,
      html: emailContent,
    });

    console.log("Client email sent successfully:", clientEmailResponse);

    // For basic reports, send comprehensive report to support@qse-academy.com separately
    if (isBasicReport && processes.length > 0) {
      const comprehensiveReport = generateComprehensiveReport(processes, processData.interactions || [], industry, email);
      
      // Convert to base64 for attachment
      const base64HTML = btoa(unescape(encodeURIComponent(comprehensiveReport)));
      
      const supportAttachments = [{
        filename: `${industry.replace(/\s+/g, '_')}_Comprehensive_Process_Report.html`,
        content: base64HTML,
        type: 'text/html',
      }];

      // Send detailed report to support
      const supportEmailResponse = await resend.emails.send({
        from: "QSE Academy <noreply@qse-academy.com>",
        to: ["support@qse-academy.com"],
        subject: `New Client Process Report - ${industry} (${email})`,
        attachments: supportAttachments,
        html: `
          <div style="max-width: 600px; margin: 0 auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333;">
            <div style="background: #f8f9fa; padding: 30px; text-align: center; border-bottom: 3px solid #0066cc;">
              <h1 style="color: #0066cc; margin: 0; font-size: 24px; font-weight: 600;">
                New Client Process Report
              </h1>
              <p style="color: #666; margin: 5px 0 0 0; font-size: 14px;">QSE Academy Support Team</p>
            </div>
            
            <div style="padding: 30px;">
              <p style="margin-bottom: 20px; font-size: 16px;">Dear Support Team,</p>
              
              <p style="margin-bottom: 20px;">
                A new client has completed the ISO 9001 Process Mapping Tool. Please find the comprehensive analysis attached.
              </p>
              
              <div style="background: #f8f9fa; border-left: 4px solid #0066cc; padding: 20px; margin: 25px 0;">
                <h3 style="color: #0066cc; margin-top: 0; margin-bottom: 15px;">Client Details</h3>
                <ul style="margin: 0; padding-left: 20px;">
                  <li><strong>Client Email:</strong> ${email}</li>
                  <li><strong>Industry Sector:</strong> ${industry}</li>
                  <li><strong>Total Processes Identified:</strong> ${processCount}</li>
                  <li><strong>Report Generated:</strong> ${new Date().toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</li>
                </ul>
              </div>
              
              <p style="margin-bottom: 20px;">
                The attached comprehensive HTML report includes:
              </p>
              
              <ul style="margin-bottom: 20px; padding-left: 20px;">
                <li>Executive summary dashboard with process statistics</li>
                <li>Process hierarchy visualization (Management → Core → Support)</li>
                <li>Process interactions table with detailed mappings</li>
                <li>Detailed process cards with inputs, outputs, owners, risks, and KPIs</li>
                <li>ISO 9001:2015 compliance mapping</li>
              </ul>
              
              <p style="margin-bottom: 20px;">
                This client received the basic promotional email encouraging them to upgrade to the premium service.
              </p>
              
              <p style="margin-bottom: 5px;">Best regards,</p>
              <p style="margin-bottom: 20px; font-weight: 600;">Automated Process Mapping System</p>
            </div>
          </div>
        `,
      });

      console.log("Support email sent successfully:", supportEmailResponse);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      clientMessageId: clientEmailResponse.data?.id 
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