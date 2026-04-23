import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Julia-pixel palette — matches JuliaProposalView (client page) and the
// 5to10X email design system. Inline-only styles for email-client safety.
const NAVY = '#1e3a5f';
const NAVY_DEEP = '#1e40af';
const NAVY_LIGHT = '#93c5fd';
const NAVY_PALE = '#bfdbfe';
const PURPLE = '#6d3ce8';      // CTA button
const PURPLE_DARK = '#5a2dd1';
const AMBER = '#f59e0b';       // Highlight + oversight callout border
const AMBER_BG = '#fffbeb';
const AMBER_BORDER = '#fde68a';
const AMBER_TEXT = '#92400e';
const AMBER_TEXT_DEEP = '#78350f';
const TEXT = '#334155';
const TEXT_DARK = '#1e293b';
const MUTED = '#64748b';
const BORDER = '#e2e8f0';
const BG_SOFT = '#f8fafc';
const BG_BLUE = '#f0f9ff';

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

// Julia-pixel scope item: numbered circle + title + description + cost/weeks
const renderScopeItem = (item: any, idx: number, opts: { removed?: boolean } = {}) => {
  const removed = !!opts.removed;
  const titleColor = removed ? '#94a3b8' : TEXT_DARK;
  const titleDecoration = removed ? 'text-decoration:line-through;' : '';
  const bodyColor = removed ? '#94a3b8' : '#475569';
  const opacity = removed ? '0.65' : '1';
  const numBg = removed ? '#94a3b8' : NAVY;
  const removedTag = removed
    ? `<div style="margin-top:6px;display:inline-block;padding:3px 9px;background:#f1f5f9;color:#64748b;border-radius:999px;font-size:11px;font-weight:700;border:1px solid #cbd5e1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Removed by client</div>`
    : '';

  return `
  <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 12px;border:1px solid ${BORDER};border-radius:10px;background:#ffffff;opacity:${opacity};">
    <tr>
      <td valign="top" width="48" style="padding:18px 0 18px 18px;">
        <div style="width:30px;height:30px;border-radius:50%;background:${numBg};color:#ffffff;font-size:13px;font-weight:700;text-align:center;line-height:30px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">${idx + 1}</div>
      </td>
      <td valign="top" style="padding:18px 20px 18px 14px;">
        <div style="font-size:15px;font-weight:700;color:${titleColor};${titleDecoration}line-height:1.4;margin:0 0 4px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">${escapeHtml(item.title || 'Untitled item')}</div>
        <div style="margin:0;font-size:14px;color:${bodyColor};line-height:1.65;">
          ${(item.recommendation || item.explanation || '').split(/\n\n+/).filter((p: string) => p.trim()).map((p: string) => `<p style="margin:0 0 8px;">${escapeHtml(p.trim())}</p>`).join('')}
          ${item.estimated_annual_impact && !removed ? `<p style="margin:6px 0 0;color:${MUTED};">Estimated annual impact: <strong style="color:${TEXT_DARK};">${fmt(Number(item.estimated_annual_impact))}</strong>.</p>` : ''}
        </div>
        <div style="margin-top:8px;font-size:12px;color:${MUTED};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
          <strong style="color:${removed ? '#94a3b8' : NAVY};">${fmt(Number(item.cost) || 0)}</strong>
          ${item.weeks ? ` <span style="color:#cbd5e1;">·</span> ${item.weeks} ${item.weeks === 1 ? 'week' : 'weeks'}` : ''}
        </div>
        ${removedTag}
      </td>
    </tr>
  </table>`;
};

// "What This Means in Practice" block
const renderMeansBlock = (b: { heading?: string; body?: string }) => `
  <div style="margin:0 0 14px;">
    ${b.heading ? `<h3 style="margin:0 0 6px;font-size:16px;font-weight:700;color:${TEXT_DARK};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">${escapeHtml(b.heading)}</h3>` : ''}
    ${b.body ? `<p style="margin:0;color:${TEXT};font-size:14px;line-height:1.75;">${escapeHtml(b.body)}</p>` : ''}
  </div>`;

