// Supabase Edge Function for AI-powered process mapping
// This would be deployed as a Supabase Edge Function

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  try {
    const { industry, processes, prompt, onlyBenchmarks } = await req.json()
    
    // Get the OpenAI API key from Supabase secrets
    const apiKey = Deno.env.get('Open AI')
    
    if (!apiKey) {
      console.error('No OpenAI API key found. Available env vars:', Object.keys(Deno.env.toObject()))
      throw new Error('OpenAI API key not configured in Supabase secrets')
    }

    console.log('Using OpenAI API key for request:', !!apiKey)

    // Create appropriate prompt based on request type
    let systemPrompt, userPrompt, maxTokens;
    
    if (onlyBenchmarks) {
      systemPrompt = 'You are a business process expert. Generate industry-specific core business processes as a simple JSON array.';
      userPrompt = `Generate 8-12 essential core business processes for a ${industry} business. Return ONLY a JSON array of process names:
["Process 1", "Process 2", "Process 3", ...]

Examples:
- Dental clinic: ["Patient Registration", "Appointment Scheduling", "Clinical Examination", "Treatment Planning", "Dental Procedures", "Sterilization & Infection Control", "Patient Records Management", "Billing & Insurance Processing"]
- Restaurant: ["Menu Planning", "Food Preparation", "Order Taking", "Customer Service", "Kitchen Operations", "Inventory Management", "Quality Control", "Financial Management"]
- Law firm: ["Client Intake", "Case Management", "Legal Research", "Document Preparation", "Court Representation", "Client Communication", "Billing & Time Tracking", "Compliance Management"]`;
      maxTokens = 800;
    } else {
      systemPrompt = 'You are an ISO 9001:2015 process mapping expert. Generate comprehensive process documentation in JSON format. Always include benchmark industry processes even if not mentioned by the user. Focus on realistic process interactions and flows.';
      userPrompt = prompt;
      maxTokens = 4000;
    }

    // Use OpenAI API for generating industry-specific processes
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: maxTokens
      }),
    })

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      throw new Error('No content received from AI API')
    }

    // Parse and validate the JSON response
    if (onlyBenchmarks) {
      // For benchmark requests, expect a simple array
      const arrayMatch = content.match(/\[[\s\S]*?\]/)
      if (!arrayMatch) {
        throw new Error('No JSON array found in AI response')
      }
      
      const processNames = JSON.parse(arrayMatch[0])
      const processes = processNames.map((name: string, index: number) => ({
        id: String(index + 1),
        name: name
      }))
      
      return new Response(
        JSON.stringify({ processes }),
        { 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST',
            'Access-Control-Allow-Headers': 'Content-Type'
          } 
        }
      )
    }

    // For full process maps
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response')
    }

    const parsed = JSON.parse(jsonMatch[0])
    
    // Validate and format the response
    const processData = {
      processes: parsed.processes?.map((p: any, index: number) => ({
        id: p.id || String(index + 1),
        name: p.name || 'Unnamed Process',
        category: ['core', 'support', 'management'].includes(p.category) ? p.category : 'core',
        inputs: Array.isArray(p.inputs) ? p.inputs.slice(0, 4) : [],
        outputs: Array.isArray(p.outputs) ? p.outputs.slice(0, 4) : [],
        risk: p.risk || 'Process failure risk',
        kpi: p.kpi || 'Process performance metric',
        owner: p.owner || 'Process Owner',
        isoClauses: Array.isArray(p.isoClauses) ? p.isoClauses : ['8.1']
      })) || [],
      interactions: parsed.interactions?.map((i: any) => ({
        from: i.from || '',
        to: i.to || '',
        description: i.description || ''
      })) || [],
      processFlow: parsed.processFlow || null
    }

    return new Response(
      JSON.stringify({ processMap: processData }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Content-Type'
        } 
      }
    )

  } catch (error) {
    console.error('Edge function error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to generate process map',
        fallback: true 
      }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        } 
      }
    )
  }
})