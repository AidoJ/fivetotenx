import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const DISCOVERY_QUESTIONS = {
  operations_workflows: "What are the main daily/weekly workflows and processes in the business?",
  operations_bottlenecks: "What are the biggest bottlenecks or time-wasters in current operations?",
  operations_seasonal: "Are there seasonal patterns or peak periods that affect operations?",
  systems_crm_pos: "What CRM, POS, or core business systems are currently in use?",
  systems_data_migration: "Is there existing data that needs to be migrated to the new system?",
  systems_pain_points: "What doesn't work well with current systems/tools?",
  users_internal_roles: "What internal user roles will need access to the system (admin, staff, manager)?",
  users_customer_portal: "Do customers need their own portal or self-service features?",
  users_tech_proficiency: "What is the general technical proficiency of the team?",
  revenue_success_metrics: "What does success look like? What specific metrics or KPIs should improve?",
  revenue_new_streams: "Are there new revenue streams or services the platform should enable?",
  revenue_pricing_model: "Is there a specific pricing or billing model the system needs to support?",
  compliance_regulations: "Are there industry-specific regulations or compliance requirements (health, finance, etc.)?",
  compliance_data_residency: "Are there data residency or privacy requirements (e.g., data must stay in AU)?",
  logistics_decision_makers: "Who are the key decision-makers and stakeholders for this project?",
  logistics_hard_deadlines: "Are there any hard deadlines or launch dates to work towards?",
  logistics_support_expectations: "What ongoing support and maintenance expectations are there post-launch?",
  logistics_budget_constraints: "Are there specific budget constraints or approval processes?",
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { assessmentId } = await req.json();
    if (!assessmentId) throw new Error('assessmentId is required');

    // Gather all transcripts for this assessment
    const { data: interviews, error: intErr } = await supabase
      .from('client_interviews')
      .select('transcript, content, title')
      .eq('assessment_id', assessmentId)
      .order('interviewed_at', { ascending: true });

    if (intErr) throw new Error(`Failed to fetch interviews: ${intErr.message}`);

    const allText = (interviews || [])
      .map(i => {
        const parts = [];
        if (i.title) parts.push(`[${i.title}]`);
        if (i.transcript) parts.push(i.transcript);
        if (i.content) parts.push(i.content);
        return parts.join('\n');
      })
      .filter(Boolean)
      .join('\n\n---\n\n');

    if (!allText.trim()) {
      return new Response(JSON.stringify({ success: false, error: 'No transcript or notes content to extract from' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build the tool schema from our questions
    const properties: Record<string, any> = {};
    const propertyNames = Object.keys(DISCOVERY_QUESTIONS);
    for (const [key, question] of Object.entries(DISCOVERY_QUESTIONS)) {
      properties[key] = {
        type: "object",
        properties: {
          answer: { type: "string", description: `Answer to: ${question}` },
          confidence: { type: "string", enum: ["high", "medium", "low", "not_found"], description: "How confident the answer was found in the transcript" },
          source_quote: { type: "string", description: "Brief quote from transcript supporting this answer" },
        },
        required: ["answer", "confidence"],
        additionalProperties: false,
      };
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are an expert business analyst. You will be given transcripts from discovery calls with a client. Extract answers to specific business scoping questions. If a question's answer is not found in the transcript, set confidence to "not_found" and answer to empty string. Be precise and extract actual details mentioned, not generic statements.`
          },
          {
            role: 'user',
            content: `Here are the discovery call transcripts:\n\n${allText}\n\nPlease extract structured answers to all the discovery questions.`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_discovery_answers",
              description: "Extract structured answers from discovery call transcripts",
              parameters: {
                type: "object",
                properties,
                required: propertyNames,
                additionalProperties: false,
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "extract_discovery_answers" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI usage limit reached. Please add credits.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errText = await response.text();
      console.error('AI Gateway error:', response.status, errText);
      throw new Error(`AI extraction failed: ${response.status}`);
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall?.function?.arguments) {
      throw new Error('No structured output from AI');
    }

    let extractedAnswers: Record<string, any>;
    try {
      extractedAnswers = typeof toolCall.function.arguments === 'string' 
        ? JSON.parse(toolCall.function.arguments) 
        : toolCall.function.arguments;
    } catch {
      throw new Error('Failed to parse AI structured output');
    }

    // Save to assessment record
    const { error: updateError } = await supabase
      .from('roi_assessments')
      .update({ discovery_answers: extractedAnswers })
      .eq('id', assessmentId);

    if (updateError) {
      console.error('Failed to save discovery answers:', updateError);
      throw new Error(`Failed to save: ${updateError.message}`);
    }

    return new Response(JSON.stringify({ success: true, answers: extractedAnswers }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Extraction error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
