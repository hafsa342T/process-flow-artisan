import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ClientDetailsRequest {
  clientEmail: string;
  industry: string;
  businessName: string;
  products: string;
  processNotes: string;
  additionalRequirements: string;
  logo?: string; // Base64 encoded logo
  processData: any;
  submittedAt: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      clientEmail,
      industry,
      businessName,
      products,
      processNotes,
      additionalRequirements,
      logo,
      processData,
      submittedAt
    }: ClientDetailsRequest = await req.json();

    if (!clientEmail || !industry || !businessName || !products || !processData) {
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

    // Prepare logo attachment for support email if provided
    const attachments = [];
    if (logo) {
      // Extract the base64 content (remove data URL prefix if present)
      const base64Content = logo.includes(',') ? logo.split(',')[1] : logo;
      // Get file extension from data URL or default to png
      const mimeMatch = logo.match(/data:image\/([^;]+);/);
      const extension = mimeMatch ? mimeMatch[1] : 'png';
      
      attachments.push({
        filename: `${businessName.replace(/\s+/g, '_')}_logo.${extension}`,
        content: base64Content,
        type: `image/${extension}`,
      });
    }

    // Generate comprehensive process data summary for support team
    const processDataSummary = `
PROCESS MAPPING RESULTS:
========================

Total Processes: ${processCount}
Process Names: ${processNames}

Process Categories:
${processData.processes?.map((p: any) => `- ${p.name} (${p.category})`).join('\n') || 'None'}

Process Interactions:
${processData.interactions?.map((i: any) => `- ${i.from} → ${i.to}: ${i.description}`).join('\n') || 'None'}

Full Process Data (JSON):
${JSON.stringify(processData, null, 2)}
    `;

    // 1. Send notification email to support team
    const supportEmailContent = `
      <div style="max-width: 800px; margin: 0 auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333;">
        <div style="background: #f8f9fa; padding: 30px; text-align: center; border-bottom: 3px solid #dc3545;">
          <h1 style="color: #dc3545; margin: 0; font-size: 24px; font-weight: 600;">
            🚨 NEW PREMIUM REPORT ORDER
          </h1>
          <p style="color: #666; margin: 5px 0 0 0; font-size: 14px;">Client Payment Confirmed & Details Submitted</p>
        </div>
        
        <div style="padding: 30px;">
          <div style="background: #d1ecf1; border: 1px solid #bee5eb; border-radius: 8px; padding: 20px; margin: 25px 0;">
            <h2 style="color: #0c5460; margin-top: 0; margin-bottom: 15px;">🎯 CLIENT DETAILS</h2>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              <div><strong>Business Name:</strong> ${businessName}</div>
              <div><strong>Industry:</strong> ${industry}</div>
              <div><strong>Email:</strong> ${clientEmail}</div>
              <div><strong>Payment Status:</strong> ✅ PAID ($99)</div>
            </div>
          </div>

          <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin: 25px 0;">
            <h3 style="color: #856404; margin-top: 0; margin-bottom: 15px;">📋 BUSINESS INFORMATION</h3>
            
            <div style="margin-bottom: 15px;">
              <strong>Products/Services:</strong>
              <p style="margin: 5px 0; padding: 10px; background: #fff; border-radius: 4px;">${products}</p>
            </div>

            ${processNotes ? `
            <div style="margin-bottom: 15px;">
              <strong>Current Processes:</strong>
              <p style="margin: 5px 0; padding: 10px; background: #fff; border-radius: 4px;">${processNotes}</p>
            </div>
            ` : ''}

            ${additionalRequirements ? `
            <div style="margin-bottom: 15px;">
              <strong>Additional Requirements:</strong>
              <p style="margin: 5px 0; padding: 10px; background: #fff; border-radius: 4px;">${additionalRequirements}</p>
            </div>
            ` : ''}

            ${logo ? `
            <div style="margin-bottom: 15px;">
              <strong>Logo:</strong> ✅ Provided (see attachment)
            </div>
            ` : `
            <div style="margin-bottom: 15px;">
              <strong>Logo:</strong> ❌ Not provided
            </div>
            `}
          </div>

          <div style="background: #e2e3e5; border: 1px solid #d6d8db; border-radius: 8px; padding: 20px; margin: 25px 0;">
            <h3 style="color: #495057; margin-top: 0; margin-bottom: 15px;">🔄 PROCESS MAPPING DATA</h3>
            <div style="font-family: 'Courier New', monospace; font-size: 12px; background: #fff; padding: 15px; border-radius: 4px; overflow-x: auto;">
              <pre style="margin: 0; white-space: pre-wrap;">${processDataSummary}</pre>
            </div>
          </div>

          <div style="background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center;">
            <h3 style="color: #721c24; margin-top: 0; margin-bottom: 15px;">⏰ ACTION REQUIRED</h3>
            <p style="margin: 0; font-size: 16px; font-weight: 600;">
              Client is expecting their premium report within <strong>48 HOURS</strong>
            </p>
            <p style="margin: 10px 0 0 0; color: #721c24;">
              Submitted: ${new Date(submittedAt).toLocaleString('en-US', { 
                timeZone: 'UTC',
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })} UTC
            </p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="mailto:${clientEmail}" 
               style="display: inline-block; background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; margin: 5px;">
              Reply to Client
            </a>
          </div>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
          <p style="margin: 0; color: #666; font-size: 12px;">
            QSE Academy Premium Report System<br>
            This is an automated notification - Order ID: ${Date.now()}
          </p>
        </div>
      </div>
    `;

    // 2. Send confirmation email to client
    const clientEmailContent = `
      <div style="max-width: 600px; margin: 0 auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333;">
        <div style="background: #f8f9fa; padding: 30px; text-align: center; border-bottom: 3px solid #0066cc;">
          <h1 style="color: #0066cc; margin: 0; font-size: 24px; font-weight: 600;">
            QSE Academy
          </h1>
          <p style="color: #666; margin: 5px 0 0 0; font-size: 14px;">Quality, Safety & Environmental Training</p>
        </div>
        
        <div style="padding: 30px;">
          <p style="margin-bottom: 20px; font-size: 16px;">Dear ${businessName} Team,</p>
          
          <div style="background: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center;">
            <h2 style="color: #155724; margin-top: 0; margin-bottom: 15px;">✅ Order Confirmed & In Progress</h2>
            <p style="margin: 0; font-size: 16px;">
              Thank you for providing your business details! Our ISO 9001 consultant is now working on your custom premium report.
            </p>
          </div>
          
          <div style="background: #f8f9fa; border-left: 4px solid #0066cc; padding: 20px; margin: 25px 0;">
            <h3 style="color: #0066cc; margin-top: 0; margin-bottom: 15px;">📋 Your Order Details</h3>
            <ul style="margin: 0; padding-left: 20px;">
              <li><strong>Business:</strong> ${businessName}</li>
              <li><strong>Industry:</strong> ${industry}</li>
              <li><strong>Processes Analyzed:</strong> ${processCount}</li>
              <li><strong>Logo Provided:</strong> ${logo ? '✅ Yes' : '❌ No'}</li>
              <li><strong>Order Status:</strong> 🔄 In Progress</li>
            </ul>
          </div>

          <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin: 25px 0;">
            <h3 style="color: #856404; margin-top: 0; margin-bottom: 15px;">⏰ What Happens Next?</h3>
            <div style="space-y: 10px;">
              <div style="display: flex; align-items: center; margin-bottom: 10px;">
                <span style="display: inline-block; width: 24px; height: 24px; background: #28a745; color: white; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; margin-right: 10px;">✓</span>
                <span>Payment confirmed & business details received</span>
              </div>
              <div style="display: flex; align-items: center; margin-bottom: 10px;">
                <span style="display: inline-block; width: 24px; height: 24px; background: #007bff; color: white; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; margin-right: 10px;">2</span>
                <span>Expert consultant reviews your processes and creates branded report</span>
              </div>
              <div style="display: flex; align-items: center; margin-bottom: 10px;">
                <span style="display: inline-block; width: 24px; height: 24px; background: #007bff; color: white; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; margin-right: 10px;">3</span>
                <span>Final report delivered to your email within 48 hours</span>
              </div>
            </div>
          </div>

          <div style="background: #e7f3ff; border: 1px solid #b3d9ff; border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center;">
            <h4 style="color: #0066cc; margin-top: 0; margin-bottom: 15px;">📧 Expected Delivery</h4>
            <p style="margin: 0; font-size: 18px; font-weight: 600; color: #0066cc;">
              Within 48 Hours
            </p>
            <p style="margin: 10px 0 0 0; color: #444; font-size: 14px;">
              You'll receive your complete premium report package via email
            </p>
          </div>

          <p style="margin-bottom: 20px;">
            Our consultant will customize your report with your business details, include your logo (if provided), 
            and provide expert recommendations specific to the <strong>${industry}</strong> industry.
          </p>
          
          <p style="margin-bottom: 20px;">
            If you have any questions or need to make changes to your order, please contact us immediately at 
            <a href="mailto:support@qse-academy.com" style="color: #0066cc; text-decoration: none;">support@qse-academy.com</a>.
          </p>
          
          <p style="margin-bottom: 30px;">
            Thank you for choosing QSE Academy for your ISO 9001 implementation needs!
          </p>
          
          <p style="margin-bottom: 5px;">Best regards,</p>
          <p style="margin-bottom: 20px; font-weight: 600;">QSE Academy Consultant Team</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
          <p style="margin: 0; color: #666; font-size: 12px;">
            QSE Academy | Quality, Safety & Environmental Training<br>
            Web: <a href="https://qse-academy.com" style="color: #0066cc;">qse-academy.com</a> | 
            Email: <a href="mailto:support@qse-academy.com" style="color: #0066cc;">support@qse-academy.com</a>
          </p>
          <p style="margin: 10px 0 0 0; color: #999; font-size: 11px;">
            Order submitted: ${new Date(submittedAt).toLocaleString()}
          </p>
        </div>
      </div>
    `;

    // Send both emails
    const [supportEmailResponse, clientEmailResponse] = await Promise.all([
      // Email to support team with all details
      resend.emails.send({
        from: "QSE Academy System <noreply@qse-academy.com>",
        to: ["support@qse-academy.com"],
        cc: ["support@qse-academy.com"], // Adding CC as requested
        subject: `🚨 NEW PREMIUM ORDER: ${businessName} - ${industry} ($99 PAID)`,
        attachments,
        html: supportEmailContent,
      }),

      // Confirmation email to client
      resend.emails.send({
        from: "QSE Academy <noreply@qse-academy.com>",
        to: [clientEmail],
        cc: ["support@qse-academy.com"], // Adding CC as requested
        subject: `✅ Your Premium Report Order is In Progress - ${businessName}`,
        html: clientEmailContent,
      })
    ]);

    console.log("Support email sent:", supportEmailResponse);
    console.log("Client email sent:", clientEmailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      supportMessageId: supportEmailResponse.data?.id,
      clientMessageId: clientEmailResponse.data?.id
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-client-details function:", error);
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