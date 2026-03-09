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
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY is not configured');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { assessmentId } = await req.json();
    if (!assessmentId) throw new Error('assessmentId is required');

    // Fetch assessment
    const { data: assessment, error: assessErr } = await supabase
      .from('roi_assessments')
      .select('*')
      .eq('id', assessmentId)
      .single();
    if (assessErr || !assessment) throw new Error('Assessment not found');

    // Fetch deep dive
    const { data: deepDive } = await supabase
      .from('deep_dive_submissions')
      .select('*')
      .eq('assessment_id', assessmentId)
      .single();

    const roi = assessment.roi_results || {};

    // Create proposal record
    const proposalData = {
      executiveSummary: '',
      scopeNotes: '',
      investmentNotes: '',
      timelinePhases: [
        { phase: 'Discovery & Planning', duration: '1–2 weeks', desc: 'Finalize scope, wireframes, and technical architecture' },
        { phase: 'Design & Prototyping', duration: '1–2 weeks', desc: 'UI/UX design, interactive prototypes, and feedback rounds' },
        { phase: 'Development', duration: '4–8 weeks', desc: 'Core feature build, integrations, and iterative testing' },
        { phase: 'Launch & Support', duration: '1–2 weeks', desc: 'Final QA, deployment, training, and handoff' },
      ],
      terms: [
        'This proposal is valid for 30 days from the date of issue.',
        'Payment terms: 50% upfront, 25% at midpoint, 25% at launch.',
        'All work includes 30 days of post-launch support and bug fixes.',
        'Client owns all custom code and assets produced during the project.',
        'Scope changes after acceptance may affect timeline and pricing.',
      ],
      customSections: [],
      deepDiveSummary: deepDive ? {
        painPoints: deepDive.pain_points,
        primaryGoals: deepDive.primary_goals,
        mustHaveFeatures: deepDive.must_have_features,
        timeline: deepDive.timeline,
        budgetComfort: deepDive.budget_comfort,
      } : null,
    };

    const { data: proposal, error: propErr } = await supabase
      .from('proposals')
      .insert({
        assessment_id: assessmentId,
        proposal_data: proposalData,
      })
      .select()
      .single();

    if (propErr) throw propErr;

    const proposalUrl = `https://5to10x.app/proposal/${proposal.id}`;
    const contactName = assessment.contact_name || '';
    const businessName = assessment.business_name || 'your business';
    const buildRange = roi.pricing
      ? `$${Math.round(roi.pricing.buildCostLow).toLocaleString()} – $${Math.round(roi.pricing.buildCostHigh).toLocaleString()}`
      : 'TBD';

    const emailHtml = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; background: #f8fafc; font-family: Georgia, 'Times New Roman', serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background: #f8fafc; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(30,58,95,0.06);">
          <tr>
            <td style="background: linear-gradient(135deg, #1e3a5f, #4338ca); padding: 36px 32px; text-align: center;">
              <p style="color: #93c5fd; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 8px;">Your Proposal Is Ready</p>
              <h1 style="color: #ffffff; font-size: 24px; margin: 0; font-weight: 700;">Custom App Proposal for ${businessName}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              <p style="color: #334155; font-size: 15px; line-height: 1.8; margin: 0 0 16px;">
                Hi ${contactName},
              </p>
              <p style="color: #334155; font-size: 15px; line-height: 1.8; margin: 0 0 16px;">
                Based on your ROI assessment and Deep Dive responses, we've prepared a tailored proposal for <strong>${businessName}</strong>.
              </p>
              ${roi.pricing ? `
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 24px;">
                <tr>
                  <td style="padding: 16px; background: #f0f9ff; border-radius: 8px; text-align: center;">
                    <p style="color: #64748b; font-size: 12px; margin: 0 0 4px;">Estimated Investment</p>
                    <p style="color: #1e3a5f; font-size: 20px; font-weight: 700; margin: 0;">${buildRange}</p>
                  </td>
                </tr>
              </table>` : ''}
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${proposalUrl}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #1e3a5f, #4338ca); color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 16px;">
                      View Your Proposal →
                    </a>
                  </td>
                </tr>
              </table>
              <p style="color: #64748b; font-size: 12px; margin: 24px 0 0; text-align: center;">
                You can also print or save the proposal as a PDF from the proposal page.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 32px; background: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="color: #1e3a5f; font-size: 14px; font-weight: 700; margin: 0 0 4px;">You're not buying tech. You're buying profit.</p>
              <p style="color: #94a3b8; font-size: 12px; margin: 0;">5to10X — Strategic App ROI Assessment</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: '5to10X <grow@5to10x.app>',
        to: [assessment.contact_email],
        subject: `${contactName}, your custom app proposal for ${businessName} is ready`,
        html: emailHtml,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Resend error: ${errBody}`);
    }

    return new Response(JSON.stringify({ success: true, proposalId: proposal.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
