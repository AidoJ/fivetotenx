// Generates the Julia-pixel proposal narrative blocks from all available
// client signal: Straight Talk transcripts, Q&A, ROI, opportunity analysis,
// internal notes and the current build scope. Returns a JSON object the
// admin Proposal Builder can drop straight into the editor.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const fmt = (n: unknown) => {
  const v = typeof n === "number" ? n : Number(n || 0);
  return `$${Math.round(Number.isFinite(v) ? v : 0).toLocaleString("en-AU")}`;
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { assessmentId } = await req.json();
    if (!assessmentId) throw new Error("assessmentId required");

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: assessment, error: aErr } = await sb
      .from("roi_assessments")
      .select("*")
      .eq("id", assessmentId)
      .single();
    if (aErr || !assessment) throw new Error("Assessment not found");

    const [stRes, interviewRes, notesRes, proposalRes] = await Promise.all([
      sb.from("straight_talk_responses").select("*").eq("assessment_id", assessmentId).order("created_at", { ascending: false }).limit(1),
      sb.from("client_interviews").select("transcript, title").eq("assessment_id", assessmentId).not("transcript", "is", null),
      sb.from("lead_notes").select("*").eq("assessment_id", assessmentId),
      sb.from("proposals").select("revision, proposal_data").eq("assessment_id", assessmentId).is("superseded_by", null).order("revision", { ascending: false }).limit(1),
    ]);

    const transcripts = (interviewRes.data || []).map((i: any) => `--- ${i.title} ---\n${i.transcript}`).join("\n\n");
    const stResponses = stRes.data?.[0]?.responses || {};
    const formData = (assessment.form_data as any) || {};
    const roiResults = (assessment.roi_results as any) || {};
    const analysis = (assessment.discovery_answers as any)?._analysis || {};
    const notesText = (notesRes.data || []).map((n: any) => `[${n.note_type}] ${n.content}`).join("\n");

    const latestProposal = proposalRes.data?.[0];
    const scopeItems: any[] = Array.isArray((latestProposal?.proposal_data as any)?.items)
      ? (latestProposal!.proposal_data as any).items
      : [];

    const scopeContext = scopeItems.length > 0
      ? scopeItems.map((it: any, idx: number) =>
          `${idx + 1}. ${it.title} — ${it.recommendation || it.explanation || ''} (cost ${fmt(it.cost)}, ~${it.weeks || '?'}w, ${fmt(it.estimated_annual_impact)}/yr impact)`
        ).join('\n')
      : 'No scope locked yet.';

    const businessName = assessment.business_name || formData.businessName || 'this business';
    const contactName = assessment.contact_name || 'there';
    const annual = roiResults.totalAnnualImpact || analysis.total_potential_impact || 0;

    const clientContext = `CLIENT PROFILE
- Business: ${businessName}
- Contact: ${contactName}
- Industry: ${assessment.industry || formData.industry || 'Unknown'}
- Monthly Revenue: $${formData.monthlyRevenue || '?'}
- Weekly Admin Hours: ${formData.hoursAdmin || '?'} admin, ${formData.hoursBooking || '?'} booking, ${formData.hoursFollowUps || '?'} follow-ups, ${formData.hoursInvoicing || '?'} invoicing
- Projected Year-1 Impact: ${fmt(annual)}

OPPORTUNITY ANALYSIS SUMMARY
${analysis.summary || 'No analysis summary available.'}

TOP OPPORTUNITIES (analyst ranking)
${(analysis.big_hits || []).map((h: any, i: number) => `${i + 1}. ${h.title} — ${h.recommendation || h.explanation || ''} (${fmt(h.estimated_annual_impact)}/yr)`).join('\n') || 'None.'}

CURRENT AGREED BUILD SCOPE
${scopeContext}

STRAIGHT TALK Q&A (raw)
${Object.entries(stResponses).slice(0, 30).map(([k, v]) => `Q[${k}]: ${typeof v === 'string' ? v : JSON.stringify(v)}`).join('\n') || 'None.'}

INTERVIEW TRANSCRIPTS (client's own words — PRIMARY SOURCE)
${transcripts || 'No transcripts available.'}

INTERNAL ANALYST NOTES
${notesText || 'None.'}`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const userPrompt = `You are writing the editable narrative blocks for a 5to10X "Julia-pixel" proposal — a calm, confident, plain-English document that mirrors the client's own language back to them.

${clientContext}

Produce the narrative as JSON via the supplied tool. Rules:

- proposal_title: Short, e.g. "${(scopeItems[0]?.title || 'Phase 1 Build')} for ${businessName}". No marketing fluff.
- what_we_heard: 3-5 sentence opening that reflects the client's own words from the transcript and Q&A. Quote them where natural. Acknowledge the pain, the destination, and the size of the prize (${fmt(annual)}/yr).
- highlight_box.headline: 5-9 words naming the headline outcome of Phase 1.
- highlight_box.body: 2 sentences explaining why this outcome matters in their world.
- what_this_means: 3 short blocks. Each has a heading (3-6 words) and a 1-2 sentence body. Cover: (a) the quantified value (use ${fmt(annual)}), (b) the next-most-important opportunity from the scope, (c) what stays the same — human oversight, compliance, sign-offs.
- what_we_need_from_you: 3-5 specific, concrete items (access, sample data, a nominated reviewer, time for one discovery session). No vague asks.
- oversight_note: 2-3 sentence reassurance that humans stay in the loop — drafts not auto-sends, parallel run before cut-over, exception handling stays manual until validated. Address compliance/PII if the industry implies it.
- closing_paragraph: 1-2 sentences inviting questions and stating we can begin discovery within a week of sign-off.

Tone: confident, specific, never salesy. Australian English. No em-dashes used as decoration. Never invent numbers — use the figures provided.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a senior business writer for 5to10X. You produce calm, specific, plain-English proposal narrative that mirrors the client's own language. You never invent numbers, scope items, or commitments." },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "report_narrative",
            description: "Return the editable narrative blocks for the Julia-pixel proposal.",
            parameters: {
              type: "object",
              properties: {
                proposal_title: { type: "string" },
                what_we_heard: { type: "string" },
                highlight_box: {
                  type: "object",
                  properties: {
                    headline: { type: "string" },
                    body: { type: "string" },
                  },
                  required: ["headline", "body"],
                },
                what_this_means: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      heading: { type: "string" },
                      body: { type: "string" },
                    },
                    required: ["heading", "body"],
                  },
                },
                what_we_need_from_you: {
                  type: "array",
                  items: { type: "string" },
                },
                oversight_note: { type: "string" },
                closing_paragraph: { type: "string" },
              },
              required: ["proposal_title", "what_we_heard", "highlight_box", "what_this_means", "what_we_need_from_you", "oversight_note", "closing_paragraph"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "report_narrative" } },
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("AI gateway error:", aiRes.status, errText);
      if (aiRes.status === 429) throw new Error("Rate limited – please try again in a moment.");
      if (aiRes.status === 402) throw new Error("AI credits exhausted – please top up in Settings.");
      throw new Error(`Narrative generation failed (${aiRes.status})`);
    }

    const aiData = await aiRes.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) throw new Error("No narrative returned from AI");

    const narrative = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ success: true, narrative }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("generate-proposal-narrative error:", err);
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
