import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp"];
const TEXT_EXTENSIONS = [".txt", ".md", ".csv", ".json", ".xml", ".html", ".htm"];

const truncate = (value: string, max = 8000) => {
  const trimmed = value.trim();
  return trimmed.length > max ? `${trimmed.slice(0, max)}…[truncated]` : trimmed;
};

const stripHtml = (html: string) => html
  .replace(/<script[\s\S]*?<\/script>/gi, " ")
  .replace(/<style[\s\S]*?<\/style>/gi, " ")
  .replace(/<[^>]+>/g, " ")
  .replace(/\s+/g, " ")
  .trim();

const hasMeaningfulData = (value: unknown): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.some(hasMeaningfulData);
  if (typeof value === "object") return Object.values(value as Record<string, unknown>).some(hasMeaningfulData);
  return true;
};

const getExtension = (value?: string | null) => {
  if (!value) return "";
  const cleanValue = value.split("?")[0].toLowerCase();
  const lastDot = cleanValue.lastIndexOf(".");
  return lastDot >= 0 ? cleanValue.slice(lastDot) : "";
};

const isImageAsset = (value?: string | null) => IMAGE_EXTENSIONS.includes(getExtension(value));
const isTextAsset = (value?: string | null) => TEXT_EXTENSIONS.includes(getExtension(value));

const fetchTextPreview = async (url: string) => {
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) return null;

    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("text/html")) {
      return truncate(stripHtml(await response.text()), 6000);
    }

    if (contentType.startsWith("text/") || contentType.includes("json") || contentType.includes("xml")) {
      return truncate(await response.text(), 6000);
    }

    return null;
  } catch {
    return null;
  }
};

