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

    const { assessmentId, proposalId } = await req.json();
    if (!assessmentId) throw new Error('assessmentId is required');

    // Fetch assessment
    const { data: assessment, error: assessErr } = await supabase
      .from('roi_assessments')
      .select('*')
      .eq('id', assessmentId)
      .single();
    if (assessErr || !assessment) throw new Error('Assessment not found');

    // Find proposal - either by proposalId or by assessment
    let proposal;
    if (proposalId) {
      const { data } = await supabase.from('proposals').select('*').eq('id', proposalId).single();
      proposal = data;
    } else {
      const { data } = await supabase.from('proposals').select('*').eq('assessment_id', assessmentId).order('created_at', { ascending: false }).limit(1).single();
      proposal = data;
    }
    if (!proposal) throw new Error('Proposal not found. Please prepare the proposal first.');

    // Load email template from DB
    const { data: template } = await supabase
      .from('email_templates')
      .select('*')
      .eq('template_key', 'proposal-email')
      .single();

    const roi = assessment.roi_results || {};
    const proposalUrl = `https://5to10x.app/proposal/${proposal.id}`;
    const contactName = assessment.contact_name || '';
    const businessName = assessment.business_name || 'your business';
    const buildRange = roi.pricing
      ? `$${Math.round(roi.pricing.buildCostLow).toLocaleString()} – $${Math.round(roi.pricing.buildCostHigh).toLocaleString()}`
      : 'Custom';

    let emailHtml: string;
    let subject: string;
    let fromField: string;

    if (template) {
      const firstName = (contactName || '').split(' ')[0];
      emailHtml = template.html_body
        .replace(/\{\{contactName\}\}/g, firstName)
        .replace(/\{\{businessName\}\}/g, businessName)
        .replace(/\{\{proposalUrl\}\}/g, proposalUrl)
        .replace(/\{\{buildRange\}\}/g, buildRange);
      subject = template.subject
        .replace(/\{\{contactName\}\}/g, firstName)
        .replace(/\{\{businessName\}\}/g, businessName);
      fromField = `${template.from_name} <${template.from_email}>`;
    } else {
      const firstName = (contactName || '').split(' ')[0];
      subject = `${firstName}, your custom app proposal for ${businessName} is ready`;
      fromField = '5to10X <grow@5to10x.app>';
      emailHtml = `<!DOCTYPE html>
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
                Hi ${(contactName || '').split(' ')[0]},
              </p>
              <p style="color: #334155; font-size: 15px; line-height: 1.8; margin: 0 0 16px;">
                Based on your Reality Check™ assessment and Straight Talk™ conversation, we've prepared a tailored proposal for <strong>${businessName}</strong>.
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
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromField,
        to: [assessment.contact_email],
        subject,
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