// Section heading (Julia-pixel: serif, navy, underline)
const sectionHeading = (label: string) => `
  <h2 style="font-size:20px;font-weight:700;color:${NAVY};margin:36px 0 14px;padding-bottom:8px;border-bottom:2px solid ${BORDER};font-family:Georgia,'Times New Roman',serif;">${escapeHtml(label)}</h2>`;

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

    const { assessmentId, proposalId, previewOnly, cc, draftToTeamOnly, draftRecipients, overrideSubject, overrideHtml } = await req.json();
    if (!assessmentId) throw new Error('assessmentId is required');
    const hasOverrideHtml = typeof overrideHtml === 'string' && overrideHtml.trim().length > 0;
    const hasOverrideSubject = typeof overrideSubject === 'string' && overrideSubject.trim().length > 0;
    const ccList: string[] = Array.isArray(cc)
      ? cc.filter((e: any) => typeof e === 'string' && e.includes('@'))
      : [];
    // When draftToTeamOnly is true, the email is sent to the internal team
    // (Aidan + Eoghan by default) for review BEFORE going to the client.
    // The proposal is NOT marked as delivered, no client token is created,
    // and no revision is cloned — it's a true preview send.
    const isInternalDraft = !!draftToTeamOnly;
    const internalRecipients: string[] = Array.isArray(draftRecipients) && draftRecipients.length > 0
      ? draftRecipients.filter((e: any) => typeof e === 'string' && e.includes('@'))
      : ['aidan@5to10x.app', 'eoghan@5to10x.app'];

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
    // Skip cloning for internal team drafts — they are reviews of the existing draft.
    if (proposal.delivered_at && !previewOnly && !isInternalDraft) {
      // For the diff, the "previous" is the one we're about to clone from.
      previousProposal = { proposal_data: proposal.proposal_data, revision: proposal.revision || 1 };

      const newRevision = (proposal.revision || 1) + 1;
      // Strip stale techStackRows from the cloned data so the proposal page
      // re-derives them from the freshly-regenerated assessment.tech_stack.
      const { techStackRows: _stale, ...clonedData } = (proposal.proposal_data || {}) as any;
      const { data: newRow, error: cloneErr } = await supabase
        .from('proposals')
        .insert({
          assessment_id: assessmentId,
          proposal_data: clonedData,
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
    // Internal team drafts use the preview URL — no client token issued.
    const token = (previewOnly || isInternalDraft)
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

    // (origin/referer headers are intentionally ignored — see appOrigin below)
    // Always use the canonical production domain in client-facing emails.
    // Origin/Referer will be the admin's lovable preview URL when sent from
    // the admin app, which would send clients to the wrong site.
    const appOrigin = 'https://5to10x.app';

    const baseUrl = (previewOnly || isInternalDraft)
      ? `${appOrigin}/proposal/${proposal.id}?preview=1`
      : `${appOrigin}/proposal/${proposal.id}?t=${token}`;
    const viewUrl = baseUrl;

    const baseSubject = isRevised
      ? `[Revised v${revision}] ${firstName}, your updated proposal for ${businessName}`
      : `${firstName}, your custom proposal for ${businessName} is ready`;
    const subject = isInternalDraft
      ? `[INTERNAL DRAFT — DO NOT FORWARD] ${baseSubject}`
      : baseSubject;

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

    // Pull opportunity analysis for the narrative + key findings (fallback only)
    const analysis = (assessment.discovery_answers as any)?._analysis || null;
    const annualImpact = Number((assessment.roi_results as any)?.totalAnnualImpact || analysis?.total_potential_impact || 0);

    // ── Julia-pixel narrative fields (all editable in admin) with safe fallbacks
    const proposalTitle = proposalData.proposal_title
      || (analysis?.big_hits?.[0]?.title ? `${analysis.big_hits[0].title} for ${businessName}` : `Phase 1 Proposal for ${businessName}`);

    const whatWeHeard = proposalData.what_we_heard
      || analysis?.summary
      || `Based on our Reality Check™ assessment and Straight Talk™ conversation, we have identified the highest-leverage opportunities for ${businessName}.`;

    const highlight = proposalData.highlight_box || {};
    const whatThisMeans: { heading?: string; body?: string }[] = Array.isArray(proposalData.what_this_means)
      ? proposalData.what_this_means.filter((b: any) => b && (b.heading || b.body))
      : [];
    const needs: string[] = Array.isArray(proposalData.what_we_need_from_you)
      ? proposalData.what_we_need_from_you.filter((s: any) => typeof s === 'string' && s.trim())
      : [];
    const outOfScope: string[] = Array.isArray(proposalData.out_of_scope)
      ? proposalData.out_of_scope.filter((s: any) => typeof s === 'string' && s.trim())
      : [];
    const savedPhases: { weeks?: string; title?: string; body?: string }[] = Array.isArray(proposalData.delivery_phases)
      ? proposalData.delivery_phases.filter((p: any) => p && (p.weeks || p.title || p.body))
      : [];
    const defaultPhases = [
      { weeks: 'Week 1', title: 'Discovery & Specification', body: 'Working session with you and the nominated reviewer to confirm the workflow we are automating, verify field mapping against live data, and finalise the compliance checklist. We produce a signed-off field specification before any build begins.' },
      { weeks: 'Weeks 2–3', title: 'Core Build', body: 'Automation layer configured and connected to the agreed inputs. Integration with your existing systems built and tested against real sample data from your environment.' },
      { weeks: 'Weeks 4–5', title: 'Validation & Review Interface', body: 'Validation rules implemented (missing fields flagged before review). Reviewer interface built and deployed — audit log live, notifications configured. End-to-end tested with real data.' },
      { weeks: 'Weeks 6–8', title: 'Parallel Run & Go-Live', body: 'The automated system runs alongside the existing manual process. You and the reviewer validate output accuracy on real cases. Edge cases are resolved as they appear. When you sign off, the system goes live and the manual workflow is retired.' },
    ];
    const phases = savedPhases.length > 0 ? savedPhases : defaultPhases;
    const oversight: string = proposalData.oversight_note || '';
    const closing: string = proposalData.closing_paragraph
      || `Any questions before you decide, just reply directly to this email. We can begin discovery within a week of sign-off.`;

    const internalDraftBannerHtml = isInternalDraft
      ? `<div style="margin:0 0 18px;padding:16px 20px;background:#fef2f2;border:2px solid #dc2626;border-radius:8px;">
           <p style="margin:0;color:#991b1b;font-size:14px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;">⚠️ Internal Review Copy — Do Not Forward</p>
           <p style="margin:8px 0 0;color:#7f1d1d;font-size:13px;line-height:1.6;">This is a preview of the proposal that will be sent to <strong>${escapeHtml(assessment.contact_email)}</strong> (${escapeHtml(contactName || 'client')}). Review the content, copy, totals, scope items, and delivery phases. The "Review &amp; Accept" button below points to the preview URL — clicking it will NOT trigger acceptance. To send to the client, use <strong>Send Email</strong> in the Comms tab.</p>
         </div>`
      : '';

    const revisionBannerHtml = isRevised
      ? `<div style="margin:0 0 24px;padding:14px 18px;background:${AMBER_BG};border-left:4px solid ${AMBER};border-radius:6px;">
           <p style="margin:0;color:${AMBER_TEXT};font-size:13px;font-weight:700;">This is a revised proposal (v${revision}).</p>
           <p style="margin:6px 0 0;color:${AMBER_TEXT};font-size:12px;line-height:1.5;">It replaces any earlier version we sent and reflects the changes you requested. Items you removed are shown greyed out below for your reference.</p>
         </div>`
      : '';

    const includedCount = items.length;
    const totalConsidered = includedCount + removedItems.length;

    const itemsHtml = items.map((it, i) => renderScopeItem(it, i, { removed: false })).join('');
    const removedHtml = removedItems.map((it, i) => renderScopeItem(it, i, { removed: true })).join('');

    // Totals & payment schedule
    const subtotal = Number(totals.subtotalExGst) || 0;
    const gst = Number(totals.gst) || 0;
    const totalIncGst = Number(totals.totalIncGst) || subtotal + gst;
    const totalWeeks = Number(totals.totalWeeks) || 0;

    const depositAmount = Number(feeStructure?.deposit?.amount) || Number(totals.deposit) || 0;
    const mvpAmount = Number(feeStructure?.mvp?.amount) || Number(totals.mvp) || 0;
    const finalAmount = Number(feeStructure?.final?.amount) || Number(totals.final) || 0;
    const depositLabel = feeStructure?.deposit?.label || 'Commitment Deposit';
    const mvpLabel = feeStructure?.mvp?.label || 'MVP Payment';
    const finalLabel = feeStructure?.final?.label || 'Final Balance';
    const depositWhen = feeStructure?.deposit?.when || 'On commencement — kicks off discovery session and build';
    const mvpWhen = feeStructure?.mvp?.when || 'On MVP working in test environment with real data';
    const finalWhen = feeStructure?.final?.when || 'On go-live — system in production, signed off, legacy workflow retired';

    const fmtShort = (n: number) => {
      if (!n) return '$0';
      if (n >= 1000) return `$${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
      return fmt(n);
    };

    const investmentTilesHtml = `
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:14px 0 8px;">
        <tr>
          <td width="33%" style="padding:0 6px 0 0;">
            <div style="background:${NAVY};border-radius:10px;padding:18px 14px;text-align:center;">
              <div style="font-size:11px;color:${NAVY_LIGHT};text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Total Build (ex GST)</div>
              <div style="font-size:22px;font-weight:800;color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">${fmtShort(subtotal)}</div>
            </div>
          </td>
          <td width="33%" style="padding:0 3px;">
            <div style="background:#ffffff;border:1px solid ${BORDER};border-radius:10px;padding:18px 14px;text-align:center;">
              <div style="font-size:11px;color:${MUTED};text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Timeline</div>
              <div style="font-size:22px;font-weight:800;color:${NAVY};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">${totalWeeks || 0} wks</div>
            </div>
          </td>
          <td width="33%" style="padding:0 0 0 6px;">
            <div style="background:#ffffff;border:1px solid ${BORDER};border-radius:10px;padding:18px 14px;text-align:center;">
              <div style="font-size:11px;color:${MUTED};text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Annual Impact</div>
              <div style="font-size:22px;font-weight:800;color:${NAVY};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">${fmtShort(annualImpact)}</div>
            </div>
          </td>
        </tr>
      </table>
      <p style="font-size:13px;color:${MUTED};margin:8px 0 0;">All figures ex GST. GST of ${fmt(gst)} applies — total inc GST <strong style="color:${TEXT_DARK};">${fmt(totalIncGst)}</strong>.</p>`;

    const paymentScheduleHtml = `
      <div style="background:#ffffff;border:1px solid ${BORDER};border-radius:12px;padding:22px 24px;margin:20px 0 0;">
        <h3 style="margin:0 0 12px;font-size:16px;font-weight:700;color:${TEXT_DARK};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Payment Schedule</h3>
        <table width="100%" cellpadding="0" cellspacing="0" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
          <tr><td style="padding:12px 0;border-bottom:1px solid #f1f5f9;">
            <div style="font-size:14px;font-weight:600;color:${TEXT_DARK};">${escapeHtml(depositLabel)}</div>
            <div style="font-size:12px;color:${MUTED};margin-top:2px;">${escapeHtml(depositWhen)}</div>
          </td><td align="right" style="padding:12px 0;border-bottom:1px solid #f1f5f9;font-size:18px;font-weight:800;color:${NAVY};">${fmt(depositAmount)}</td></tr>
          <tr><td style="padding:12px 0;border-bottom:1px solid #f1f5f9;">
            <div style="font-size:14px;font-weight:600;color:${TEXT_DARK};">${escapeHtml(mvpLabel)}</div>
            <div style="font-size:12px;color:${MUTED};margin-top:2px;">${escapeHtml(mvpWhen)}</div>
          </td><td align="right" style="padding:12px 0;border-bottom:1px solid #f1f5f9;font-size:18px;font-weight:800;color:${NAVY};">${fmt(mvpAmount)}</td></tr>
          <tr><td style="padding:12px 0;">
            <div style="font-size:14px;font-weight:600;color:${TEXT_DARK};">${escapeHtml(finalLabel)}</div>
            <div style="font-size:12px;color:${MUTED};margin-top:2px;">${escapeHtml(finalWhen)}</div>
          </td><td align="right" style="padding:12px 0;font-size:18px;font-weight:800;color:${NAVY};">${fmt(finalAmount)}</td></tr>
        </table>
      </div>`;

    const highlightBoxHtml = (highlight.headline || highlight.body)
      ? `<div style="background:${BG_BLUE};border:1px solid ${NAVY_PALE};border-left:4px solid ${NAVY_DEEP};border-radius:0 10px 10px 0;padding:18px 22px;margin:20px 0;">
           ${highlight.headline ? `<h3 style="margin:0 0 6px;font-size:16px;font-weight:700;color:${NAVY};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">${escapeHtml(highlight.headline)}</h3>` : ''}
           ${highlight.body ? `<p style="margin:0;color:${TEXT};font-size:14px;line-height:1.7;">${escapeHtml(highlight.body)}</p>` : ''}
         </div>`
      : '';

    const meansHtml = whatThisMeans.length > 0
      ? sectionHeading('What This Means in Practice') + whatThisMeans.map(renderMeansBlock).join('')
      : '';

    const outOfScopeHtml = outOfScope.length > 0
      ? sectionHeading('Out of Scope') +
        `<ol style="padding-left:22px;margin:0 0 16px;color:${TEXT};font-size:14px;line-height:1.75;">${outOfScope.map(n => `<li style="margin-bottom:6px;">${escapeHtml(n)}</li>`).join('')}</ol>`
      : '';

    const needsHtml = needs.length > 0
      ? sectionHeading('What We Need from You') +
        `<ul style="padding-left:22px;margin:0 0 16px;color:${TEXT};font-size:14px;line-height:1.75;">${needs.map(n => `<li style="margin-bottom:6px;">${escapeHtml(n)}</li>`).join('')}</ul>`
      : '';

    const phasesHtml = phases.length > 0
      ? sectionHeading('Delivery Timeline') +
        `<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;">${phases.map((p) => `
          <tr>
            <td valign="top" style="padding:14px 14px 14px 0;border-top:1px solid ${BORDER};width:140px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:13px;font-weight:700;color:${NAVY};text-transform:uppercase;letter-spacing:0.5px;">${escapeHtml(p.weeks || '')}</td>
            <td valign="top" style="padding:14px 0;border-top:1px solid ${BORDER};">
              ${p.title ? `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:15px;font-weight:700;color:${TEXT_DARK};margin-bottom:4px;">${escapeHtml(p.title)}</div>` : ''}
              ${p.body ? `<div style="color:${TEXT};font-size:14px;line-height:1.75;">${escapeHtml(p.body)}</div>` : ''}
            </td>
          </tr>`).join('')}</table>`
      : '';

    const oversightHtml = oversight
      ? `<div style="background:${AMBER_BG};border:1px solid ${AMBER_BORDER};border-left:4px solid ${AMBER};border-radius:0 10px 10px 0;padding:18px 22px;margin:24px 0;">
           <h3 style="margin:0 0 6px;font-size:16px;font-weight:700;color:${AMBER_TEXT};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">On accuracy and oversight</h3>
           <p style="margin:0;color:${AMBER_TEXT_DEEP};font-size:14px;line-height:1.75;">${escapeHtml(oversight)}</p>
         </div>`
      : '';

    const ctaHtml = `
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0 8px;">
        <tr>
          <td align="center" style="padding:0 8px 12px;">
            <!--[if mso]>
            <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${viewUrl}" style="height:54px;v-text-anchor:middle;width:280px;" arcsize="20%" stroke="f" fillcolor="${PURPLE}">
              <w:anchorlock/>
              <center style="color:#ffffff;font-family:Georgia,serif;font-size:16px;font-weight:bold;">Review &amp; Approve Proposal</center>
            </v:roundrect>
            <![endif]-->
            <!--[if !mso]><!-- -->
            <a href="${viewUrl}" style="display:inline-block;padding:16px 44px;background:${PURPLE};color:#ffffff;text-decoration:none;border-radius:10px;font-weight:800;font-size:16px;border:1px solid ${PURPLE_DARK};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Review &amp; Approve Proposal</a>
            <!--<![endif]-->
          </td>
        </tr>
      </table>
      <p style="text-align:center;margin:6px 0 0;color:${MUTED};font-size:12px;line-height:1.6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
        Open the proposal to review the scope, then choose <strong>Edit Scope</strong> to adjust items or <strong>Accept &amp; Sign</strong> to approve.
      </p>`;

    const todayStr = new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });

    const emailHtml = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${BG_SOFT};font-family:Georgia,'Times New Roman',serif;color:${TEXT_DARK};">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${BG_SOFT};padding:40px 16px;">
    <tr><td align="center">
      <table width="720" cellpadding="0" cellspacing="0" style="max-width:720px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(30,58,95,0.08);">

        <!-- Julia-pixel header: solid navy (gradients unsupported in Outlook) -->
        <tr><td bgcolor="${NAVY_DEEP}" style="background-color:${NAVY_DEEP};padding:44px 40px;color:#ffffff;">
          <p style="color:${NAVY_LIGHT};font-size:12px;text-transform:uppercase;letter-spacing:2px;margin:0 0 10px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">${isRevised ? `Revised Proposal — v${revision}` : 'Phase 4 Proposal · Green Light™'}</p>
          <h1 style="color:#ffffff;font-size:28px;margin:0 0 10px;font-weight:700;line-height:1.3;">${escapeHtml(proposalTitle)}</h1>
          ${highlight.headline ? `<div style="color:${NAVY_PALE};font-size:15px;margin-bottom:8px;">${escapeHtml(highlight.headline)}</div>` : ''}
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.15);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
            <tr>
              <td style="padding-right:24px;vertical-align:top;">
                <div style="color:${NAVY_LIGHT};font-size:12px;">Prepared for</div>
                <strong style="color:#ffffff;font-size:14px;display:block;margin-top:2px;">${escapeHtml(contactName)}${businessName ? ` — ${escapeHtml(businessName)}` : ''}</strong>
              </td>
              <td style="padding-right:24px;vertical-align:top;">
                <div style="color:${NAVY_LIGHT};font-size:12px;">Prepared by</div>
                <strong style="color:#ffffff;font-size:14px;display:block;margin-top:2px;">Aidan Leonard &amp; Eoghan</strong>
              </td>
              <td style="vertical-align:top;">
                <div style="color:${NAVY_LIGHT};font-size:12px;">Date</div>
                <strong style="color:#ffffff;font-size:14px;display:block;margin-top:2px;">${todayStr}</strong>
              </td>
            </tr>
          </table>
        </td></tr>

        <tr><td style="padding:32px 40px 8px;">
          ${internalDraftBannerHtml}
          ${revisionBannerHtml}
          <p style="color:${TEXT};font-size:15px;line-height:1.85;margin:0 0 16px;">Hi ${escapeHtml(firstName)},</p>

          ${sectionHeading('What We Heard')}
          ${whatWeHeard.split(/\n\n+/).map((p: string) => `<p style="color:${TEXT};font-size:15px;line-height:1.85;margin:0 0 14px;">${escapeHtml(p)}</p>`).join('')}

          ${sectionHeading('What We Are Building')}
          ${highlightBoxHtml}
          ${itemsHtml || `<p style="color:${MUTED};font-size:13px;font-style:italic;margin:0 0 12px;">No build items in this proposal.</p>`}

          ${removedItems.length > 0 ? `
            <p style="margin:24px 0 10px;font-size:12px;font-weight:700;color:${MUTED};text-transform:uppercase;letter-spacing:1.2px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
              Removed in this revision (${removedItems.length})
            </p>
            ${removedHtml}
          ` : ''}

          ${meansHtml}

          ${outOfScopeHtml}

          ${phasesHtml}

          ${sectionHeading('Investment')}
          ${investmentTilesHtml}
          ${paymentScheduleHtml}

          ${needsHtml}

          ${oversightHtml}

          ${closing ? `<p style="color:${TEXT};font-size:15px;line-height:1.85;margin:30px 0 0;">${escapeHtml(closing)}</p>` : ''}

          ${ctaHtml}

          <p style="color:${MUTED};font-size:11px;line-height:1.6;margin:24px 0 0;text-align:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
            This personalised link is valid for 14 days. If you have any questions, just reply to this email.
          </p>
        </td></tr>

        <tr><td style="padding:24px 40px 28px;">
          <p style="margin:0 0 4px;color:${TEXT_DARK};font-size:16px;font-weight:700;">Aidan Leonard</p>
          <p style="margin:0 0 14px;color:${MUTED};font-size:13px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Co-Founder &amp; Business Analyst, 5to10X</p>
          <p style="margin:0 0 4px;color:${TEXT_DARK};font-size:16px;font-weight:700;">Eoghan</p>
          <p style="margin:0;color:${MUTED};font-size:13px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Co-Founder — Engineering Build Advisor, 5to10X</p>
        </td></tr>

        <tr><td style="padding:24px 40px 20px;background:${BG_SOFT};border-top:1px solid ${BORDER};text-align:center;">
          <img src="https://hfszmulinpwzmroqemke.supabase.co/storage/v1/object/public/email-assets/logo-5to10x-cropped.png" alt="5to10X" width="180" style="display:inline-block;width:180px;height:auto;margin:0 0 12px;border:0;outline:none;text-decoration:none;" />
          <p style="color:${NAVY};font-size:14px;font-weight:700;margin:0 0 4px;">You're not buying tech. You're buying profit.</p>
          <p style="color:${MUTED};font-size:12px;margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">5to10X — Strategic App ROI Assessment</p>
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

    const recipientList = isInternalDraft ? internalRecipients : [assessment.contact_email];

    // Allow the admin Comms panel to override subject/body with the edited draft.
    const finalSubject = hasOverrideSubject
      ? (isInternalDraft ? `[INTERNAL DRAFT — DO NOT FORWARD] ${overrideSubject}` : overrideSubject)
      : subject;
    const finalHtml = hasOverrideHtml ? overrideHtml : emailHtml;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromField,
        to: recipientList,
        ...(!isInternalDraft && ccList.length > 0 ? { cc: ccList } : {}),
        subject: finalSubject,
        html: finalHtml,
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

    // Only mark the proposal as delivered when it actually went to the client.
    if (!isInternalDraft) {
      const deliveredAt = new Date().toISOString();
      await supabase
        .from('proposals')
        .update({ delivered_at: deliveredAt, sent_at: deliveredAt })
        .eq('id', proposal.id);
    }

    return new Response(JSON.stringify({
      success: true,
      proposalId: proposal.id,
      revision,
      isRevised,
      isInternalDraft,
      sentTo: recipientList,
      providerId: resendData.id,
      token,
      viewUrl,
      itemsIncluded: includedCount,
      itemsRemoved: removedItems.length,
      email: {
        subject: finalSubject,
        body: finalHtml,
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
