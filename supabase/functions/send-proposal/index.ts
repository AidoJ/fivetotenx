import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const fmt = (n: number) => `$${Math.round(n || 0).toLocaleString()}`;

const buildItemsTableHtml = (items: any[]) => {
  if (!items || items.length === 0) return '';
  const rows = items.map((it: any) => {
    const tag = it.mandatory
      ? `<span style="display:inline-block;padding:2px 8px;background:#1e3a5f;color:#fff;font-size:10px;border-radius:4px;letter-spacing:0.5px;">INCLUDED</span>`
      : `<span style="display:inline-block;padding:2px 8px;background:#e0f2fe;color:#075985;font-size:10px;border-radius:4px;letter-spacing:0.5px;">OPTIONAL</span>`;
    return `
      <tr>
        <td style="padding:12px 8px;border-bottom:1px solid #e2e8f0;vertical-align:top;">
          <div style="color:#1e3a5f;font-weight:600;font-size:14px;margin-bottom:4px;">${it.title || 'Item'}</div>
          <div>${tag}</div>
        </td>
        <td style="padding:12px 8px;border-bottom:1px solid #e2e8f0;text-align:right;color:#1e3a5f;font-weight:600;font-size:14px;white-space:nowrap;vertical-align:top;">
          ${fmt(it.cost || 0)}
        </td>
      </tr>`;
  }).join('');
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;border-collapse:collapse;">
      <thead>
        <tr>
          <th style="text-align:left;padding:8px;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid #1e3a5f;">Scope Item</th>
          <th style="text-align:right;padding:8px;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid #1e3a5f;">Cost (ex GST)</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
};

