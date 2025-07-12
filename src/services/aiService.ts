import { ProcessMappingData } from '@/components/ProcessMappingTool';

export interface AIService {
  generateProcessMap(industry: string, userProcesses: string, apiKey?: string): Promise<ProcessMappingData>;
}

export class PerplexityAIService implements AIService {
  private baseUrl = 'https://api.perplexity.ai/chat/completions';

  async generateProcessMap(industry: string, userProcesses: string, apiKey?: string): Promise<ProcessMappingData> {
    if (!apiKey) {
      throw new Error('Perplexity API key is required');
    }

    const prompt = this.buildPrompt(industry, userProcesses);
    
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-large-128k-online',
          messages: [
            {
              role: 'system',
              content: `You are an ISO 9001:2015 process mapping expert. Generate comprehensive process documentation in JSON format. Always include benchmark industry processes even if not mentioned by the user. Focus on realistic process interactions and flows.`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.2,
          top_p: 0.9,
          max_tokens: 4000,
          return_images: false,
          return_related_questions: false,
          search_recency_filter: 'month',
          frequency_penalty: 1,
          presence_penalty: 0
        }),
      });

      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      if (!content) {
        throw new Error('No content received from Perplexity API');
      }

      return this.parseAIResponse(content);
    } catch (error) {
      console.error('Perplexity AI service error:', error);
      throw error;
    }
  }

  private buildPrompt(industry: string, userProcesses: string): string {
    return `
Generate a comprehensive ISO 9001:2015 process map for the ${industry} industry. 

User mentioned these processes: ${userProcesses}

Requirements:
1. Include industry benchmark processes (core, support, management) even if not mentioned by user
2. Add detailed process interactions showing how processes feed into each other
3. Categorize all processes correctly (core/support/management)
4. Include realistic inputs, outputs, risks, KPIs, and responsible roles
5. Map to relevant ISO 9001:2015 clauses
6. Show process flow relationships with descriptions

Return ONLY valid JSON in this exact format:
{
  "processes": [
    {
      "id": "unique_id",
      "name": "Process Name",
      "category": "core|support|management",
      "inputs": ["input1", "input2", "input3"],
      "outputs": ["output1", "output2", "output3"],
      "risk": "Primary risk description",
      "kpi": "Key performance indicator",
      "owner": "Responsible role/title",
      "isoClauses": ["clause1", "clause2"],
      "description": "Brief process description",
      "frequency": "How often process occurs",
      "dependencies": ["process names this depends on"]
    }
  ],
  "interactions": [
    {
      "from": "Source Process Name",
      "to": "Target Process Name", 
      "type": "information|material|service|feedback",
      "description": "What flows between processes",
      "frequency": "continuous|daily|weekly|monthly|as-needed",
      "criticality": "high|medium|low"
    }
  ],
  "processFlow": {
    "primaryFlow": ["process1", "process2", "process3"],
    "supportingFlows": [
      {
        "name": "Support Flow Name",
        "processes": ["support1", "support2"]
      }
    ],
    "feedbackLoops": [
      {
        "from": "end_process",
        "to": "start_process",
        "description": "Improvement feedback"
      }
    ]
  }
}

Focus on ${industry} industry best practices and current ISO 9001:2015 requirements.
`;
  }

  private parseAIResponse(content: string): ProcessMappingData {
    try {
      // Extract JSON from response (handle potential markdown formatting)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate structure and convert to our format
      const processes = parsed.processes?.map((p: any, index: number) => ({
        id: p.id || String(index + 1),
        name: p.name || 'Unnamed Process',
        category: ['core', 'support', 'management'].includes(p.category) ? p.category : 'core',
        inputs: Array.isArray(p.inputs) ? p.inputs.slice(0, 4) : [],
        outputs: Array.isArray(p.outputs) ? p.outputs.slice(0, 4) : [],
        risk: p.risk || 'Process failure risk',
        kpi: p.kpi || 'Process performance metric',
        owner: p.owner || 'Process Owner',
        isoClauses: Array.isArray(p.isoClauses) ? p.isoClauses : ['8.1'],
        description: p.description || '',
        frequency: p.frequency || 'as-needed',
        dependencies: p.dependencies || []
      })) || [];

      const interactions = parsed.interactions?.map((i: any) => ({
        from: i.from || '',
        to: i.to || '',
        type: i.type || 'information',
        description: i.description || '',
        frequency: i.frequency || 'as-needed',
        criticality: i.criticality || 'medium'
      })) || [];

      return {
        processes,
        interactions,
        processFlow: parsed.processFlow || null
      };
    } catch (error) {
      console.error('Error parsing AI response:', error);
      throw new Error('Failed to parse AI response. Please try again.');
    }
  }
}

export const aiService = new PerplexityAIService();