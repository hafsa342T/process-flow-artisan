import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WebhookRequest {
  email: string;
  industry: string;
  processes_count: number;
  source: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, industry, processes_count, source }: WebhookRequest = await req.json();

    // Input validation
    if (!email || !email.includes('@')) {
      return new Response(
        JSON.stringify({ error: 'Valid email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!industry || industry.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Industry is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (typeof processes_count !== 'number' || processes_count < 0) {
      return new Response(
        JSON.stringify({ error: 'Valid processes count is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get Zoho webhook URL from environment
    const zohoWebhookUrl = Deno.env.get('ZOHO_WEBHOOK_URL');
    if (!zohoWebhookUrl) {
      console.error('ZOHO_WEBHOOK_URL not configured');
      return new Response(
        JSON.stringify({ error: 'Webhook configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare form data for Zoho webhook
    const formData = new FormData();
    formData.append('email', email);
    formData.append('industry', industry);
    formData.append('timestamp', new Date().toISOString());
    formData.append('processes_count', processes_count.toString());
    formData.append('source', source || 'process_mapping_tool');

    console.log('Sending data to Zoho webhook for email:', email);

    // Send to Zoho webhook with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      const response = await fetch(zohoWebhookUrl, {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error('Zoho webhook responded with status:', response.status);
        // Don't fail the entire request if webhook fails
      } else {
        console.log('Successfully sent data to Zoho webhook for email:', email);
      }
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('Error sending to Zoho webhook:', error);
      // Don't fail the entire request if webhook fails
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Webhook processed successfully' }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('Error in send-webhook function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
};

serve(handler);