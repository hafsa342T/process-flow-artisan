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

interface ClientDetailsEmailRequest {
  type: 'client-details' | 'client-confirmation';
  email: string;
  clientDetails?: {
    businessName: string;
    industry: string;
    products: string;
    processNotes: string;
    additionalRequests: string;
    logo?: string;
  };
  clientName?: string;
  processData?: any;
  to: string;
  cc?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    
    // Handle different email types
    if (requestBody.type === 'client-details') {
      return await handleClientDetailsEmail(requestBody as ClientDetailsEmailRequest);
    } else if (requestBody.type === 'client-confirmation') {
      return await handleClientConfirmationEmail(requestBody as ClientDetailsEmailRequest);
    }
    
    // Handle original process email format
    const { email, industry, processData, pdfReport, isBasicReport = false }: ProcessEmailRequest = requestBody;

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

    const subject = isBasicReport 
      ? `Your Process Overview - ${industry}`
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
      cc: isBasicReport ? [] : ["support@qse-academy.com"],
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

// Handler for client details email to consultant team
async function handleClientDetailsEmail(request: ClientDetailsEmailRequest): Promise<Response> {
  const { email, clientDetails, processData, to, cc } = request;
  
  const emailHtml = `
    <div style="max-width: 600px; margin: 0 auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333;">
      <div style="background: #f8f9fa; padding: 30px; text-align: center; border-bottom: 3px solid #0066cc;">
        <h1 style="color: #0066cc; margin: 0; font-size: 24px; font-weight: 600;">
          QSE Academy - New Premium Report Request
        </h1>
        <p style="color: #666; margin: 5px 0 0 0; font-size: 14px;">Client Payment Confirmed</p>
      </div>
      
      <div style="padding: 30px;">
        <div style="background: #e7f3ff; border: 1px solid #b3d9ff; border-radius: 8px; padding: 20px; margin: 25px 0;">
          <h3 style="color: #0066cc; margin-top: 0; margin-bottom: 15px;">Client Details</h3>
          <ul style="margin: 0; padding-left: 20px;">
            <li><strong>Business Name:</strong> ${clientDetails?.businessName}</li>
            <li><strong>Email:</strong> ${email}</li>
            <li><strong>Industry:</strong> ${clientDetails?.industry}</li>
            <li><strong>Products/Services:</strong> ${clientDetails?.products}</li>
          </ul>
        </div>
        
        ${clientDetails?.processNotes ? `
        <div style="background: #f8f9fa; border-left: 4px solid #0066cc; padding: 20px; margin: 25px 0;">
          <h4 style="color: #0066cc; margin-top: 0; margin-bottom: 15px;">Process Notes:</h4>
          <p style="margin: 0;">${clientDetails.processNotes}</p>
        </div>
        ` : ''}
        
        ${clientDetails?.additionalRequests ? `
        <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; margin: 25px 0;">
          <h4 style="color: #856404; margin-top: 0; margin-bottom: 15px;">Additional Requirements:</h4>
          <p style="margin: 0;">${clientDetails.additionalRequests}</p>
        </div>
        ` : ''}
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0;">
          <h4 style="margin-top: 0; margin-bottom: 15px;">Process Mapping Data:</h4>
          <pre style="background: #fff; padding: 15px; border-radius: 5px; overflow-x: auto; font-size: 12px; border: 1px solid #ddd;">
${JSON.stringify(processData, null, 2)}
          </pre>
        </div>
        
        <div style="background: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px; padding: 20px; margin: 25px 0;">
          <h4 style="color: #155724; margin-top: 0; margin-bottom: 15px;">⏰ Delivery Expectation</h4>
          <p style="margin: 0; color: #155724;"><strong>Client expects delivery within 48 hours</strong></p>
        </div>
      </div>
    </div>
  `;

  const attachments = [];
  if (clientDetails?.logo) {
    attachments.push({
      filename: 'client-logo.png',
      content: clientDetails.logo.split(',')[1], // Remove data:image/png;base64, prefix
      encoding: 'base64'
    });
  }

  const emailResponse = await resend.emails.send({
    from: 'QSE Academy <noreply@qse-academy.com>',
    to: [to],
    cc: cc ? [cc] : undefined,
    subject: `🔥 New Premium Report Request - ${clientDetails?.businessName}`,
    html: emailHtml,
    attachments: attachments.length > 0 ? attachments : undefined
  });

  return new Response(JSON.stringify(emailResponse), {
    status: 200,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

// Handler for client confirmation email
async function handleClientConfirmationEmail(request: ClientDetailsEmailRequest): Promise<Response> {
  const { email, clientName, to, cc } = request;
  
  const emailHtml = `
    <div style="max-width: 600px; margin: 0 auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333;">
      <div style="background: #f8f9fa; padding: 30px; text-align: center; border-bottom: 3px solid #0066cc;">
        <h1 style="color: #0066cc; margin: 0; font-size: 24px; font-weight: 600;">
          QSE Academy
        </h1>
        <p style="color: #666; margin: 5px 0 0 0; font-size: 14px;">Quality, Safety & Environmental Training</p>
      </div>
      
      <div style="padding: 30px;">
        <h2 style="color: #0066cc; margin-bottom: 20px;">Thank you for your purchase, ${clientName}!</h2>
        
        <p style="margin-bottom: 20px; font-size: 16px;">
          We've received your payment and business details. Our ISO 9001 consultant is now working on your custom branded process map report.
        </p>
        
        <div style="background: #e7f3ff; border: 1px solid #b3d9ff; border-radius: 8px; padding: 25px; margin: 30px 0;">
          <h3 style="color: #0066cc; margin-top: 0; margin-bottom: 20px;">What happens next:</h3>
          <div style="margin-bottom: 15px;">
            <span style="background: #28a745; color: white; border-radius: 50%; width: 20px; height: 20px; display: inline-block; text-align: center; line-height: 20px; font-size: 12px; margin-right: 10px;">✓</span>
            <strong>Payment confirmed</strong>
          </div>
          <div style="margin-bottom: 15px;">
            <span style="background: #ffc107; color: white; border-radius: 50%; width: 20px; height: 20px; display: inline-block; text-align: center; line-height: 20px; font-size: 12px; margin-right: 10px;">🔄</span>
            <strong>Our consultant is customizing your report with your branding</strong>
          </div>
          <div style="margin-bottom: 15px;">
            <span style="background: #17a2b8; color: white; border-radius: 50%; width: 20px; height: 20px; display: inline-block; text-align: center; line-height: 20px; font-size: 12px; margin-right: 10px;">📊</span>
            <strong>Adding expert recommendations for ISO 9001 compliance</strong>
          </div>
          <div style="margin-bottom: 0;">
            <span style="background: #6c757d; color: white; border-radius: 50%; width: 20px; height: 20px; display: inline-block; text-align: center; line-height: 20px; font-size: 12px; margin-right: 10px;">📧</span>
            <strong>You'll receive your report within 48 hours</strong>
          </div>
        </div>
        
        <div style="background: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center;">
          <h4 style="color: #155724; margin-top: 0; margin-bottom: 10px;">⏰ Expected Delivery</h4>
          <p style="margin: 0; color: #155724; font-size: 16px;"><strong>Within 48 hours to this email address</strong></p>
        </div>
        
        <p style="margin-bottom: 20px;">
          If you have any questions, please contact our support team at 
          <a href="mailto:support@qse-academy.com" style="color: #0066cc; text-decoration: none;">support@qse-academy.com</a>
        </p>
        
        <p style="margin-bottom: 5px;">Best regards,</p>
        <p style="margin-bottom: 20px; font-weight: 600;">The QSE Academy Team</p>
      </div>
      
      <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
        <p style="margin: 0; color: #666; font-size: 12px;">
          QSE Academy | Quality, Safety & Environmental Training<br>
          Web: <a href="https://qse-academy.com" style="color: #0066cc;">qse-academy.com</a> | 
          Email: <a href="mailto:support@qse-academy.com" style="color: #0066cc;">support@qse-academy.com</a>
        </p>
      </div>
    </div>
  `;

  const emailResponse = await resend.emails.send({
    from: 'QSE Academy <noreply@qse-academy.com>',
    to: [to],
    cc: cc ? [cc] : undefined,
    subject: 'Your ISO 9001 Process Map Report is Being Prepared - 48H Delivery',
    html: emailHtml
  });

  return new Response(JSON.stringify(emailResponse), {
    status: 200,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

serve(handler);