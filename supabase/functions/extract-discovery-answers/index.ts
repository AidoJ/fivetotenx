import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
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

    // Get the assessment to find its industry_id
    const { data: assessment, error: assessErr } = await supabase
      .from('roi_assessments')
      .select('industry_id, industry')
      .eq('id', assessmentId)
      .single();

    if (assessErr) throw new Error(`Failed to fetch assessment: ${assessErr.message}`);

    // Dynamically load Straight Talk questions from the database for this industry
    let questionMap: Record<string, string> = {};

    if (assessment?.industry_id) {
      // Get straight_talk categories for this industry
      const { data: categories } = await supabase
        .from('scoping_categories')
        .select('id, label, slug')
        .eq('industry_id', assessment.industry_id)
        .eq('phase', 'straight_talk')
        .order('sort_order');

      if (categories && categories.length > 0) {
        const categoryIds = categories.map((c: any) => c.id);

        // Get all questions for these categories
        const { data: questions } = await supabase
          .from('scoping_questions')
          .select('id, category_id, question')
          .in('category_id', categoryIds)
          .order('sort_order');

        if (questions) {
          // Build a map: category_slug + question_index -> question text
          // This gives us a stable key structure for extraction
          for (const q of questions as any[]) {
            const cat = categories.find((c: any) => c.id === q.category_id);
            if (cat) {
              const slug = (cat as any).slug.replace(/^st-/, '');
              const key = `${slug}__${q.id.slice(0, 8)}`;
              questionMap[key] = q.question;
            }
          }
        }
      }
    }

    // Fallback: if no industry-specific questions found, use generic discovery questions
    if (Object.keys(questionMap).length === 0) {
      questionMap = {
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
        compliance_regulations: "Are there industry-specific regulations or compliance requirements?",
        compliance_data_residency: "Are there data residency or privacy requirements?",
        logistics_decision_makers: "Who are the key decision-makers and stakeholders for this project?",
        logistics_hard_deadlines: "Are there any hard deadlines or launch dates to work towards?",
        logistics_support_expectations: "What ongoing support and maintenance expectations are there post-launch?",
        logistics_budget_constraints: "Are there specific budget constraints or approval processes?",
      };
    }

    // Gather all transcripts for this assessment
    const { data: interviews, error: intErr } = await supabase
      .from('client_interviews')
      .select('transcript, content, title')
      .eq('assessment_id', assessmentId)
      .order('interviewed_at', { ascending: true });

    if (intErr) throw new Error(`Failed to fetch interviews: ${intErr.message}`);

    const allText = (interviews || [])
      .map((i: any) => {
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

    // Use a compact output schema to avoid provider schema-state limits on large dynamic question sets.
    const questionEntries = Object.entries(questionMap);
    const questionList = questionEntries
      .map(([key, q], i) => `${i + 1}. [${key}] ${q}`)
      .join('\n');

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
            content: `You are an expert business analyst extracting answers from interview transcripts. You must map transcript content to these exact keys/questions:\n\n${questionList}\n\nReturn one answer item for every key. If an answer is not found, set confidence to "not_found" and answer to empty string. Keep quotes short and specific.`
          },
          {
            role: 'user',
            content: `Here are the interview transcripts:\n\n${allText}\n\nExtract structured answers for ALL keys above.`
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'extract_discovery_answers',
              description: 'Extract structured answers from interview transcripts mapped to specific business questions',
              parameters: {
                type: 'object',
                properties: {
                  answers: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        key: { type: 'string', description: 'Must exactly match one provided question key' },
                        answer: { type: 'string', description: 'Concise extracted answer' },
                        confidence: { type: 'string', enum: ['high', 'medium', 'low', 'not_found'] },
                        source_quote: { type: 'string', description: 'Short supporting quote from transcript' },
                      },
                      required: ['key', 'answer', 'confidence'],
                      additionalProperties: false,
                    }
                  }
                },
                required: ['answers'],
                additionalProperties: false,
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'extract_discovery_answers' } },
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

    let parsedPayload: Record<string, any>;
    try {
      parsedPayload = typeof toolCall.function.arguments === 'string'
        ? JSON.parse(toolCall.function.arguments)
        : toolCall.function.arguments;
    } catch {
      throw new Error('Failed to parse AI structured output');
    }

    const allowedConfidence = new Set(['high', 'medium', 'low', 'not_found']);

    // Seed all expected keys so downstream UI always has predictable output.
    const enrichedAnswers: Record<string, any> = {};
    for (const [key, question] of questionEntries) {
      enrichedAnswers[key] = {
        answer: '',
        confidence: 'not_found',
        source_quote: '',
        question,
      };
    }

    const aiAnswers = Array.isArray(parsedPayload?.answers) ? parsedPayload.answers : [];
    for (const item of aiAnswers) {
      const key = typeof item?.key === 'string' ? item.key : '';
      if (!key || !(key in questionMap)) continue;

      const confidence = typeof item?.confidence === 'string' && allowedConfidence.has(item.confidence)
        ? item.confidence
        : 'low';

      enrichedAnswers[key] = {
        answer: typeof item?.answer === 'string' ? item.answer : '',
        confidence,
        source_quote: typeof item?.source_quote === 'string' ? item.source_quote : '',
        question: questionMap[key],
      };
    }

    // Save to assessment record
    const { error: updateError } = await supabase
      .from('roi_assessments')
      .update({ discovery_answers: enrichedAnswers })
      .eq('id', assessmentId);

    if (updateError) {
      console.error('Failed to save discovery answers:', updateError);
      throw new Error(`Failed to save: ${updateError.message}`);
    }

    return new Response(JSON.stringify({ success: true, answers: enrichedAnswers }), {
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
