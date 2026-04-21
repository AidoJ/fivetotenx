import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const formatCurrency = (value: unknown) => {
  const amount = typeof value === "number" ? value : Number(value || 0);
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  return `$${Math.round(safeAmount).toLocaleString("en-AU")}`;
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { assessmentId, mode, customPrompt, templateKey } = await req.json();
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

    // Fetch all supplementary data in parallel
    const [stRes, interviewRes, artifactRes, notesRes, proposalRes] = await Promise.all([
      sb.from("straight_talk_responses").select("*").eq("assessment_id", assessmentId).order("created_at", { ascending: false }).limit(1),
      sb.from("client_interviews").select("transcript, title").eq("assessment_id", assessmentId).not("transcript", "is", null),
      sb.from("client_artifacts").select("*").eq("assessment_id", assessmentId),
      sb.from("lead_notes").select("*").eq("assessment_id", assessmentId),
      sb.from("proposals").select("id, revision, created_at, delivered_at, proposal_data").eq("assessment_id", assessmentId).order("revision", { ascending: false }).order("created_at", { ascending: false }).limit(1),
    ]);
    const stData = stRes.data;
    const interviews = interviewRes.data;
    const latestProposal = proposalRes.data?.[0] || null;

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

    // Build artifact context
    const truncate = (s: string, max = 4000) => s.length > max ? s.slice(0, max) + '…[truncated]' : s;
    const artifactChunks = (artifactRes.data || []).map((a: any) => {
      const title = a.title || a.file_name || 'Untitled';
      if (a.artifact_type === 'text') return `[Note] ${title}: ${truncate(a.content || '')}`;
      if (a.artifact_type === 'link') return `[Link] ${title}: ${a.content || ''}`;
      if (a.artifact_type === 'file') return `[File] ${title}: ${a.file_name || ''}${a.file_url ? ` (${a.file_url})` : ''}`;
      return null;
    }).filter(Boolean);

    // Build internal notes context
    const notesText = (notesRes.data || []).map((n: any) => `[${n.note_type}] ${n.content}`).join("\n");

    // ── Build shared client context block ──
    const clientContext = `CLIENT PROFILE:
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

${hasTranscripts ? `INTERVIEW TRANSCRIPTS (PRIMARY SOURCE — client's own words):
${transcriptTexts}` : "No transcripts available."}

CLIENT ARTIFACTS (uploaded notes, links, and files):
${artifactChunks.length > 0 ? artifactChunks.join("\n\n") : "No artifacts available."}

INTERNAL NOTES:
${notesText || "No internal notes."}`;

    // ── Fetch deep dive & scoping for extra context ──
    const [ddRes, scopeRes] = await Promise.all([
      sb.from("deep_dive_submissions").select("*").eq("assessment_id", assessmentId).limit(1),
      sb.from("scoping_responses").select("responses").eq("assessment_id", assessmentId).limit(1),
    ]);
    const deepDive = ddRes.data?.[0];
    const scopeData = scopeRes.data?.[0]?.responses;

    const existingToolsContext = [
      deepDive?.current_tools ? `Current tools/platforms: ${deepDive.current_tools}` : null,
      deepDive?.required_integrations?.length ? `Required integrations: ${deepDive.required_integrations.join(', ')}` : null,
      deepDive?.current_website ? `Current website: ${deepDive.current_website}` : null,
      deepDive?.must_have_features ? `Must-have features: ${deepDive.must_have_features}` : null,
      deepDive?.nice_to_have_features ? `Nice-to-have: ${deepDive.nice_to_have_features}` : null,
    ].filter(Boolean).join('\n');

    // Get existing tech stack if saved
    const existingTechStack = assessment.tech_stack as any || {};

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // ────────────────────────────────────────────────────
    // TECH STACK MODE
    // ────────────────────────────────────────────────────
    if (mode === "tech_stack") {
      const analysisData = (assessment.discovery_answers as any)?._analysis;

      const techPrompt = `You are a senior solutions architect and technology consultant for 5to10X, specialising in automation, compliance, and data security for ${assessment.industry || 'various'} industries.

${clientContext}

${existingToolsContext ? `\nEXISTING TOOLS & PLATFORMS THE CLIENT ALREADY USES:\n${existingToolsContext}` : ''}

${analysisData ? `\nOPPORTUNITY ANALYSIS (already completed):
Summary: ${analysisData.summary || 'N/A'}
Big 5 opportunities: ${(analysisData.big_hits || []).map((h: any) => `${h.title}: ${h.recommendation}`).join('; ')}
Quick wins: ${(analysisData.quick_wins || []).map((h: any) => `${h.title}: ${h.recommendation}`).join('; ')}` : ''}

${customPrompt ? `\nADDITIONAL CONTEXT FROM ADMIN:\n${customPrompt}` : ''}

INSTRUCTIONS:
Perform a THOROUGH technology analysis covering:

1. **EXISTING TOOLS AUDIT**: Review every tool/platform the client currently uses (e.g. Monday.com, RPData, RealWorks, ID4ME, CoreLogic, etc.). For each one:
   - Assess if it should be KEPT, REPLACED, or INTEGRATED WITH
   - Note API availability and integration complexity
   - Flag any vendor lock-in risks

2. **MARKET RESEARCH**: For each identified need/opportunity, research and recommend the BEST market tools available in the client's region (Australia/NZ focus where relevant). Consider:
   - Industry-specific SaaS platforms (PropTech, FinTech, LegalTech, etc.)
   - Automation platforms (Zapier, Make, n8n, etc.)
   - AI-powered tools for document processing, data extraction, etc.
   - CRM alternatives or enhancements
   - Compare at least 2-3 options per category with pros/cons

3. **COMPLIANCE & REGULATORY**:
   - AML (Anti-Money Laundering) requirements — what tools handle AML/KYC checks automatically?
   - Privacy legislation compliance (Australian Privacy Act, GDPR if applicable)
   - Industry-specific regulations (e.g. real estate agent licensing, financial services)
   - Audit trail and record-keeping requirements
   - Electronic signature and identity verification compliance

4. **DATA SECURITY & PII PROTECTION**:
   - How to handle Personally Identifiable Information (PII) when using AI tools
   - Data residency requirements (Australian data sovereignty)
   - Encryption at rest and in transit recommendations
   - Secure document autofill from data repositories — architecture for AI-driven contract population without exposing PII to third-party AI
   - Role-based access control (RBAC) for sensitive data
   - Data Loss Prevention (DLP) strategy
   - Recommended secure vault / secrets management

5. **RECOMMENDED ARCHITECTURE**:
   - Frontend framework and why
   - Backend/API layer
   - Database with data classification tiers
   - Hosting (consider data residency)
   - Key integrations mapped to specific opportunities
   - AI/ML pipeline architecture — how to use AI for document processing while keeping PII secure (e.g. tokenisation, on-premise models, redaction before API calls)

6. **IMPLEMENTATION ROADMAP**:
   - Phase 1 quick wins (tools that can be deployed in weeks)
   - Phase 2 core platform build
   - Phase 3 advanced automation and AI
   - Migration strategy from existing tools`;

      const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: "You are a senior solutions architect specialising in business automation, compliance, and secure data architecture. Be extremely specific — name actual products, vendors, and pricing tiers. Consider the client's existing tools and regional market. Always address data security and PII protection." },
            { role: "user", content: techPrompt },
          ],
          tools: [{
            type: "function",
            function: {
              name: "recommend_tech_stack",
              description: "Provide a comprehensive tech stack recommendation with compliance, security, and market analysis",
              parameters: {
                type: "object",
                properties: {
                  existing_tools_audit: {
                    type: "array",
                    description: "Audit of each tool the client currently uses",
                    items: {
                      type: "object",
                      properties: {
                        tool_name: { type: "string" },
                        current_use: { type: "string" },
                        verdict: { type: "string", enum: ["keep", "replace", "integrate", "enhance"] },
                        reasoning: { type: "string" },
                        integration_notes: { type: "string" },
                      },
                      required: ["tool_name", "verdict", "reasoning"],
                    },
                  },
                  recommended_tools: {
                    type: "array",
                    description: "Market-researched tool recommendations for each need",
                    items: {
                      type: "object",
                      properties: {
                        category: { type: "string", description: "e.g. CRM, Document Automation, AML/KYC, etc." },
                        primary_recommendation: { type: "string" },
                        alternatives: { type: "string", description: "2-3 alternatives with brief comparison" },
                        estimated_cost: { type: "string" },
                        integration_complexity: { type: "string", enum: ["low", "medium", "high"] },
                      },
                      required: ["category", "primary_recommendation", "alternatives"],
                    },
                  },
                  compliance: {
                    type: "object",
                    properties: {
                      aml_strategy: { type: "string", description: "AML/KYC approach and recommended tools" },
                      privacy_requirements: { type: "string", description: "Privacy act compliance approach" },
                      industry_regulations: { type: "string", description: "Industry-specific regulatory needs" },
                      audit_trail: { type: "string", description: "Record-keeping and audit approach" },
                    },
                    required: ["aml_strategy", "privacy_requirements"],
                  },
                  data_security: {
                    type: "object",
                    properties: {
                      pii_handling: { type: "string", description: "Strategy for PII when using AI tools — tokenisation, redaction, on-prem models" },
                      data_residency: { type: "string", description: "Data sovereignty and hosting location" },
                      encryption: { type: "string", description: "Encryption strategy at rest and in transit" },
                      ai_document_pipeline: { type: "string", description: "How to securely auto-fill contracts from data repos using AI without PII exposure" },
                      rbac_strategy: { type: "string", description: "Role-based access control approach" },
                      dlp_strategy: { type: "string", description: "Data loss prevention approach" },
                    },
                    required: ["pii_handling", "data_residency", "ai_document_pipeline"],
                  },
                  architecture: {
                    type: "object",
                    properties: {
                      frontend: { type: "string" },
                      backend: { type: "string" },
                      database: { type: "string" },
                      hosting: { type: "string" },
                      integrations: { type: "string" },
                      ai_ml_pipeline: { type: "string", description: "AI/ML architecture for document processing with PII protection" },
                    },
                    required: ["frontend", "backend", "database", "hosting", "integrations"],
                  },
                  implementation_roadmap: {
                    type: "object",
                    properties: {
                      phase_1_quick_wins: { type: "string" },
                      phase_2_core_build: { type: "string" },
                      phase_3_advanced: { type: "string" },
                      migration_strategy: { type: "string" },
                    },
                    required: ["phase_1_quick_wins", "phase_2_core_build", "phase_3_advanced"],
                  },
                  reasoning: { type: "string", description: "Executive summary of the tech stack strategy" },
                },
                required: ["existing_tools_audit", "recommended_tools", "compliance", "data_security", "architecture", "implementation_roadmap", "reasoning"],
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "recommend_tech_stack" } },
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
      if (!toolCall?.function?.arguments) throw new Error("No tech stack recommendation returned");

      const techStack = JSON.parse(toolCall.function.arguments);
      techStack.generated_at = new Date().toISOString();

      // Save to assessment
      await sb.from("roi_assessments")
        .update({ tech_stack: techStack })
        .eq("id", assessmentId);

      return new Response(JSON.stringify({ success: true, techStack }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ────────────────────────────────────────────────────
    // EMAIL DRAFT MODE
    // ────────────────────────────────────────────────────
    if (mode === "email_draft") {
      const tplKey = templateKey || 'post_interview_thanks';
      const analysisData = (assessment.discovery_answers as any)?._analysis;
      const techStackData = assessment.tech_stack as any || {};

      const templatePrompts: Record<string, string> = {
        post_interview_thanks: `Write a professional but warm thank-you email from Aidan Leonard (Co-Founder & Business Analyst at 5to10X) to ${assessment.contact_name} after a discovery interview.

The email should:
1. Thank them for their time and openness in discussing their business
2. Reference 2-3 SPECIFIC points they raised in the interview (quote them if transcripts available)
3. List clear ACTION ITEMS / COMMITMENTS from both parties:
   - What WE (5to10X) committed to do next (e.g. "We will prepare a detailed analysis of…", "We will send through…")
   - What THEY committed to provide (e.g. "You mentioned you'd send across…", "You'll check with your team about…")
4. Set expectations for next steps and timeline
5. Keep the tone professional yet personable — like a colleague, not a sales pitch

Format as clean HTML email with proper paragraphs. Use a simple action items table or bullet list for commitments. Include a brief sign-off.`,

        key_findings_proposal: `Write a SHORT, narrative email from Aidan Leonard (Co-Founder & Business Analyst at 5to10X) to ${assessment.contact_name} that introduces their personalised proposal.

CRITICAL: Do NOT invent or list scope items, costs, timelines, or payment schedules. The proposal page already contains all of that — your job is to give a brief, warm narrative that points them to it.

The email should:
1. Open with a warm acknowledgement referencing 1-2 specific things they shared (from transcripts or discovery) — show we listened.
2. State the PRIMARY GOAL of this engagement in one sentence.
3. Mention 2-3 KEY FINDINGS in one short paragraph each — what we heard, why it matters. Do NOT include $ figures or weeks.
4. Explain in one sentence that we have prepared a tailored Phase 1 proposal for them to review and adjust.
5. End with a clear call-to-action: "Click the button below to review your proposal — you can deselect any optional items, request a revision, or accept it directly."
6. Note: the email's actual proposal link and Accept button are added automatically by the system — do NOT include any URLs, prices, or signature blocks yourself. Just write the body copy.

Format as clean HTML with <p>, <strong>, and <h3> only. Keep it under 250 words. Sign off as Aidan Leonard, Co-Founder & Business Analyst, 5to10X.`,

        project_kickoff: `Write a project kickoff email from Aidan Leonard (Co-Founder & Business Analyst at 5to10X) to ${assessment.contact_name} confirming the engagement is starting.

The email should:
1. Express excitement about working together
2. Confirm the agreed scope and primary objectives
3. Outline the project timeline with key milestones
4. Introduce the team (Aidan as Business Analyst leading strategy, Eoghan as Engineering Build Advisor leading the technical build)
5. List immediate next steps (what happens this week/next week)
6. Set communication expectations (how often updates, preferred channels)
7. Note any items needed from the client to get started

Format as clean HTML with a milestone timeline and clear action items.`,

        progress_update: `Write a progress update email from Aidan Leonard (Co-Founder & Business Analyst at 5to10X) to ${assessment.contact_name}.

The email should:
1. Summarise what has been delivered/completed since last update
2. Show progress against the overall plan (reference Phase 1 objectives)
3. Highlight any wins or positive outcomes already visible
4. Note what's coming next (next sprint/phase priorities)
5. Flag any blockers or decisions needed from the client
6. Keep it concise but substantive — the client should feel informed and confident

Format as clean HTML with a "Completed", "In Progress", and "Coming Next" structure.`,
      };

      const emailPrompt = templatePrompts[tplKey] || templatePrompts.post_interview_thanks;

      const fullPrompt = `${emailPrompt}

${clientContext}

${analysisData ? `\nOPPORTUNITY ANALYSIS:
Summary: ${analysisData.summary || 'N/A'}
Top opportunities: ${(analysisData.big_hits || []).map((h: any) => `• ${h.title}: ${h.explanation} → ${h.recommendation}`).join('\n')}` : ''}

${Object.keys(techStackData).length > 1 ? `\nTECH STACK ANALYSIS:
${techStackData.reasoning || 'N/A'}
Phase 1: ${techStackData.implementation_roadmap?.phase_1_quick_wins || 'N/A'}` : ''}`;

      const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: `You are a senior business consultant drafting client emails on behalf of Aidan Leonard, Co-Founder & Business Analyst at 5to10X. Write in a professional, warm, direct tone. Be specific — reference actual data, quotes, and findings. Never be generic.

CRITICAL HTML FORMATTING RULES — follow these EVERY time:
- Use proper HTML: <p>, <strong>, <ul>/<li>, <h3> for section headings.
- For action items, commitments, or any two-column comparison (e.g. "Our Commitments" vs "Your Commitments"), ALWAYS use an HTML <table> with inline styles:
  <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; margin: 16px 0;">
    <tr><th style="padding: 12px 16px; background: #f0f9ff; text-align: left; font-size: 14px; font-weight: 700; color: #1e3a5f; border-bottom: 1px solid #e2e8f0;">Column Header</th>...</tr>
    <tr><td style="padding: 10px 16px; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #334155;">Content</td>...</tr>
  </table>
- Never use markdown tables — always HTML tables with inline styles.
- Keep the same table structure across all drafts for consistency.
- Sign off as: Aidan Leonard, Co-Founder & Business Analyst, 5to10X.` },
            { role: "user", content: fullPrompt },
          ],
          tools: [{
            type: "function",
            function: {
              name: "draft_email",
              description: "Generate a client email draft",
              parameters: {
                type: "object",
                properties: {
                  subject: { type: "string", description: "Email subject line — concise, specific, professional" },
                  body: { type: "string", description: "Full email HTML body. Use clean HTML: <p>, <strong>, <ul>/<li>, <table> for action items. No inline styles on body — keep it simple and readable in any email client. Sign off as Aidan Leonard, Co-Founder & Business Analyst, 5to10X." },
                },
                required: ["subject", "body"],
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "draft_email" } },
        }),
      });

      if (!aiRes.ok) {
        const errText = await aiRes.text();
        console.error("AI gateway error:", aiRes.status, errText);
        throw new Error(`Email draft generation failed (${aiRes.status})`);
      }

      const aiData = await aiRes.json();
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall?.function?.arguments) throw new Error("No email draft returned");

      const email = JSON.parse(toolCall.function.arguments);

      return new Response(JSON.stringify({ success: true, email }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ────────────────────────────────────────────────────
    // OPPORTUNITY ANALYSIS MODE (default)
    // ────────────────────────────────────────────────────
    const prompt = `You are a business automation consultant for 5to10X. Analyze this client's data and identify the TOP 10 automation/efficiency opportunities.

${hasTranscripts ? `⚠️ PRIORITY DATA SOURCE — INTERVIEW TRANSCRIPTS:
The client's own words from recorded interviews are the MOST IMPORTANT data source. Their spoken priorities, frustrations, and goals should HEAVILY influence your analysis and ranking. Quote specific statements where relevant.` : ''}

${clientContext}

Based on ALL available data (prioritising the client's own spoken words from transcripts when available), identify the opportunities ranked by potential impact (time saved, revenue gained, cost reduced, risk mitigated).

For each opportunity provide:
- A clear title (max 8 words)
- Impact category: "time_savings", "revenue_growth", "cost_reduction", "risk_mitigation", or "customer_experience"
- Estimated annual impact in dollars (be specific based on their numbers)
- Implementation difficulty: "easy", "medium", "hard"  
- A 2-3 sentence explanation of the problem and how automation solves it. If the client mentioned this issue in their interview, quote their words.
- A specific recommendation of what to build/automate

When transcript data is available, the client's stated priorities and pain points should drive the ranking — not just the biggest dollar value. What the client cares about most should appear first.

Return the TOP 5 as "big_hits" and the NEXT 5 as "quick_wins".`;

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
    analysis.generated_at = new Date().toISOString();

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
