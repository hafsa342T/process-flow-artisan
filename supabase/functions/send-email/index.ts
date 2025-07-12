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
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, industry, processData }: ProcessEmailRequest = await req.json();

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

    const emailResponse = await resend.emails.send({
      from: "ISO Process Mapper <onboarding@resend.dev>",
      to: [email],
      subject: `Your ${industry} ISO 9001 Process Map is Ready`,
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <h1 style="color: #2563eb; border-bottom: 2px solid #e5e7eb; padding-bottom: 16px;">
            Your ISO 9001 Process Map
          </h1>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #1e40af; margin-top: 0;">Industry: ${industry}</h2>
            <p style="color: #64748b; margin-bottom: 16px;">
              Generated ${processCount} comprehensive processes for your organization.
            </p>
            
            <h3 style="color: #374151; margin-bottom: 8px;">Process Overview:</h3>
            <p style="color: #6b7280; line-height: 1.6;">
              ${processNames.substring(0, 200)}${processNames.length > 200 ? "..." : ""}
            </p>
          </div>
          
          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0;">
            <h3 style="color: #92400e; margin-top: 0;">Next Steps:</h3>
            <ul style="color: #a16207; line-height: 1.6;">
              <li>Review and customize the generated processes</li>
              <li>Map process interactions within your organization</li>
              <li>Assign process owners and responsibilities</li>
              <li>Implement monitoring and measurement systems</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <p style="color: #64748b;">
              This process map was generated using industry benchmarks and best practices.
            </p>
          </div>
          
          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center;">
            <p style="color: #9ca3af; font-size: 14px;">
              © 2024 ISO 9001 Process Mapper. All rights reserved.
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