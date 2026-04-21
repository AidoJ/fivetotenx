import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Brand colours (match landing page pipeline)
const PURPLE = '#6d3ce8';      // Accept Proposal — vibrant violet (matches pipeline)
const PURPLE_DARK = '#5a2dd1';
const AMBER = '#f59e0b';       // Edit Proposal — warm orange
const NAVY = '#1e3a5f';
const TEXT = '#334155';
const MUTED = '#64748b';
const BORDER = '#e2e8f0';
const BG_SOFT = '#f8fafc';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(n || 0);

const escapeHtml = (s: string) =>
  String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const truncate = (s: string, n = 280) => {
  const t = (s || '').trim();
  if (t.length <= n) return t;
  return t.slice(0, n - 1).trimEnd() + '…';
};

const impactBadge = (cat: string) => {
  const c = (cat || '').toLowerCase();
  const isBig = c.includes('big');
  const bg = isBig ? '#fee2e2' : '#fef3c7';
  const fg = isBig ? '#991b1b' : '#92400e';
  const label = isBig ? '🔥 Big Hit' : '⚡ Quick Win';
  return `<span style="display:inline-block;padding:3px 9px;background:${bg};color:${fg};border-radius:999px;font-size:11px;font-weight:700;margin-right:6px;">${label}</span>`;
};

const difficultyBadge = (d: string) => {
  const v = (d || '').toLowerCase();
  const label = v === 'easy' ? 'Easy' : v === 'hard' ? 'Hard' : 'Medium';
  return `<span style="display:inline-block;padding:3px 9px;background:#f1f5f9;color:#475569;border-radius:999px;font-size:11px;font-weight:600;margin-right:6px;">${label}</span>`;
};

const impactValueBadge = (annual: number) => {
  if (!annual || annual <= 0) return '';
  return `<span style="display:inline-block;padding:3px 9px;background:#dcfce7;color:#166534;border-radius:999px;font-size:11px;font-weight:700;">${fmt(annual)}/yr impact</span>`;
};

// Build a stable identity for an item so we can diff revisions
const itemKey = (it: any) => `${(it?.title || '').trim().toLowerCase()}`;

const renderItemCard = (item: any, opts: { removed?: boolean } = {}) => {
  const removed = !!opts.removed;
  const titleStyle = removed
    ? `color:#94a3b8;text-decoration:line-through;`
    : `color:${NAVY};`;
  const borderColor = removed ? '#e2e8f0' : '#cbd5e1';
  const bg = removed ? '#f8fafc' : '#ffffff';
  const opacity = removed ? '0.65' : '1';

  const removedTag = removed
    ? `<span style="display:inline-block;padding:3px 10px;background:#f1f5f9;color:#64748b;border-radius:999px;font-size:11px;font-weight:700;border:1px solid #cbd5e1;">Removed by client</span>`
    : `<span style="display:inline-block;padding:3px 10px;background:#ede9fe;color:${PURPLE};border-radius:999px;font-size:11px;font-weight:700;">Included</span>`;

  return `
  <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 12px;border:1px solid ${borderColor};border-radius:12px;background:${bg};opacity:${opacity};">
    <tr><td style="padding:16px 18px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="vertical-align:top;">
            <div style="font-size:15px;font-weight:700;${titleStyle}line-height:1.35;margin:0 0 8px;">${escapeHtml(item.title || 'Untitled item')}</div>
          </td>
          <td style="vertical-align:top;text-align:right;white-space:nowrap;padding-left:12px;">
            ${removedTag}
          </td>
        </tr>
        <tr><td colspan="2" style="padding:0;">
          <p style="margin:0 0 12px;color:${removed ? '#94a3b8' : TEXT};font-size:13px;line-height:1.6;">
            ${escapeHtml(truncate(item.explanation || item.recommendation || '', 280))}
          </p>
        </td></tr>
        <tr><td colspan="2" style="padding:8px 0 0;border-top:1px solid #f1f5f9;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="font-size:12px;color:${MUTED};">
                <strong style="color:${removed ? '#94a3b8' : NAVY};">${fmt(Number(item.cost) || 0)}</strong>
                <span style="margin:0 8px;color:#cbd5e1;">·</span>
                ${item.weeks || 0} ${item.weeks === 1 ? 'week' : 'weeks'}
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
    </td></tr>
  </table>`;
};