const buildSummaryHtml = (totals: any, fee: any) => {
  if (!totals) return '';
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;background:#f8fafc;border-radius:10px;overflow:hidden;">
      <tr>
        <td style="padding:16px 20px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="color:#64748b;font-size:13px;padding:4px 0;">Subtotal (ex GST)</td><td style="text-align:right;color:#1e3a5f;font-size:13px;font-weight:600;padding:4px 0;">${fmt(totals.subtotalExGst)}</td></tr>
            <tr><td style="color:#64748b;font-size:13px;padding:4px 0;">GST (10%)</td><td style="text-align:right;color:#1e3a5f;font-size:13px;font-weight:600;padding:4px 0;">${fmt(totals.gst)}</td></tr>
            <tr><td colspan="2" style="border-top:1px solid #e2e8f0;padding:4px 0;"></td></tr>
            <tr><td style="color:#1e3a5f;font-size:15px;font-weight:700;padding:6px 0;">Total Investment (inc GST)</td><td style="text-align:right;color:#1e3a5f;font-size:18px;font-weight:700;padding:6px 0;">${fmt(totals.totalIncGst)}</td></tr>
            ${totals.totalWeeks ? `<tr><td style="color:#64748b;font-size:12px;padding:4px 0;">Estimated build timeline</td><td style="text-align:right;color:#475569;font-size:12px;padding:4px 0;">${totals.totalWeeks} weeks</td></tr>` : ''}
          </table>
        </td>
      </tr>
    </table>
    ${fee ? `
    <p style="color:#1e3a5f;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">Payment Schedule</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
      <tr>
        <td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;">
          <div style="color:#1e3a5f;font-size:13px;font-weight:600;">${fee.deposit?.label || 'Deposit'} (${fee.deposit?.percent || 10}%)</div>
        </td>
        <td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;text-align:right;color:#1e3a5f;font-size:14px;font-weight:700;">${fmt(fee.deposit?.amount || 0)}</td>
      </tr>
      <tr>
        <td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;">
          <div style="color:#1e3a5f;font-size:13px;font-weight:600;">${fee.mvp?.label || 'MVP'} (${fee.mvp?.percent || 50}%)</div>
        </td>
        <td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;text-align:right;color:#1e3a5f;font-size:14px;font-weight:700;">${fmt(fee.mvp?.amount || 0)}</td>
      </tr>
      <tr>
        <td style="padding:12px 16px;">
          <div style="color:#1e3a5f;font-size:13px;font-weight:600;">${fee.final?.label || 'Final'} (${fee.final?.percent || 40}%)</div>
        </td>
        <td style="padding:12px 16px;text-align:right;color:#1e3a5f;font-size:14px;font-weight:700;">${fmt(fee.final?.amount || 0)}</td>
      </tr>
    </table>` : ''}
    <p style="color:#64748b;font-size:12px;line-height:1.6;margin:0 0 24px;font-style:italic;">
      The figures above assume the full proposed scope. On the proposal page you can deselect any <strong>Optional</strong> items — the totals and payment schedule will update live before you accept.
    </p>`;
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

    let proposal: any;
    if (proposalId) {
      const { data } = await supabase.from('proposals').select('*').eq('id', proposalId).single();
      proposal = data;
    } else {
      const { data } = await supabase.from('proposals').select('*').eq('assessment_id', assessmentId).order('created_at', { ascending: false }).limit(1).single();
      proposal = data;
    }
    if (!proposal) throw new Error('Proposal not found. Please prepare the proposal first.');

    const { data: template } = await supabase
      .from('email_templates')
      .select('*')
      .eq('template_key', 'proposal-email')
      .single();

    const proposalData = (proposal.proposal_data || {}) as any;
    const items = proposalData.items || [];
    const totals = proposalData.totals || null;
    const fee = proposalData.feeStructure || null;

    const proposalUrl = `https://5to10x.app/proposal/${proposal.id}`;
    const contactName = assessment.contact_name || '';
    const businessName = assessment.business_name || 'your business';
    const firstName = (contactName || '').split(' ')[0];

    const itemsTableHtml = buildItemsTableHtml(items);
    const summaryHtml = buildSummaryHtml(totals, fee);
    const totalIncGst = totals ? fmt(totals.totalIncGst) : 'Custom';
    const subtotalExGst = totals ? fmt(totals.subtotalExGst) : '';
    const gstAmount = totals ? fmt(totals.gst) : '';
    const depositAmount = fee?.deposit ? fmt(fee.deposit.amount) : '';
    const mvpAmount = fee?.mvp ? fmt(fee.mvp.amount) : '';
    const finalAmount = fee?.final ? fmt(fee.final.amount) : '';
    const totalWeeks = totals?.totalWeeks ? `${totals.totalWeeks} weeks` : '';

    let emailHtml: string;
    let subject: string;
    let fromField: string;

    if (template) {
      emailHtml = template.html_body
        .replace(/\{\{contactName\}\}/g, firstName)
        .replace(/\{\{businessName\}\}/g, businessName)
        .replace(/\{\{proposalUrl\}\}/g, proposalUrl)
        .replace(/\{\{itemsTable\}\}/g, itemsTableHtml)
        .replace(/\{\{summary\}\}/g, summaryHtml)
        .replace(/\{\{totalIncGst\}\}/g, totalIncGst)
        .replace(/\{\{subtotalExGst\}\}/g, subtotalExGst)
        .replace(/\{\{gst\}\}/g, gstAmount)
        .replace(/\{\{deposit\}\}/g, depositAmount)
        .replace(/\{\{mvp\}\}/g, mvpAmount)
        .replace(/\{\{final\}\}/g, finalAmount)
        .replace(/\{\{totalWeeks\}\}/g, totalWeeks)
        .replace(/\{\{buildRange\}\}/g, totalIncGst);
      subject = template.subject
        .replace(/\{\{contactName\}\}/g, firstName)
        .replace(/\{\{businessName\}\}/g, businessName);
      fromField = `${template.from_name} <${template.from_email}>`;
    } else {
      subject = `${firstName}, your custom app proposal for ${businessName} is ready`;
      fromField = '5to10X <grow@5to10x.app>';
      emailHtml = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Georgia,'Times New Roman',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px;">
    <tr><td align="center">
      <table width="640" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(30,58,95,0.06);">
        <tr><td style="background:#1e3a5f;padding:36px 32px;text-align:center;">
          <p style="color:#93c5fd;font-size:12px;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px;">Your Proposal Is Ready</p>
          <h1 style="color:#ffffff;font-size:24px;margin:0;font-weight:700;">Custom App Proposal for ${businessName}</h1>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="color:#334155;font-size:15px;line-height:1.8;margin:0 0 16px;">Hi ${firstName},</p>
          <p style="color:#334155;font-size:15px;line-height:1.8;margin:0 0 24px;">
            Based on your Reality Check™ assessment and Straight Talk™ conversation, we've prepared a tailored proposal for <strong>${businessName}</strong>. Here's the proposed scope and investment:
          </p>
          ${itemsTableHtml}
          ${summaryHtml}
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center">
              <a href="${proposalUrl}" style="display:inline-block;padding:16px 40px;background:#1e3a5f;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:700;font-size:16px;">View & Customise Your Proposal →</a>
            </td></tr>
          </table>
          <p style="color:#64748b;font-size:12px;margin:24px 0 0;text-align:center;">Adjust your scope, accept, or print as PDF from the proposal page.</p>
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
