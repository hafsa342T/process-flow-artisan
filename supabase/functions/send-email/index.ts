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
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, industry, processData, pdfReport }: ProcessEmailRequest = await req.json();

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
    const processNames = processData.processes?.map((p: any) => p.name).join(", ") || "None";

    // Prepare email attachments
    const attachments = [];
    if (pdfReport) {
      // Extract the base64 content (remove data URL prefix if present)
      const base64Content = pdfReport.includes(',') ? pdfReport.split(',')[1] : pdfReport;
      
      attachments.push({
        filename: `${industry.replace(/\s+/g, '_')}_ISO9001_Process_Report.html`,
        content: base64Content,
        type: 'text/html',
      });
    }

    const emailResponse = await resend.emails.send({
      from: "QSE Academy <noreply@qse-academy.com>",
      to: [email],
      cc: ["support@qse-academy.com"],
      subject: `ISO 9001 Process Map Report - ${industry}`,
      attachments,
      html: `
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
      `,
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