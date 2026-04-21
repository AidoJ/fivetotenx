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

    const { data: assessment, error: assessErr } = await supabase
      .from('roi_assessments')
      .select('*')
      .eq('id', assessmentId)
      .single();
    if (assessErr || !assessment) throw new Error('Assessment not found');

    // Locate the proposal we're targeting.
    let proposal: any;
    if (proposalId) {
      const { data } = await supabase.from('proposals').select('*').eq('id', proposalId).single();
      proposal = data;
    } else {
      const { data } = await supabase
        .from('proposals')
        .select('*')
        .eq('assessment_id', assessmentId)
        .order('revision', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      proposal = data;
    }
    if (!proposal) throw new Error('Proposal not found. Please prepare the proposal first.');

    // Revision logic: if the targeted proposal has already been delivered,
    // clone it into a new revision so the previously-sent version stays intact.
    if (proposal.delivered_at) {
      const newRevision = (proposal.revision || 1) + 1;
      const { data: newRow, error: cloneErr } = await supabase
        .from('proposals')
        .insert({
          assessment_id: assessmentId,
          proposal_data: proposal.proposal_data,
          client_selection: {},
          revision: newRevision,
          accepted: false,
          accepted_at: null,
          superseded_by: null,
        })
        .select()
        .single();
      if (cloneErr || !newRow) throw new Error(`Failed to create new revision: ${cloneErr?.message}`);

      // Mark the previous revision as superseded by the new one.
      await supabase
        .from('proposals')
        .update({ superseded_by: newRow.id })
        .eq('id', proposal.id);

      proposal = newRow;
    }

    // Generate a fresh client access token for this proposal.
    const { data: tokenRow, error: tokenErr } = await supabase
      .from('proposal_tokens')
      .insert({ proposal_id: proposal.id })
      .select('token')
      .single();
    if (tokenErr || !tokenRow) throw new Error(`Failed to create proposal token: ${tokenErr?.message}`);
    const token = tokenRow.token;

    const revision = proposal.revision || 1;
    const isRevised = revision > 1;
    const businessName = assessment.business_name || 'your business';
    const contactName = assessment.contact_name || '';
    const firstName = (contactName || 'there').split(' ')[0] || 'there';

    const baseUrl = `https://5to10x.app/proposal/${proposal.id}?t=${token}`;
    const viewUrl = baseUrl;
    const acceptUrl = `${baseUrl}&action=accept`;

    const subject = isRevised
      ? `[Revised v${revision}] ${firstName}, your updated proposal for ${businessName}`
      : `${firstName}, your custom proposal for ${businessName} is ready`;

    const fromField = '5to10X <grow@5to10x.app>';

    const revisionBannerHtml = isRevised
      ? `<div style="margin:0 0 20px;padding:12px 16px;background:#fef3c7;border-left:4px solid #d97706;border-radius:6px;">
           <p style="margin:0;color:#92400e;font-size:13px;font-weight:600;">This is a revised proposal (v${revision}).</p>
           <p style="margin:4px 0 0;color:#92400e;font-size:12px;">It replaces any earlier version we sent. Click below to open the latest version.</p>
         </div>`
      : '';

    const emailHtml = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Georgia,'Times New Roman',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px;">
    <tr><td align="center">
      <table width="640" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(30,58,95,0.06);">
        <tr><td style="background:#1e3a5f;padding:36px 32px;text-align:center;">
          <p style="color:#93c5fd;font-size:12px;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px;">${isRevised ? `Revised Proposal — v${revision}` : 'Your Proposal Is Ready'}</p>
          <h1 style="color:#ffffff;font-size:24px;margin:0;font-weight:700;">Custom App Proposal for ${businessName}</h1>
        </td></tr>
        <tr><td style="padding:32px;">
          ${revisionBannerHtml}
          <p style="color:#334155;font-size:15px;line-height:1.8;margin:0 0 16px;">Hi ${firstName},</p>
          <p style="color:#334155;font-size:15px;line-height:1.8;margin:0 0 24px;">
            ${isRevised
              ? `Following our latest discussion, we have updated the proposal for <strong>${businessName}</strong>. It is ready for you to review.`
              : `Based on your Reality Check™ assessment and Straight Talk™ conversation, we have prepared a tailored Phase 1 proposal for <strong>${businessName}</strong>.`}
          </p>
          <p style="color:#334155;font-size:15px;line-height:1.8;margin:0 0 28px;">
            On the proposal page you can review the full scope, deselect any <strong>optional</strong> items to refine the build, and either request a revision or accept it directly. If you accept, you will be guided through our short Initial AI Consultancy Engagement Agreement and asked to sign electronically.
          </p>

          <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;">
            <tr>
              <td align="center">
                <a href="${viewUrl}" style="display:inline-block;padding:16px 36px;background:#1e3a5f;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:700;font-size:15px;margin:0 8px 12px;">View &amp; Customise Proposal</a>
                <a href="${acceptUrl}" style="display:inline-block;padding:16px 36px;background:#16a34a;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:700;font-size:15px;margin:0 8px 12px;">Accept This Proposal →</a>
              </td>
            </tr>
          </table>

          <p style="color:#94a3b8;font-size:11px;line-height:1.6;margin:24px 0 0;text-align:center;">
            This personalised link is valid for 14 days. If you have any questions, just reply to this email.
          </p>
        </td></tr>
        <tr><td style="padding:20px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
          <p style="color:#1e3a5f;font-size:14px;font-weight:700;margin:0 0 4px;">You're not buying tech. You're buying profit.</p>
          <p style="color:#94a3b8;font-size:12px;margin:0;">5to10X — Strategic App ROI Assessment</p>
        </td></tr>
      </table>
    </td></tr>
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

    // Mark the proposal as actually delivered now (separate from row created_at).
    const deliveredAt = new Date().toISOString();
    await supabase
      .from('proposals')
      .update({ delivered_at: deliveredAt, sent_at: deliveredAt })
      .eq('id', proposal.id);

    return new Response(JSON.stringify({
      success: true,
      proposalId: proposal.id,
      revision,
      isRevised,
      token,
      viewUrl,
    }), {
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
