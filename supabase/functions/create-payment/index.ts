import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Create payment function started");
    
    const { email, industry, processData } = await req.json();
    
    if (!email || !industry || !processData) {
      throw new Error("Missing required fields: email, industry, or processData");
    }

    console.log("Payment request for:", { email, industry });

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Initialize Supabase with service role key for database operations
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { 
              name: "Premium ISO 9001 Process Report",
              description: `Custom branded process report for ${industry} industry`
            },
            unit_amount: 9900, // $99.00 in cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/payment-success?email=${encodeURIComponent(email)}&industry=${encodeURIComponent(industry)}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/payment?email=${encodeURIComponent(email)}&industry=${encodeURIComponent(industry)}`,
      metadata: {
        email,
        industry,
      },
    });

    console.log("Stripe session created:", session.id);

    // Store the report data in the database
    const { data: reportData, error: insertError } = await supabase
      .from("reports")
      .insert({
        email,
        industry,
        process_data: processData,
        payment_session_id: session.id,
        payment_status: "pending",
        amount: 9900,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Database insert error:", insertError);
      throw new Error(`Database error: ${insertError.message}`);
    }

    console.log("Report stored in database:", reportData.id);

    return new Response(JSON.stringify({ 
      url: session.url,
      sessionId: session.id,
      reportId: reportData.id
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in create-payment function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});