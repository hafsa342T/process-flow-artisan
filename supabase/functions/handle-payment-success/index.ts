import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Handle payment success function started");
    
    const { sessionId } = await req.json();
    
    if (!sessionId) {
      throw new Error("Missing session ID");
    }

    console.log("Processing payment success for session:", sessionId);

    // Initialize services
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

    // Verify payment with Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.payment_status !== "paid") {
      throw new Error("Payment not completed");
    }

    console.log("Payment verified as paid");

    // Update report status in database
    const { data: report, error: updateError } = await supabase
      .from("reports")
      .update({ 
        payment_status: "paid",
        updated_at: new Date().toISOString()
      })
      .eq("payment_session_id", sessionId)
      .select()
      .single();

    if (updateError) {
      console.error("Database update error:", updateError);
      throw new Error(`Database error: ${updateError.message}`);
    }

    console.log("Report status updated to paid:", report.id);

    // Send admin notification email
    try {
      await resend.emails.send({
        from: "Process Mapper <noreply@yourdomain.com>",
        to: ["admin@yourdomain.com"], // Replace with your admin email
        subject: "New Premium Report Order - Action Required",
        html: `
          <h2>New Premium Report Order</h2>
          <p>A new premium ISO 9001 process report has been ordered and paid for.</p>
          
          <h3>Order Details:</h3>
          <ul>
            <li><strong>Report ID:</strong> ${report.id}</li>
            <li><strong>Customer Email:</strong> ${report.email}</li>
            <li><strong>Industry:</strong> ${report.industry}</li>
            <li><strong>Amount:</strong> $${(report.amount / 100).toFixed(2)}</li>
            <li><strong>Payment Date:</strong> ${new Date().toLocaleString()}</li>
          </ul>
          
          <h3>Next Steps:</h3>
          <ol>
            <li>Review the process data in your admin dashboard</li>
            <li>Generate the branded PDF report</li>
            <li>Have an expert validate the processes</li>
            <li>Send the final report to the customer</li>
          </ol>
          
          <p><strong>Process Data:</strong></p>
          <pre>${JSON.stringify(report.process_data, null, 2)}</pre>
          
          <p>Please process this order within 24-48 hours as promised to the customer.</p>
        `,
      });
      
      console.log("Admin notification email sent");
    } catch (emailError) {
      console.error("Failed to send admin email:", emailError);
      // Don't fail the entire function if email fails
    }

    // Send customer confirmation email
    try {
      await resend.emails.send({
        from: "Process Mapper <noreply@yourdomain.com>",
        to: [report.email],
        subject: "Payment Confirmed - Your Premium Report is Being Prepared",
        html: `
          <h2>Payment Confirmed!</h2>
          <p>Dear Customer,</p>
          
          <p>Thank you for your purchase! We've received your payment and your premium ISO 9001 process report is now being prepared.</p>
          
          <h3>Order Summary:</h3>
          <ul>
            <li><strong>Order ID:</strong> ${report.id}</li>
            <li><strong>Industry:</strong> ${report.industry}</li>
            <li><strong>Amount Paid:</strong> $${(report.amount / 100).toFixed(2)}</li>
            <li><strong>Status:</strong> In Progress</li>
          </ul>
          
          <h3>What Happens Next:</h3>
          <ol>
            <li><strong>Report Customization:</strong> Our team is adding your company branding</li>
            <li><strong>Expert Review:</strong> ISO 9001 consultant validates your process map</li>
            <li><strong>Quality Check:</strong> Final review and formatting</li>
            <li><strong>Delivery:</strong> You'll receive your report within 24-48 hours</li>
          </ol>
          
          <p>If you have any questions, please contact our support team.</p>
          
          <p>Best regards,<br>The Process Mapper Team</p>
        `,
      });
      
      console.log("Customer confirmation email sent");
    } catch (emailError) {
      console.error("Failed to send customer email:", emailError);
      // Don't fail the entire function if email fails
    }

    return new Response(JSON.stringify({ 
      success: true,
      reportId: report.id,
      status: "paid"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in handle-payment-success function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});