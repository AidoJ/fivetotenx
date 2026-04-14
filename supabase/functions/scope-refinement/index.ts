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
    if (!assessmentId) throw new Error("assessmentId is required");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, serviceKey);

    // Gather all client data in parallel
    const [assessRes, stRes, scopeRes, interviewRes, artifactRes, notesRes] = await Promise.all([
      sb.from("roi_assessments").select("*").eq("id", assessmentId).single(),
      sb.from("straight_talk_responses").select("*").eq("assessment_id", assessmentId).order("created_at", { ascending: false }).limit(1),
      sb.from("scoping_responses").select("*").eq("assessment_id", assessmentId).order("created_at", { ascending: false }).limit(1),
      sb.from("client_interviews").select("*").eq("assessment_id", assessmentId),
      sb.from("client_artifacts").select("*").eq("assessment_id", assessmentId),
      sb.from("lead_notes").select("*").eq("assessment_id", assessmentId),
    ]);

    if (assessRes.error || !assessRes.data) throw new Error("Assessment not found");

    const assessment = assessRes.data;
    const formData = assessment.form_data || {};
    const roiResults = assessment.roi_results || {};
    const discoveryAnswers = assessment.discovery_answers || {};
    const stResponses = stRes.data?.[0]?.responses || {};
    const scopingResponses = scopeRes.data?.[0]?.responses || {};
    const transcripts = (interviewRes.data || []).filter((i: any) => i.transcript).map((i: any) => i.transcript).join("\n\n---\n\n");
    const artifacts = (artifactRes.data || []).map((a: any) => {
      if (a.artifact_type === "text") return `[Note] ${a.title || ""}: ${a.content}`;
      if (a.artifact_type === "link") return `[Link] ${a.title || ""}: ${a.content}`;
      if (a.artifact_type === "file") return `[File] ${a.file_name || a.title || "uploaded file"}`;
      return "";
    }).filter(Boolean).join("\n");
    const notes = (notesRes.data || []).map((n: any) => `[${n.note_type}] ${n.content}`).join("\n");

    // Also fetch existing analysis if available
    const existingAnalysis = (discoveryAnswers as any)?._analysis || null;

    // Build the prompt
    const systemPrompt = `You are a senior solutions architect and business analyst at 5to10X, a digital transformation consultancy. Your role is to perform a thorough "Scope Refinement" gap analysis.

You are reviewing ALL data collected about a prospective client to identify:
1. WORKFLOW GAPS — Steps in their processes that reference undefined sub-processes, unclear hand-offs, or vague actions (e.g. "advise VA to draft contract" — how is that done? what data is supplied?)
2. INTEGRATION UNKNOWNS — Systems mentioned without enough detail about APIs, access, data formats
3. AMBIGUOUS REQUIREMENTS — Vague terms like "automated reporting", "manage leads", "handle invoicing" that need concrete definitions
4. MISSING STAKEHOLDER INFO — Undefined user roles, permissions, approval workflows
5. DATA FLOW GAPS — Where data comes from, where it goes, what format, what triggers the flow
6. EDGE CASES — Error handling, fallback scenarios, what happens when systems are unavailable
7. DEPENDENCY RISKS — If workflow A depends on workflow B, is B fully scoped?
8. COMPLIANCE/SECURITY GAPS — Any regulatory, privacy, or security requirements not addressed

For each gap you find, provide:
- The specific question that needs answering
- The source context (quote or reference from the data that triggered this question)
- A category (group related questions by feature/workflow area)
- Priority: "blocker" (cannot build without this), "important" (significantly affects scope), or "nice_to_know" (would improve the build but not critical)

Return your analysis as a JSON object using the tool provided.`;

    const userPrompt = `## Client: ${assessment.contact_name} — ${assessment.business_name || "Unknown Business"}
Industry: ${assessment.industry || "Not specified"}

## Business Snapshot (Form Data)
${JSON.stringify(formData, null, 2)}

## ROI Results
${JSON.stringify(roiResults, null, 2)}

## Straight Talk™ Questionnaire Responses
${JSON.stringify(stResponses, null, 2)}

## Reality Check™ Scoping Responses
${JSON.stringify(scopingResponses, null, 2)}

## Interview Transcripts
${transcripts || "No transcripts available"}

## Artifacts (Notes, Links, Files)
${artifacts || "No artifacts"}

## Internal Notes
${notes || "No notes"}

## Existing AI Analysis
${existingAnalysis ? JSON.stringify(existingAnalysis, null, 2) : "No analysis run yet"}

## Discovery Answers
${JSON.stringify(discoveryAnswers, null, 2)}

---

Perform a comprehensive scope refinement analysis. Find every gap, ambiguity, and undefined process in the data above. Be thorough — think like an engineer who needs to build this system and identify every question they'd need answered before writing code. Group questions by category/workflow area.`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "scope_refinement_results",
              description: "Return the scope refinement gap analysis results",
              parameters: {
                type: "object",
                properties: {
                  summary: {
                    type: "string",
                    description: "A 2-3 sentence executive summary of the overall scope readiness",
                  },
                  build_readiness_percent: {
                    type: "number",
                    description: "Percentage 0-100 indicating how complete the picture is for building",
                  },
                  categories: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        description: { type: "string" },
                      },
                      required: ["name"],
                    },
                  },
                  questions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        question: { type: "string" },
                        source_context: { type: "string", description: "Quote or reference from the data that triggered this question" },
                        source_type: { type: "string", enum: ["transcript", "questionnaire", "artifact", "analysis", "general"] },
                        category: { type: "string" },
                        priority: { type: "string", enum: ["blocker", "important", "nice_to_know"] },
                      },
                      required: ["question", "category", "priority"],
                    },
                  },
                },
                required: ["summary", "build_readiness_percent", "categories", "questions"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "scope_refinement_results" } },
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited — please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) throw new Error("No structured response from AI");

    const results = JSON.parse(toolCall.function.arguments);

    // Save questions to the database
    const questionsToInsert = (results.questions || []).map((q: any, idx: number) => ({
      assessment_id: assessmentId,
      question: q.question,
      source_context: q.source_context || null,
      source_type: q.source_type || "ai_detected",
      category: q.category,
      priority: q.priority,
      status: "unanswered",
      sort_order: idx,
    }));

    if (questionsToInsert.length > 0) {
      const { error: insertError } = await sb.from("refinement_questions").insert(questionsToInsert);
      if (insertError) console.error("Failed to save questions:", insertError);
    }

    return new Response(JSON.stringify({
      summary: results.summary,
      build_readiness_percent: results.build_readiness_percent,
      categories: results.categories,
      questions_count: questionsToInsert.length,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("scope-refinement error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
