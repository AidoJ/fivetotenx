import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { assessmentId } = await req.json();
    if (!assessmentId) throw new Error("assessmentId required");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, serviceKey);

    // Fetch assessment
    const { data: assessment, error: aErr } = await sb
      .from("roi_assessments")
      .select("*")
      .eq("id", assessmentId)
      .single();
    if (aErr || !assessment) throw new Error("Assessment not found");

    // Fetch straight talk responses
    const { data: stData } = await sb
      .from("straight_talk_responses")
      .select("*")
      .eq("assessment_id", assessmentId)
      .order("created_at", { ascending: false })
      .limit(1);

    // Fetch transcripts
    const { data: interviews } = await sb
      .from("client_interviews")
      .select("transcript, title")
      .eq("assessment_id", assessmentId)
      .not("transcript", "is", null);

    // Fetch questions for context
    const industryId = assessment.industry_id;
    let questionMap: Record<string, string> = {};
    if (industryId) {
      const { data: cats } = await sb
        .from("scoping_categories")
        .select("id, label")
        .eq("industry_id", industryId)
        .eq("phase", "straight_talk");
      const catIds = (cats || []).map((c: any) => c.id);
      const catLabelMap: Record<string, string> = {};
      (cats || []).forEach((c: any) => { catLabelMap[c.id] = c.label; });

      if (catIds.length > 0) {
        const { data: qs } = await sb
          .from("scoping_questions")
          .select("id, question, category_id")
          .in("category_id", catIds);
        (qs || []).forEach((q: any) => {
          questionMap[q.id] = `[${catLabelMap[q.category_id] || ''}] ${q.question}`;
        });
      }
    }

    // Build context
    const formData = assessment.form_data as any || {};
    const roiResults = assessment.roi_results as any || {};
    const discoveryAnswers = assessment.discovery_answers as any || {};
    const stResponses = stData?.[0]?.responses || {};
    const transcriptTexts = (interviews || []).map((i: any) => `--- ${i.title} ---\n${i.transcript}`).join("\n\n");

    // Build Q&A pairs
    const qaPairs: string[] = [];
    for (const [qId, answer] of Object.entries(stResponses)) {
      const qText = questionMap[qId] || qId;
      qaPairs.push(`Q: ${qText}\nA: ${answer}`);
    }

    // Build discovery answer pairs
    const discoveryPairs: string[] = [];
    for (const [key, val] of Object.entries(discoveryAnswers)) {
      const v = val as any;
      if (v.answer && v.confidence !== "not_found") {
        discoveryPairs.push(`Q: ${v.question || key}\nA: ${v.answer} (confidence: ${v.confidence})`);
      }
    }

    const hasTranscripts = !!transcriptTexts;

    const prompt = `You are a business automation consultant for 5to10X. Analyze this client's data and identify the TOP 10 automation/efficiency opportunities.

${hasTranscripts ? `⚠️ PRIORITY DATA SOURCE — INTERVIEW TRANSCRIPTS:
The client's own words from recorded interviews are the MOST IMPORTANT data source. Their spoken priorities, frustrations, and goals should HEAVILY influence your analysis and ranking. Quote specific statements where relevant.

${transcriptTexts}

---` : ''}

CLIENT PROFILE:
- Business: ${assessment.business_name || formData.businessName || 'Unknown'}
- Industry: ${assessment.industry || formData.industry || 'Unknown'}
- Monthly Revenue: $${formData.monthlyRevenue || 'Unknown'}
- Staff: ${formData.staffFullTime || '?'} FT, ${formData.staffPartTime || '?'} PT
- Weekly Admin Hours: ${formData.hoursAdmin || '?'} admin, ${formData.hoursBooking || '?'} booking, ${formData.hoursFollowUps || '?'} follow-ups, ${formData.hoursInvoicing || '?'} invoicing
- ROI Projection: ${roiResults.totalAnnualImpact ? '$' + roiResults.totalAnnualImpact + '/yr' : 'Not calculated'}

STRAIGHT TALK QUESTIONNAIRE RESPONSES:
${qaPairs.length > 0 ? qaPairs.join("\n\n") : "No questionnaire responses available."}

AI-EXTRACTED DISCOVERY ANSWERS:
${discoveryPairs.length > 0 ? discoveryPairs.join("\n\n") : "No extracted answers available."}

${!hasTranscripts ? "INTERVIEW TRANSCRIPTS:\nNo transcripts available — analysis is based on form data and questionnaire responses only. Results may be less precise." : ''}

Based on ALL available data (prioritising the client's own spoken words from transcripts when available), identify the opportunities ranked by potential impact (time saved, revenue gained, cost reduced, risk mitigated).`;

For each opportunity provide:
- A clear title (max 8 words)
- Impact category: "time_savings", "revenue_growth", "cost_reduction", "risk_mitigation", or "customer_experience"
- Estimated annual impact in dollars (be specific based on their numbers)
- Implementation difficulty: "easy", "medium", "hard"  
- A 2-3 sentence explanation of the problem and how automation solves it
- A specific recommendation of what to build/automate

Return the TOP 5 as "big_hits" and the NEXT 5 as "quick_wins".`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a senior business automation analyst. Be specific, data-driven, and actionable." },
          { role: "user", content: prompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "report_opportunities",
            description: "Report the top 10 automation opportunities split into big hits and quick wins",
            parameters: {
              type: "object",
              properties: {
                big_hits: {
                  type: "array",
                  description: "Top 5 highest-impact opportunities",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      impact_category: { type: "string", enum: ["time_savings", "revenue_growth", "cost_reduction", "risk_mitigation", "customer_experience"] },
                      estimated_annual_impact: { type: "number", description: "Dollar value per year" },
                      difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
                      explanation: { type: "string" },
                      recommendation: { type: "string" },
                    },
                    required: ["title", "impact_category", "estimated_annual_impact", "difficulty", "explanation", "recommendation"],
                  },
                },
                quick_wins: {
                  type: "array",
                  description: "Next 5 opportunities",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      impact_category: { type: "string", enum: ["time_savings", "revenue_growth", "cost_reduction", "risk_mitigation", "customer_experience"] },
                      estimated_annual_impact: { type: "number" },
                      difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
                      explanation: { type: "string" },
                      recommendation: { type: "string" },
                    },
                    required: ["title", "impact_category", "estimated_annual_impact", "difficulty", "explanation", "recommendation"],
                  },
                },
                summary: { type: "string", description: "2-3 sentence executive summary of overall findings" },
                total_potential_impact: { type: "number", description: "Sum of all 10 opportunities in dollars" },
              },
              required: ["big_hits", "quick_wins", "summary", "total_potential_impact"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "report_opportunities" } },
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("AI gateway error:", aiRes.status, errText);
      if (aiRes.status === 429) throw new Error("Rate limited – please try again in a moment.");
      if (aiRes.status === 402) throw new Error("AI credits exhausted – please top up in Settings.");
      throw new Error(`AI analysis failed (${aiRes.status})`);
    }

    const aiData = await aiRes.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) throw new Error("No analysis returned from AI");

    const analysis = JSON.parse(toolCall.function.arguments);

    // Save to assessment
    await sb
      .from("roi_assessments")
      .update({ discovery_answers: { ...(assessment.discovery_answers as any || {}), _analysis: analysis } })
      .eq("id", assessmentId);

    return new Response(JSON.stringify({ success: true, analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("analyze-opportunities error:", err);
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