const buildArtifactEvidence = async (artifacts: any[]) => {
  const summary = {
    total: artifacts.length,
    text: 0,
    links: 0,
    files: 0,
    images_reviewed: 0,
    link_previews: 0,
    text_file_previews: 0,
  };

  const reviewedChunks = await Promise.all((artifacts || []).map(async (artifact: any) => {
    const title = artifact.title || artifact.file_name || "Untitled artifact";

    if (artifact.artifact_type === "text") {
      summary.text += 1;
      return `[Artifact Note] ${title}: ${truncate(artifact.content || "", 4000)}`;
    }

    if (artifact.artifact_type === "link") {
      summary.links += 1;
      const url = artifact.content || "";
      const preview = url ? await fetchTextPreview(url) : null;
      if (preview) summary.link_previews += 1;

      return preview
        ? `[Artifact Link] ${title}: ${url}\nLinked content preview:\n${preview}`
        : `[Artifact Link] ${title}: ${url}`;
    }

    if (artifact.artifact_type === "file") {
      summary.files += 1;
      const fileUrl = artifact.file_url || "";
      const fileName = artifact.file_name || title;

      if (isImageAsset(fileName) || isImageAsset(fileUrl)) {
        summary.images_reviewed += 1;
        return {
          text: `[Artifact File - Image] ${title}: ${fileName}${fileUrl ? ` (${fileUrl})` : ""}`,
          imageUrl: fileUrl,
        };
      }

      if (fileUrl && (isTextAsset(fileName) || isTextAsset(fileUrl))) {
        const preview = await fetchTextPreview(fileUrl);
        if (preview) {
          summary.text_file_previews += 1;
          return `[Artifact File - Text] ${title}: ${fileName}\nFile preview:\n${preview}`;
        }
      }

      return `[Artifact File] ${title}: ${fileName}${fileUrl ? ` (${fileUrl})` : ""}`;
    }

    return null;
  }));

  const artifactContext: string[] = [];
  const imageInputs: Array<{ type: "image_url"; image_url: { url: string } }> = [];
  const imageLabels: string[] = [];

  for (const chunk of reviewedChunks) {
    if (!chunk) continue;

    if (typeof chunk === "string") {
      artifactContext.push(chunk);
      continue;
    }

    artifactContext.push(chunk.text);
    if (chunk.imageUrl) {
      imageLabels.push(chunk.text.replace(/^\[Artifact File - Image\]\s*/, ""));
      imageInputs.push({ type: "image_url", image_url: { url: chunk.imageUrl } });
    }
  }

  return {
    artifactContext: artifactContext.filter(Boolean).join("\n\n"),
    imageInputs: imageInputs.slice(0, 6),
    imageLabels: imageLabels.slice(0, 6),
    summary,
  };
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
    const [assessRes, stRes, scopeRes, interviewRes, artifactRes, notesRes, deepDiveRes] = await Promise.all([
      sb.from("roi_assessments").select("*").eq("id", assessmentId).single(),
      sb.from("straight_talk_responses").select("*").eq("assessment_id", assessmentId).order("created_at", { ascending: false }).limit(1),
      sb.from("scoping_responses").select("*").eq("assessment_id", assessmentId).order("created_at", { ascending: false }).limit(1),
      sb.from("client_interviews").select("*").eq("assessment_id", assessmentId),
      sb.from("client_artifacts").select("*").eq("assessment_id", assessmentId),
      sb.from("lead_notes").select("*").eq("assessment_id", assessmentId),
      sb.from("deep_dive_submissions").select("*").eq("assessment_id", assessmentId).order("created_at", { ascending: false }).limit(1),
    ]);

    if (assessRes.error || !assessRes.data) throw new Error("Assessment not found");

    const assessment = assessRes.data;
    const formData = assessment.form_data || {};
    const roiResults = assessment.roi_results || {};
    const discoveryAnswers = assessment.discovery_answers || {};
    const discoveryChecklist = assessment.discovery_checklist || {};
    const techStack = assessment.tech_stack || {};
    const stResponses = stRes.data?.[0]?.responses || {};
    const scopingResponses = scopeRes.data?.[0]?.responses || {};
    const deepDive = deepDiveRes.data?.[0] || null;
    const interviews = interviewRes.data || [];
    const transcripts = interviews
      .filter((i: any) => i.transcript)
      .map((i: any) => `[${i.title || "Interview"}]\n${truncate(i.transcript, 12000)}`)
      .join("\n\n---\n\n");
    const artifactEvidence = await buildArtifactEvidence(artifactRes.data || []);
    const notes = (notesRes.data || []).map((n: any) => `[${n.note_type}] ${n.content}`).join("\n");
    const hasRealityCheck = hasMeaningfulData(formData) || hasMeaningfulData(scopingResponses);
    const hasStraightTalk = hasMeaningfulData(stResponses) || interviews.some((i: any) => i.call_completed || i.transcript || i.content) || assessment.discovery_ready === true;

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

Rules:
- Review ALL supplied evidence types: forms, questionnaires, transcripts, artifacts, notes, Deep Dive inputs, linked pages, uploaded files, and workflow images.
- Do NOT generate a generic discovery questionnaire or a broad question bank.
- Every question must be grounded in a specific missing detail from the evidence and include a source_context quote/reference.
- If workflow images or linked/file artifacts are supplied, inspect them and ask about ambiguous steps, inputs, handoffs, systems, approvals, and data used in those steps.
- If an area is already clear, do not invent questions for it.
- Prefer precise build-blocking questions over high-level generic prompts.

For each gap you find, provide:
- The specific question that needs answering
- The source context (quote or reference from the data that triggered this question)
- A category (group related questions by feature/workflow area)
- Priority: "blocker" (cannot build without this), "important" (significantly affects scope), or "nice_to_know" (would improve the build but not critical)

Return your analysis as a JSON object using the tool provided.`;

    const userPrompt = `## Client: ${assessment.contact_name} — ${assessment.business_name || "Unknown Business"}
Industry: ${assessment.industry || "Not specified"}

## Source Audit
- Reality Check™ present: ${hasRealityCheck ? "yes" : "no"}
- Straight Talk™ / call present: ${hasStraightTalk ? "yes" : "no"}
- Interview transcripts: ${interviews.filter((i: any) => i.transcript).length}
- Artifacts: ${artifactEvidence.summary.total} total (${artifactEvidence.summary.text} notes, ${artifactEvidence.summary.links} links, ${artifactEvidence.summary.files} files)
- Internal notes: ${(notesRes.data || []).length}
- Deep Dive submission: ${deepDive ? "yes" : "no"}

## Business Snapshot (Form Data)
${JSON.stringify(formData, null, 2)}

## ROI Results
${JSON.stringify(roiResults, null, 2)}

## Discovery Checklist
${JSON.stringify(discoveryChecklist, null, 2)}

## Straight Talk™ Questionnaire Responses
${JSON.stringify(stResponses, null, 2)}

## Reality Check™ Scoping Responses
${JSON.stringify(scopingResponses, null, 2)}

## Deep Dive Submission
${deepDive ? JSON.stringify(deepDive, null, 2) : "No Deep Dive submission"}

## Interview Transcripts
${transcripts || "No transcripts available"}

## Artifact Evidence (Notes, Links, Files)
${artifactEvidence.artifactContext || "No artifacts"}

## Image Artifacts To Inspect
${artifactEvidence.imageLabels.length > 0 ? artifactEvidence.imageLabels.map((label, index) => `${index + 1}. ${label}`).join("\n") : "No image artifacts"}

## Internal Notes
${notes || "No notes"}

## Existing AI Analysis
${existingAnalysis ? JSON.stringify(existingAnalysis, null, 2) : "No analysis run yet"}

## Discovery Answers
${JSON.stringify(discoveryAnswers, null, 2)}

## Tech Stack Notes
${JSON.stringify(techStack, null, 2)}

---

Perform a comprehensive scope refinement analysis. Find every evidence-backed gap, ambiguity, and undefined process in the data above. Be thorough — think like an engineer who needs to build this system and identify every question they'd need answered before writing code. Group questions by category/workflow area and anchor them to the evidence provided.`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: userPrompt },
              ...artifactEvidence.imageInputs,
            ],
          },
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

    await sb.from("refinement_questions").delete().eq("assessment_id", assessmentId);

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
      reviewed_sources: {
        transcripts: interviews.filter((i: any) => i.transcript).length,
        notes: (notesRes.data || []).length,
        deep_dive: Boolean(deepDive),
        artifacts: artifactEvidence.summary,
      },
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