const renderKeyFindings = (analysis: any): string => {
  if (!analysis) return '';
  const bigHits = Array.isArray(analysis.big_hits) ? analysis.big_hits.slice(0, 3) : [];
  if (bigHits.length === 0 && !analysis.summary) return '';

  const bullets = bigHits
    .map((h: any) => `
      <li style="margin:0 0 10px;color:${TEXT};font-size:14px;line-height:1.6;">
        <strong style="color:${NAVY};">${escapeHtml(h.title || '')}</strong> —
        ${escapeHtml(truncate(h.explanation || h.recommendation || '', 180))}
      </li>`)
    .join('');

  return `
  <div style="margin:0 0 24px;padding:18px 20px;background:${BG_SOFT};border-left:4px solid ${PURPLE};border-radius:6px;">
    <p style="margin:0 0 12px;font-size:13px;font-weight:800;color:${NAVY};text-transform:uppercase;letter-spacing:1.2px;">Key Findings</p>
    ${analysis.summary ? `<p style="margin:0 0 12px;color:${TEXT};font-size:14px;line-height:1.65;">${escapeHtml(truncate(analysis.summary, 360))}</p>` : ''}
    ${bullets ? `<ul style="margin:0;padding-left:20px;">${bullets}</ul>` : ''}
  </div>`;
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

    const { assessmentId, proposalId, previewOnly, cc } = await req.json();
    if (!assessmentId) throw new Error('assessmentId is required');
    const ccList: string[] = Array.isArray(cc)
      ? cc.filter((e: any) => typeof e === 'string' && e.includes('@'))
      : [];

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

    // Capture the previous revision (if any) BEFORE we possibly clone — used for diff.
    let previousProposal: any = null;
    if ((proposal.revision || 1) > 1 || proposal.delivered_at) {
      const { data: prev } = await supabase
        .from('proposals')
        .select('proposal_data, revision')
        .eq('assessment_id', assessmentId)
        .lt('revision', proposal.revision || 1)
        .order('revision', { ascending: false })
        .limit(1)
        .maybeSingle();
      previousProposal = prev;
    }

    // Revision logic: if the targeted proposal has already been delivered,
    // clone it into a new revision so the previously-sent version stays intact.
    if (proposal.delivered_at && !previewOnly) {
      // For the diff, the "previous" is the one we're about to clone from.
      previousProposal = { proposal_data: proposal.proposal_data, revision: proposal.revision || 1 };

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

      await supabase
        .from('proposals')
        .update({ superseded_by: newRow.id })
        .eq('id', proposal.id);

      proposal = newRow;
    }

    // Generate a fresh client access token for sent emails only.
    const token = previewOnly
      ? 'preview'
      : await (async () => {
          const { data: tokenRow, error: tokenErr } = await supabase
            .from('proposal_tokens')
            .insert({ proposal_id: proposal.id })
            .select('token')
            .single();
          if (tokenErr || !tokenRow) throw new Error(`Failed to create proposal token: ${tokenErr?.message}`);
          return tokenRow.token;
        })();

    const revision = proposal.revision || 1;
    const isRevised = revision > 1;
    const businessName = assessment.business_name || 'your business';
    const contactName = assessment.contact_name || '';
    const firstName = (contactName || 'there').split(' ')[0] || 'there';

    const fallbackOrigin = 'https://5to10x.app';
    const originHeader = req.headers.get('origin');
    const refererHeader = req.headers.get('referer');
    // Always use the canonical production domain in client-facing emails.
    // Origin/Referer will be the admin's lovable preview URL when sent from
    // the admin app, which would send clients to the wrong site.
    const appOrigin = 'https://5to10x.app';

    const baseUrl = previewOnly
      ? `${appOrigin}/proposal/${proposal.id}?preview=1`
      : `${appOrigin}/proposal/${proposal.id}?t=${token}`;
    const viewUrl = baseUrl;

    const subject = isRevised
      ? `[Revised v${revision}] ${firstName}, your updated proposal for ${businessName}`
      : `${firstName}, your custom proposal for ${businessName} is ready`;

    const fromField = '5to10X <grow@5to10x.app>';

    // ── Build proposal content
    const proposalData: any = proposal.proposal_data || {};
    const items: any[] = Array.isArray(proposalData.items) ? proposalData.items : [];
    const totals: any = proposalData.totals || {};
    const feeStructure: any = proposalData.feeStructure || {};

    // Diff against previous revision to find items the client deselected
    const previousItems: any[] = Array.isArray(previousProposal?.proposal_data?.items)
      ? previousProposal.proposal_data.items
      : [];
    const currentKeys = new Set(items.map(itemKey));
    const removedItems = isRevised
      ? previousItems.filter((p) => !currentKeys.has(itemKey(p)))
      : [];

    // Pull opportunity analysis for the narrative + key findings
    const analysis = (assessment.discovery_answers as any)?._analysis || null;
    const topOpportunity = analysis?.big_hits?.[0]?.title || 'automating manual processes';

    // Personalised intro paragraph (graceful fallback if no analysis exists)
    const introNarrative = analysis?.summary
      ? `It was a pleasure speaking with you recently. Based on what you shared, we have prepared a tailored Phase 1 proposal for <strong>${escapeHtml(businessName)}</strong> focused on the highest-leverage opportunities we uncovered together.`
      : `Based on your Reality Check™ assessment and Straight Talk™ conversation, we have prepared a tailored Phase 1 proposal for <strong>${escapeHtml(businessName)}</strong>.`;

    const goalLine = `Our primary goal for this engagement is to <strong>drive measurable operational efficiency and reduce cost for ${escapeHtml(businessName)}</strong> by ${escapeHtml(String(topOpportunity).toLowerCase())} and tightening data accuracy across your day-to-day work.`;

    const revisionBannerHtml = isRevised
      ? `<div style="margin:0 0 24px;padding:14px 18px;background:#fef3c7;border-left:4px solid #d97706;border-radius:6px;">
           <p style="margin:0;color:#92400e;font-size:13px;font-weight:700;">This is a revised proposal (v${revision}).</p>
           <p style="margin:6px 0 0;color:#92400e;font-size:12px;line-height:1.5;">It replaces any earlier version we sent and reflects the changes you requested. Items you removed are shown greyed out below for your reference.</p>
         </div>`
      : '';

    const includedCount = items.length;
    const totalConsidered = includedCount + removedItems.length;

    const itemsHtml = items.map((it) => renderItemCard(it, { removed: false })).join('');
    const removedHtml = removedItems.map((it) => renderItemCard(it, { removed: true })).join('');

    // Totals & payment schedule
    const subtotal = Number(totals.subtotalExGst) || 0;
    const gst = Number(totals.gst) || 0;
    const totalIncGst = Number(totals.totalIncGst) || subtotal + gst;
    const totalWeeks = Number(totals.totalWeeks) || 0;

    const depositAmount = Number(feeStructure?.deposit?.amount) || Number(totals.deposit) || 0;
    const mvpAmount = Number(feeStructure?.mvp?.amount) || Number(totals.mvp) || 0;
    const finalAmount = Number(feeStructure?.final?.amount) || Number(totals.final) || 0;

    const totalsHtml = `
      <div style="margin:24px 0 0;padding:20px 22px;background:#f8fafc;border:1px solid ${BORDER};border-radius:12px;">
        <p style="margin:0 0 14px;font-size:13px;font-weight:800;color:${NAVY};text-transform:uppercase;letter-spacing:1.2px;">Investment Summary</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;color:${TEXT};">
          <tr><td style="padding:4px 0;">Subtotal (ex GST)</td><td align="right" style="padding:4px 0;">${fmt(subtotal)}</td></tr>
          <tr><td style="padding:4px 0;">GST (10%)</td><td align="right" style="padding:4px 0;">${fmt(gst)}</td></tr>
          <tr><td style="padding:10px 0 4px;border-top:1px solid ${BORDER};font-weight:800;color:${NAVY};font-size:16px;">Total inc GST</td>
              <td align="right" style="padding:10px 0 4px;border-top:1px solid ${BORDER};font-weight:800;color:${PURPLE};font-size:18px;">${fmt(totalIncGst)}</td></tr>
          ${totalWeeks ? `<tr><td colspan="2" style="padding:6px 0 0;font-size:12px;color:${MUTED};">Estimated build time: <strong>${totalWeeks} ${totalWeeks === 1 ? 'week' : 'weeks'}</strong></td></tr>` : ''}
        </table>

        <div style="margin:18px 0 0;padding:14px 16px;background:#ffffff;border:1px solid ${BORDER};border-radius:10px;">
          <p style="margin:0 0 10px;font-size:12px;font-weight:800;color:${NAVY};text-transform:uppercase;letter-spacing:1px;">Payment Schedule</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;color:${TEXT};">
            <tr>
              <td style="padding:5px 0;">
                <strong style="color:${NAVY};">Commitment Deposit</strong><br>
                <span style="font-size:11px;color:${MUTED};">${escapeHtml(feeStructure?.deposit?.label || 'On Commencement')} · ${feeStructure?.deposit?.percent || 10}%</span>
              </td>
              <td align="right" style="padding:5px 0;font-weight:700;color:${NAVY};">${fmt(depositAmount)}</td>
            </tr>
            <tr>
              <td style="padding:5px 0;">
                <strong style="color:${NAVY};">MVP Payment</strong><br>
                <span style="font-size:11px;color:${MUTED};">${escapeHtml(feeStructure?.mvp?.label || 'On MVP Achieved & Reviewed')} · ${feeStructure?.mvp?.percent || 50}%</span>
              </td>
              <td align="right" style="padding:5px 0;font-weight:700;color:${NAVY};">${fmt(mvpAmount)}</td>
            </tr>
            <tr>
              <td style="padding:5px 0;">
                <strong style="color:${NAVY};">Final Balance</strong><br>
                <span style="font-size:11px;color:${MUTED};">${escapeHtml(feeStructure?.final?.label || 'On Handover of Final Build')} · ${feeStructure?.final?.percent || 40}%</span>
              </td>
              <td align="right" style="padding:5px 0;font-weight:700;color:${NAVY};">${fmt(finalAmount)}</td>
            </tr>
          </table>
        </div>
      </div>`;

    const ctaHtml = `
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0 8px;">
        <tr>
          <td align="center" style="padding:0 8px 12px;">
            <!--[if mso]>
            <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${viewUrl}" style="height:54px;v-text-anchor:middle;width:280px;" arcsize="20%" stroke="f" fillcolor="${PURPLE}">
              <w:anchorlock/>
              <center style="color:#ffffff;font-family:Georgia,serif;font-size:16px;font-weight:bold;">View Proposal</center>
            </v:roundrect>
            <![endif]-->
            <!--[if !mso]><!-- -->
            <a href="${viewUrl}" style="display:inline-block;padding:16px 44px;background:${PURPLE};color:#ffffff;text-decoration:none;border-radius:10px;font-weight:800;font-size:16px;border:1px solid ${PURPLE_DARK};">View Proposal</a>
            <!--<![endif]-->
          </td>
        </tr>
      </table>
      <p style="text-align:center;margin:6px 0 0;color:${MUTED};font-size:12px;line-height:1.6;">
        Open the proposal to review the scope, then choose <strong>Edit Scope</strong> to adjust items or <strong>Accept &amp; Sign</strong> to approve.
      </p>`;

    const emailHtml = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${BG_SOFT};font-family:Georgia,'Times New Roman',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${BG_SOFT};padding:40px 16px;">
    <tr><td align="center">
      <table width="680" cellpadding="0" cellspacing="0" style="max-width:680px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(30,58,95,0.08);">
        <tr><td style="background:${NAVY};padding:36px 32px;text-align:center;">
          <p style="color:#93c5fd;font-size:12px;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px;">${isRevised ? `Revised Proposal — v${revision}` : 'Your Proposal Is Ready'}</p>
          <h1 style="color:#ffffff;font-size:24px;margin:0;font-weight:700;line-height:1.3;">Custom App Proposal for ${escapeHtml(businessName)}</h1>
        </td></tr>

        <tr><td style="padding:32px 32px 8px;">
          ${revisionBannerHtml}

          <p style="color:${TEXT};font-size:15px;line-height:1.8;margin:0 0 16px;">Hi ${escapeHtml(firstName)},</p>
          <p style="color:${TEXT};font-size:15px;line-height:1.8;margin:0 0 16px;">${introNarrative}</p>
          <p style="color:${TEXT};font-size:15px;line-height:1.8;margin:0 0 20px;">${goalLine}</p>

          ${renderKeyFindings(analysis)}

          <p style="color:${TEXT};font-size:15px;line-height:1.8;margin:0 0 4px;">
            We have taken these insights and prepared the Phase 1 build scope below for you to review, adjust, and approve.
          </p>
        </td></tr>

        <tr><td style="padding:8px 32px 0;">
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0 14px;">
            <tr>
              <td style="font-size:18px;font-weight:800;color:${NAVY};">
                ✨ Phase 1 — Build Scope
              </td>
              <td align="right">
                <span style="display:inline-block;padding:5px 12px;background:#ede9fe;color:${PURPLE};border-radius:999px;font-size:12px;font-weight:700;">
                  ${includedCount} ${includedCount === 1 ? 'item' : 'items'} included${isRevised && totalConsidered > includedCount ? ` of ${totalConsidered}` : ''}
                </span>
              </td>
            </tr>
          </table>

          ${itemsHtml || `<p style="color:${MUTED};font-size:13px;font-style:italic;margin:0 0 12px;">No build items in this proposal.</p>`}

          ${removedItems.length > 0 ? `
            <p style="margin:24px 0 10px;font-size:12px;font-weight:700;color:${MUTED};text-transform:uppercase;letter-spacing:1.2px;">
              Removed in this revision (${removedItems.length})
            </p>
            ${removedHtml}
          ` : ''}

          ${totalsHtml}

          ${ctaHtml}

          <p style="color:${MUTED};font-size:11px;line-height:1.6;margin:24px 0 0;text-align:center;">
            This personalised link is valid for 14 days. If you have any questions, just reply to this email.
          </p>
        </td></tr>

        <tr><td style="padding:24px 32px 28px;">
          <p style="margin:0;color:${TEXT};font-size:14px;line-height:1.7;">
            Aidan Leonard<br>
            <span style="color:${MUTED};font-size:13px;">Co-Founder &amp; Business Analyst</span><br>
            <span style="color:${MUTED};font-size:13px;">5to10X</span>
          </p>
        </td></tr>

        <tr><td style="padding:20px 32px;background:${BG_SOFT};border-top:1px solid ${BORDER};text-align:center;">
          <p style="color:${NAVY};font-size:14px;font-weight:700;margin:0 0 4px;">You're not buying tech. You're buying profit.</p>
          <p style="color:${MUTED};font-size:12px;margin:0;">5to10X — Strategic App ROI Assessment</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    if (previewOnly) {
      return new Response(JSON.stringify({
        success: true,
        proposalId: proposal.id,
        revision,
        isRevised,
        viewUrl,
        itemsIncluded: includedCount,
        itemsRemoved: removedItems.length,
        email: {
          subject,
          body: emailHtml,
        },
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
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
        ...(ccList.length > 0 ? { cc: ccList } : {}),
        subject,
        html: emailHtml,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Resend error: ${errBody}`);
    }

    const resendData = await res.json();
    if (!resendData?.id) {
      throw new Error('Mail provider did not return a delivery id');
    }

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
      providerId: resendData.id,
      token,
      viewUrl,
      itemsIncluded: includedCount,
      itemsRemoved: removedItems.length,
      email: {
        subject,
        body: emailHtml,
      },
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
