// Supabase Edge Function for AI-powered process mapping
// This would be deployed as a Supabase Edge Function

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
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
      systemPrompt = `You are an ISO 9001:2015 process mapping expert. Generate comprehensive process documentation in JSON format. 

CRITICAL REQUIREMENT: The following ISO 9001 processes are MANDATORY and MUST be included:
- Management Processes: Leadership, Quality Management, Risk & Opportunity Management  
- Support Processes: Training Competence & Awareness, Customer Satisfaction, Infrastructure & Work Environment, Continual improvement

Add industry-specific core processes alongside these mandatory ones. Focus on realistic process interactions and flows.`;
      userPrompt = prompt;
      maxTokens = 2000; // Reduced token count for faster processing
    }

    // Use OpenAI API for generating industry-specific processes
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Use faster model
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
        temperature: 0.3, // Lower temperature for faster, more consistent responses
        max_tokens: maxTokens,
        stream: false // Ensure no streaming for predictable response times
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
            ...corsHeaders,
            'Content-Type': 'application/json'
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
    
    // MANDATORY ISO 9001 processes that MUST always be included
    const mandatoryProcesses = [
      // Management Processes
      {
        id: 'mgmt_leadership',
        name: 'Leadership',
        category: 'management',
        inputs: ['Organizational context', 'Customer requirements', 'Stakeholder needs'],
        outputs: ['Quality policy', 'Strategic direction', 'Leadership commitment'],
        risk: 'Lack of leadership commitment affecting quality management system',
        kpi: 'Leadership engagement score, quality policy awareness',
        owner: 'Top Management',
        isoClauses: ['5.1', '5.2', '5.3']
      },
      {
        id: 'mgmt_quality',
        name: 'Quality Management',
        category: 'management',
        inputs: ['Quality policy', 'Process performance data', 'Customer feedback'],
        outputs: ['Quality objectives', 'Quality management system', 'Process improvements'],
        risk: 'Quality management system failure leading to non-compliance',
        kpi: 'Quality objectives achievement, customer satisfaction score',
        owner: 'Quality Manager',
        isoClauses: ['4.4', '5.2', '6.2']
      },
      {
        id: 'mgmt_risk',
        name: 'Risk & Opportunity Management',
        category: 'management',
        inputs: ['Internal context', 'External context', 'Process risks'],
        outputs: ['Risk register', 'Opportunity identification', 'Risk mitigation plans'],
        risk: 'Failure to identify and manage risks affecting quality',
        kpi: 'Risk mitigation effectiveness, opportunity realization rate',
        owner: 'Risk Manager',
        isoClauses: ['6.1', '8.1', '9.3']
      },
      // Support Processes
      {
        id: 'sup_training',
        name: 'Training, Competence & Awareness',
        category: 'support',
        inputs: ['Competence requirements', 'Training needs', 'Skill gaps'],
        outputs: ['Training plans', 'Competence records', 'Awareness programs'],
        risk: 'Inadequate competence leading to quality failures',
        kpi: 'Training completion rate, competence assessment scores',
        owner: 'HR Manager',
        isoClauses: ['7.2', '7.3']
      },
      {
        id: 'sup_customer_sat',
        name: 'Customer Satisfaction',
        category: 'support',
        inputs: ['Customer feedback', 'Survey data', 'Complaints'],
        outputs: ['Satisfaction reports', 'Improvement actions', 'Customer retention data'],
        risk: 'Declining customer satisfaction affecting business performance',
        kpi: 'Customer satisfaction index, retention rate, complaint resolution time',
        owner: 'Customer Service Manager',
        isoClauses: ['8.2.1', '9.1.2']
      },
      {
        id: 'sup_infrastructure',
        name: 'Infrastructure & Work Environment',
        category: 'support',
        inputs: ['Infrastructure requirements', 'Environmental needs', 'Equipment specifications'],
        outputs: ['Maintained infrastructure', 'Safe work environment', 'Equipment availability'],
        risk: 'Infrastructure failure affecting product quality',
        kpi: 'Equipment uptime, workplace safety incidents, infrastructure reliability',
        owner: 'Facilities Manager',
        isoClauses: ['7.1.3', '7.1.4']
      },
      {
        id: 'sup_improvement',
        name: 'Continual improvement',
        category: 'support',
        inputs: ['Performance data', 'Non-conformities', 'Improvement opportunities'],
        outputs: ['Improvement plans', 'Corrective actions', 'Process enhancements'],
        risk: 'Stagnation leading to declining performance and competitiveness',
        kpi: 'Number of improvements implemented, performance trend analysis',
        owner: 'Quality Manager',
        isoClauses: ['10.1', '10.2', '10.3']
      }
    ];
    
    // Merge AI-generated processes with mandatory processes (additive approach)
    let allProcesses = [...mandatoryProcesses];
    
    // Add AI-generated processes, allowing additional management/support processes
    if (parsed.processes) {
      const aiProcesses = parsed.processes.map((p: any, index: number) => ({
        id: p.id || String(mandatoryProcesses.length + index + 1),
        name: p.name || 'Unnamed Process',
        category: ['core', 'support', 'management'].includes(p.category) ? p.category : 'core',
        inputs: Array.isArray(p.inputs) ? p.inputs.slice(0, 4) : [],
        outputs: Array.isArray(p.outputs) ? p.outputs.slice(0, 4) : [],
        risk: p.risk || 'Process failure risk',
        kpi: p.kpi || 'Process performance metric',
        owner: p.owner || 'Process Owner',
        isoClauses: Array.isArray(p.isoClauses) ? p.isoClauses : ['8.1']
      }));
      
      // Filter out AI processes that have similar names to mandatory processes (avoid redundancy)
      const mandatoryNames = mandatoryProcesses.map(p => p.name.toLowerCase());
      const uniqueAiProcesses = aiProcesses.filter(p => {
        const pNameLower = p.name.toLowerCase();
        return !mandatoryNames.some(mName => 
          pNameLower.includes(mName.split(' ')[0].toLowerCase()) || 
          mName.includes(pNameLower.split(' ')[0].toLowerCase())
        );
      });
      
      allProcesses = [...mandatoryProcesses, ...uniqueAiProcesses];
    }
    
    // Validate and format the response
    const processData = {
      processes: allProcesses,
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
          ...corsHeaders,
          'Content-Type': 'application/json'
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
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    )
  }
})