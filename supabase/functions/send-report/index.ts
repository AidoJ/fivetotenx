import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const fmt = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);

const row = (label: string, value: string) => `
  <tr>
    <td style="padding: 8px 12px; color: #64748b; font-size: 13px; border-bottom: 1px solid #f1f5f9; word-break: break-word;">${label}</td>
    <td style="padding: 8px 12px; color: #1e293b; font-size: 13px; font-weight: 600; text-align: right; border-bottom: 1px solid #f1f5f9; word-break: break-word;">${value}</td>
  </tr>`;

const sectionHead = (title: string) => `
  <tr>
    <td colspan="2" style="padding: 18px 16px 10px; font-size: 13px; font-weight: 700; color: #1e3a5f; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #dbeafe;">
      ${title}
    </td>
  </tr>`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { contactName, contactEmail, businessName, results, formData, assessmentId, isQualified } = await req.json();

    if (!contactEmail || !contactName) {
      return new Response(JSON.stringify({ error: 'Name and email are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY is not configured');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    // ── Compute all dynamic values ──
    const businessTypeLabel = formData?.businessType === 'hybrid' ? 'Hybrid (Service + Product)' : formData?.businessType === 'product' ? 'Product-Based' : 'Service-Based';
    const isService = formData?.businessType === 'service' || formData?.businessType === 'hybrid';
    const isProduct = formData?.businessType === 'product' || formData?.businessType === 'hybrid';
    const lostReasons = formData?.lostSalesReasons?.length > 0 ? formData.lostSalesReasons.join(', ') : 'None identified';
    const currentFeatures = formData?.currentFeatures?.length > 0 ? formData.currentFeatures.join(', ') : 'None currently';
    const pricing = results?.pricing;
    const isViable = pricing?.isViable !== false;

    // ── Build data table ──
    const businessDataTable = `
      <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        ${sectionHead('Business Profile')}
        ${row('Business Name', formData?.businessName || '—')}
        ${row('Industry', formData?.industry || '—')}
        ${row('Business Model', businessTypeLabel)}
        ${row('Number of Staff', formData?.numberOfStaff || '—')}
        ${row('Monthly Revenue', formData?.monthlyRevenue || '—')}
        ${row('Avg Purchase Value', formData?.avgPurchaseValue ? `$${formData.avgPurchaseValue}` : '—')}
        ${sectionHead('Customer & Sales Metrics')}
        ${row('Monthly Website Visitors', formData?.monthlyVisitors || '—')}
        ${row('Monthly Leads / Enquiries', formData?.monthlyLeads || '—')}
        ${row('Lead-to-Sale Conversion Rate', formData?.conversionRate ? `${formData.conversionRate}%` : '—')}
        ${row('Monthly New Customers', formData?.monthlyNewCustomers || '—')}
        ${isService && formData?.noShowRate ? row('No-Show / Cancellation Rate', `${formData.noShowRate}%`) : ''}
        ${isProduct && formData?.upsellRevenuePercent ? row('Upsell / Cross-sell Revenue', `${formData.upsellRevenuePercent}%`) : ''}
        ${formData?.monthlyMarketingSpend ? row('Monthly Marketing Spend', `$${formData.monthlyMarketingSpend}`) : ''}
        ${formData?.customerAcquisitionCost ? row('Customer Acquisition Cost', `$${formData.customerAcquisitionCost}`) : ''}
        ${sectionHead('Customer Lifetime Value Inputs')}
        ${row('Avg Purchase Value', formData?.avgPurchaseValue ? `$${formData.avgPurchaseValue}` : '—')}
        ${row('Avg Purchases Per Year', formData?.avgPurchasesPerYear || '—')}
        ${row('Avg Customer Retention', formData?.avgRetentionYears ? `${formData.avgRetentionYears} years` : '—')}
        ${row('Calculated CLV', fmt(results.clv || 0))}
        ${sectionHead('Weekly Operational Hours')}
        ${row('Admin Tasks', formData?.hoursAdmin ? `${formData.hoursAdmin} hrs` : '—')}
        ${row('Booking & Scheduling', formData?.hoursBooking ? `${formData.hoursBooking} hrs` : '—')}
        ${row('Follow-ups', formData?.hoursFollowUps ? `${formData.hoursFollowUps} hrs` : '—')}
        ${row('Invoicing', formData?.hoursInvoicing ? `${formData.hoursInvoicing} hrs` : '—')}
        ${row('Total Weekly Hours', `${results.weeklyAdminHours || 0} hrs`)}
        ${row('Hourly Staff Cost', formData?.hourlyStaffCost ? `$${formData.hourlyStaffCost}/hr` : '—')}
        ${sectionHead('Growth Context')}
        ${row('Lost Sales Reasons', lostReasons)}
        ${row('Current Digital Features', currentFeatures)}
      </table>`;

    // ── Build ROI breakdown cards ──
    let roiBreakdownCards = `
      <table width="100%" cellpadding="0" cellspacing="0" style="background: #f0f9ff; border-radius: 8px; margin-bottom: 12px;">
        <tr><td style="padding: 16px;">
          <p style="color: #1e3a5f; font-size: 14px; font-weight: 700; margin: 0 0 6px;">📈 Revenue Lift — ${fmt(results.revenueLift)}/year</p>
          <p style="color: #475569; font-size: 13px; line-height: 1.7; margin: 0;">
            Your current conversion rate of ${results.currentConversion?.toFixed(1) || '0'}% means you're converting ${formData?.monthlyVisitors || '0'} visitors into ${fmt(results.currentMonthlyRevenue || 0)}/mo. With a custom app delivering a 15% conversion improvement (to ${results.newConversion?.toFixed(2) || '0'}%), your monthly revenue rises to ${fmt(results.newMonthlyRevenue || 0)} — that's an extra <strong>${fmt((results.revenueLift || 0) / 12)}/mo</strong>.
          </p>
        </td></tr>
      </table>
      <table width="100%" cellpadding="0" cellspacing="0" style="background: #f0fdf4; border-radius: 8px; margin-bottom: 12px;">
        <tr><td style="padding: 16px;">
          <p style="color: #14532d; font-size: 14px; font-weight: 700; margin: 0 0 6px;">⏱️ Operational Savings — ${fmt(results.operationalSavings)}/year</p>
          <p style="color: #475569; font-size: 13px; line-height: 1.7; margin: 0;">
            Your team currently spends ${results.weeklyAdminHours || 0} hours/week on manual admin, booking, follow-ups, and invoicing at $${formData?.hourlyStaffCost || '0'}/hr. App automation typically removes 40% of this workload — freeing up <strong>${results.weeklySavingsHours?.toFixed(1) || '0'} hours every week</strong> for revenue-generating activities.
          </p>
        </td></tr>
      </table>
      <table width="100%" cellpadding="0" cellspacing="0" style="background: #fdf4ff; border-radius: 8px; margin-bottom: 12px;">
        <tr><td style="padding: 16px;">
          <p style="color: #581c87; font-size: 14px; font-weight: 700; margin: 0 0 6px;">👥 Customer Retention — ${fmt(results.retentionImprovement)}/year</p>
          <p style="color: #475569; font-size: 13px; line-height: 1.7; margin: 0;">
            With ${results.activeCustomers || 0} customers per year and a CLV of ${fmt(results.clv || 0)}, even a conservative 10% retention improvement — through push notifications, loyalty features, and personalised engagement — adds significant value.
          </p>
        </td></tr>
      </table>`;

    if (results.noShowRecovery > 0) {
      roiBreakdownCards += `
      <table width="100%" cellpadding="0" cellspacing="0" style="background: #fef2f2; border-radius: 8px; margin-bottom: 12px;">
        <tr><td style="padding: 16px;">
          <p style="color: #7f1d1d; font-size: 14px; font-weight: 700; margin: 0 0 6px;">🛡️ No-Show Recovery — ${fmt(results.noShowRecovery)}/year</p>
          <p style="color: #475569; font-size: 13px; line-height: 1.7; margin: 0;">
            With a ${formData?.noShowRate || '0'}% no-show rate, you're currently losing revenue on missed appointments. Automated reminders, easy rescheduling, and deposit integration typically recover 50% of no-shows.
          </p>
        </td></tr>
      </table>`;
    }
    if (results.upsellLift > 0) {
      roiBreakdownCards += `
      <table width="100%" cellpadding="0" cellspacing="0" style="background: #fffbeb; border-radius: 8px; margin-bottom: 12px;">
        <tr><td style="padding: 16px;">
          <p style="color: #78350f; font-size: 14px; font-weight: 700; margin: 0 0 6px;">🛒 Upsell & Cross-sell Lift — ${fmt(results.upsellLift)}/year</p>
          <p style="color: #475569; font-size: 13px; line-height: 1.7; margin: 0;">
            Currently ${formData?.upsellRevenuePercent || '0'}% of your revenue comes from add-on products. Smart in-app recommendations can lift this by 15%, turning every transaction into a higher-value interaction.
          </p>
        </td></tr>
      </table>`;
    }
    if (results.marketingEfficiency > 0) {
      roiBreakdownCards += `
      <table width="100%" cellpadding="0" cellspacing="0" style="background: #f0f9ff; border-radius: 8px; margin-bottom: 12px;">
        <tr><td style="padding: 16px;">
          <p style="color: #1e3a5f; font-size: 14px; font-weight: 700; margin: 0 0 6px;">📣 Marketing Efficiency — ${fmt(results.marketingEfficiency)}/year</p>
          <p style="color: #475569; font-size: 13px; line-height: 1.7; margin: 0;">
            You're spending $${formData?.monthlyMarketingSpend || '0'}/mo on marketing with a CAC of $${formData?.customerAcquisitionCost || '0'}. Better in-app conversion reduces your effective CAC, saving approximately 20% of marketing spend.
          </p>
        </td></tr>
      </table>`;
    }

    // ── Build payment plans HTML ──
    let paymentPlansHtml = '';
    if (isViable && pricing?.plans?.length > 0) {
      const planRows = pricing.plans.map((plan: any) => `
        <tr>
          <td style="padding: 14px 16px; border-bottom: 1px solid #f1f5f9;">
            <p style="color: #1e3a5f; font-size: 14px; font-weight: 700; margin: 0 0 4px;">${plan.label}</p>
            <p style="color: #64748b; font-size: 12px; margin: 0;">${plan.description}</p>
          </td>
          <td style="padding: 14px 16px; text-align: right; border-bottom: 1px solid #f1f5f9; vertical-align: top;">
            ${plan.deposit > 0 ? `<p style="color: #1e293b; font-size: 13px; margin: 0;">Deposit: ${fmt(plan.deposit)}</p>` : ''}
            ${plan.monthlyAmount > 0 ? `<p style="color: #2563eb; font-size: 13px; font-weight: 600; margin: 2px 0 0;">${fmt(plan.monthlyAmount)}/mo${plan.includesMaintenance ? ' (incl. maintenance)' : ''}</p>` : ''}
            ${plan.totalCost > 0 ? `<p style="color: #64748b; font-size: 12px; margin: 2px 0 0;">Total: ${fmt(plan.totalCost)}</p>` : ''}
          </td>
        </tr>
      `).join('');
      paymentPlansHtml = `<table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; margin-top: 12px;">${planRows}</table>`;
    }

    // ── Build investment section ──
    const investmentSection = isViable ? `
      <tr>
        <td class="content-pad" style="padding: 0 32px 28px;">
          <h2 style="color: #1e3a5f; font-size: 18px; margin: 0 0 8px;">💰 Your Investment & Payment Options</h2>
          <p style="color: #64748b; font-size: 13px; line-height: 1.6; margin: 0 0 6px;">
            Based on your projected {{totalAnnualImpact}}/year impact, your app falls in our <strong>${pricing?.tierLabel || ''}</strong> tier.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin: 16px 0;">
            <tr>
              <td class="stat-cell" style="padding: 16px; background: #f0f9ff; border-radius: 8px; text-align: center; width: 33%;">
                <p style="color: #64748b; font-size: 11px; margin: 0 0 4px;">Build Investment</p>
                <p style="color: #1e3a5f; font-size: 20px; font-weight: 700; margin: 0;">${fmt(pricing?.buildCost || 0)}</p>
              </td>
              <td class="stat-spacer" style="width: 8px;"></td>
              <td class="stat-cell" style="padding: 16px; background: #f0fdf4; border-radius: 8px; text-align: center; width: 33%;">
                <p style="color: #64748b; font-size: 11px; margin: 0 0 4px;">Break-even</p>
                <p style="color: #16a34a; font-size: 20px; font-weight: 700; margin: 0;">${results.breakEvenMonths?.toFixed(1) || '0'} months</p>
              </td>
              <td class="stat-spacer" style="width: 8px;"></td>
              <td class="stat-cell" style="padding: 16px; background: #fdf4ff; border-radius: 8px; text-align: center; width: 33%;">
                <p style="color: #64748b; font-size: 11px; margin: 0 0 4px;">Year 1 ROI</p>
                <p style="color: #7c3aed; font-size: 20px; font-weight: 700; margin: 0;">${results.roiPercentage?.toFixed(0) || '0'}%</p>
              </td>
            </tr>
          </table>
          <p style="color: #1e3a5f; font-size: 14px; font-weight: 600; margin: 16px 0 8px;">Choose a Payment Plan:</p>
          ${paymentPlansHtml}
          ${pricing?.annualMaintenance > 0 ? `<p style="color: #64748b; font-size: 12px; margin: 12px 0 0;">* Annual maintenance: ${fmt(pricing.annualMaintenance)}/year — included in subscription plans.</p>` : ''}
        </td>
      </tr>` : `
      <tr>
        <td style="padding: 0 32px 28px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px;">
            <tr><td style="padding: 24px;">
              <h3 style="color: #991b1b; font-size: 16px; margin: 0 0 8px;">⚠️ Viability Assessment</h3>
              <p style="color: #7f1d1d; font-size: 13px; line-height: 1.7; margin: 0;">
                Based on current figures, the projected annual impact of {{totalAnnualImpact}} may not justify a custom app build at this stage. We'd recommend focusing on growing your customer base and revenue first, then revisiting.
              </p>
            </td></tr>
          </table>
        </td>
      </tr>`;

    // ── Build Straight Talk CTA (qualified leads get two options) ──
    const deepDiveBaseUrl = 'https://5to10x.app';
    const calendlyUrl = 'https://calendly.com/aidan-rejuvenators/discovery';
    const selfInterviewUrl = `${deepDiveBaseUrl}/self-interview?id=${assessmentId}`;
    const deepDiveSection = (isQualified && assessmentId)
      ? `
        <tr>
          <td style="padding: 0 32px 28px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1e3a5f, #4338ca); border-radius: 12px; overflow: hidden;">
              <tr>
                <td style="padding: 32px; text-align: center;">
                   <p style="color: #93c5fd; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 8px;">✨ YOU QUALIFY FOR AN AI BUSINESS REWIRING SESSION</p>
                  <h2 style="color: #ffffff; font-size: 22px; font-weight: 700; margin: 0 0 12px;">Ready for Your Straight Talk™?</h2>
                  <p style="color: #bfdbfe; font-size: 14px; line-height: 1.7; margin: 0 0 8px; max-width: 480px; margin-left: auto; margin-right: auto;">
                    This isn't about building another app. It's about redesigning how work flows through your business.
                  </p>
                  <p style="color: #bfdbfe; font-size: 13px; line-height: 1.7; margin: 0 0 6px; max-width: 480px; margin-left: auto; margin-right: auto;">
                    Your Straight Talk™ session is a strategic review where we map:
                  </p>
                  <table cellpadding="0" cellspacing="0" style="margin: 0 auto 8px; text-align: left; max-width: 420px;">
                    <tr><td style="color: #bfdbfe; font-size: 13px; padding: 3px 0;">• the hidden friction slowing your operations</td></tr>
                    <tr><td style="color: #bfdbfe; font-size: 13px; padding: 3px 0;">• the decisions AI can start making for you</td></tr>
                    <tr><td style="color: #bfdbfe; font-size: 13px; padding: 3px 0;">• the workflows that should disappear completely</td></tr>
                    <tr><td style="color: #bfdbfe; font-size: 13px; padding: 3px 0;">• and the fastest path to measurable efficiency gains</td></tr>
                  </table>
                  <p style="color: #93c5fd; font-size: 13px; font-weight: 600; line-height: 1.7; margin: 0 0 24px; max-width: 480px; margin-left: auto; margin-right: auto;">
                    Most businesses uncover 5–10× leverage opportunities in this session alone.
                  </p>
                  <p style="color: #bfdbfe; font-size: 14px; margin: 0 0 16px;">Choose the option that works best for you:</p>
                  </p>
                  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 500px; margin: 0 auto;">
                    <tr>
                      <td style="padding: 0 6px 12px; width: 50%; vertical-align: top;">
                        <table width="100%" cellpadding="0" cellspacing="0" style="background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.2); border-radius: 10px;">
                          <tr><td style="padding: 20px 16px; text-align: center;">
                            <p style="font-size: 28px; margin: 0 0 8px;">📅</p>
                            <p style="color: #ffffff; font-size: 14px; font-weight: 700; margin: 0 0 6px;">Book a Live Call</p>
                            <p style="color: #bfdbfe; font-size: 12px; line-height: 1.5; margin: 0 0 16px;">Chat with Aidan & Eoghan on Zoom about next steps</p>
                            <a href="${calendlyUrl}" style="display: inline-block; padding: 10px 24px; background: #ffffff; color: #1e3a5f; text-decoration: none; border-radius: 6px; font-weight: 700; font-size: 13px;">Book Now →</a>
                          </td></tr>
                        </table>
                      </td>
                      <td style="padding: 0 6px 12px; width: 50%; vertical-align: top;">
                        <table width="100%" cellpadding="0" cellspacing="0" style="background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.2); border-radius: 10px;">
                          <tr><td style="padding: 20px 16px; text-align: center;">
                            <p style="font-size: 28px; margin: 0 0 8px;">🎙️</p>
                            <p style="color: #ffffff; font-size: 14px; font-weight: 700; margin: 0 0 6px;">Self-Interview First</p>
                            <p style="color: #bfdbfe; font-size: 12px; line-height: 1.5; margin: 0 0 16px;">Record answers at your own pace, then we'll follow up</p>
                            <a href="${selfInterviewUrl}" style="display: inline-block; padding: 10px 24px; background: rgba(255,255,255,0.2); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 700; font-size: 13px; border: 1px solid rgba(255,255,255,0.3);">Start Now →</a>
                          </td></tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>`
      : '';

    // ── Build closing section ──
    const closingSection = isQualified
      ? `<p style="color: #334155; font-size: 14px; line-height: 1.8; margin: 0;">
          We're looking forward to mapping out the biggest wins for {{businessName}}. Choose one of the options above and we'll take it from there.
        </p>`
      : `<p style="color: #334155; font-size: 14px; line-height: 1.8; margin: 0;">
          We'd love to discuss how to bring this to life for {{businessName}}. Reply to this email to start the conversation.
        </p>`;

    // ── All placeholder replacements ──
    const replacements: Record<string, string> = {
      '{{contactName}}': (contactName || '').split(' ')[0],
      '{{businessName}}': businessName || 'Your Business',
      '{{businessTypeLabel}}': businessTypeLabel.toLowerCase(),
      '{{totalAnnualImpact}}': fmt(results.totalAnnualImpact),
      '{{monthlyImpact}}': fmt(results.totalAnnualImpact / 12),
      '{{monthlyOpCost}}': fmt((results.operationalSavings || 0) / 12),
      '{{monthlyRevLift}}': fmt((results.revenueLift || 0) / 12),
      '{{breakEvenMonths}}': results.breakEvenMonths?.toFixed(1) || 'a few',
      '{{businessDataTable}}': businessDataTable,
      '{{roiBreakdownCards}}': roiBreakdownCards,
      '{{investmentSection}}': investmentSection,
      '{{deepDiveSection}}': deepDiveSection,
      '{{closingSection}}': closingSection,
    };

    // ── Try loading template from DB ──
    const { data: template } = await supabase
      .from('email_templates')
      .select('*')
      .eq('template_key', 'roi-report')
      .single();

    let emailHtml: string;
    let subject: string;
    let fromField: string;

    if (template) {
      emailHtml = template.html_body;
      subject = template.subject;
      fromField = `${template.from_name} <${template.from_email}>`;
      // Apply all replacements
      for (const [key, val] of Object.entries(replacements)) {
        emailHtml = emailHtml.replaceAll(key, val);
        subject = subject.replaceAll(key, val);
      }
    } else {
      // Fallback: hardcoded template
      fromField = '5to10X Growth Report <grow@5to10x.app>';
      subject = `Strategic Growth Report – ${businessName || 'Your Business'} | App ROI Assessment`;
      emailHtml = buildDefaultTemplate(replacements);
    }

    // ── Send via Resend ──
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromField,
        to: [contactEmail],
        subject,
        html: emailHtml,
      }),
    });

    const resendData = await resendResponse.json();
    if (!resendResponse.ok) {
      console.error('Resend API error:', resendData);
      throw new Error(`Email sending failed: ${JSON.stringify(resendData)}`);
    }

    // ── If qualified, notify admin & update pipeline ──
    if (isQualified) {
      try {
        const adminNotifyHtml = `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>🔥 New Qualified Lead</h2>
          <p><strong>${contactName}</strong> from <strong>${businessName || 'Unknown Business'}</strong></p>
          <p>Email: ${contactEmail}</p>
          <p>Projected Annual Impact: ${fmt(results.totalAnnualImpact)}</p>
          <p>Build Cost: ${fmt(pricing?.buildCostLow || 0)} – ${fmt(pricing?.buildCostHigh || 0)}</p>
          <p><a href="https://5to10x.app/admin">View in Pipeline →</a></p>
        </div>`;

        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: '5to10X Pipeline <grow@5to10x.app>',
            to: ['grow@5to10x.app'],
            subject: `🔥 New Qualified Lead: ${contactName} – ${businessName || 'Unknown'}`,
            html: adminNotifyHtml,
          }),
        });
      } catch (adminErr) {
        console.error('Admin notification failed (non-blocking):', adminErr);
      }

      // Update pipeline stage
      if (assessmentId) {
        try {
          const now = new Date().toISOString();
          const followUpAt = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
          await supabase.from('roi_assessments').update({
            pipeline_stage: 'qualified',
            invite_sent: true,
            invite_sent_at: now,
            follow_up_scheduled_at: followUpAt,
          }).eq('id', assessmentId);
          console.log('Updated pipeline stage to qualified for:', contactEmail);
        } catch (updateErr) {
          console.error('Pipeline update failed (non-blocking):', updateErr);
        }
      }
    }

    console.log('Email sent successfully:', resendData);
    return new Response(JSON.stringify({ success: true, message: 'Report emailed successfully', emailId: resendData.id }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error in send-report:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// ── Default template (fallback if no DB template) ──
function buildDefaultTemplate(r: Record<string, string>): string {
  let html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  body,table,td,a{-webkit-text-size-adjust:100%!important;-ms-text-size-adjust:100%!important}
  table{border-collapse:collapse!important}
  img{border:0;display:block;max-width:100%!important;height:auto!important}
  @media only screen and (max-width:620px){
    .outer-wrap{padding:12px 8px!important}
    .main-table{width:100%!important;min-width:100%!important}
    .content-pad{padding-left:16px!important;padding-right:16px!important}
    .header-pad{padding:28px 16px!important}
    .stat-cell{display:block!important;width:100%!important;margin-bottom:8px!important}
    .stat-spacer{display:none!important}
    .cta-cell{display:block!important;width:100%!important;padding:0 0 12px!important}
    .impact-number{font-size:32px!important}
    h1{font-size:22px!important}
    h2{font-size:16px!important}
  }
</style>
</head>
<body style="margin: 0; padding: 0; background: #f8fafc; font-family: Georgia, 'Times New Roman', serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background: #f8fafc;">
    <tr>
      <td align="center" class="outer-wrap" style="padding: 40px 20px;">
        <table cellpadding="0" cellspacing="0" class="main-table" style="background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(30,58,95,0.06); width: 100%; max-width: 640px;">
          <!-- Header -->
          <tr>
            <td class="header-pad" style="background: linear-gradient(135deg, #1e3a5f, #1e40af); padding: 40px 32px; text-align: center;">
              <p style="color: #93c5fd; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 8px;">Strategic Growth Assessment</p>
              <h1 style="color: #ffffff; font-size: 26px; margin: 0; font-weight: 700;">Digital Transformation ROI Report</h1>
              <p style="color: #bfdbfe; font-size: 15px; margin: 12px 0 0;">Prepared exclusively for {{businessName}}</p>
            </td>
          </tr>
          <!-- Opening Letter -->
          <tr>
            <td class="content-pad" style="padding: 36px 32px 0;">
              <p style="color: #1e293b; font-size: 16px; line-height: 1.7; margin: 0 0 16px;">Hi {{contactName}},</p>
              <p style="color: #334155; font-size: 14px; line-height: 1.8; margin: 0 0 14px;">
                Thank you for investing the time to complete this assessment. What follows isn't just a set of numbers — it's a strategic roadmap for how <strong>{{businessName}}</strong> can leverage modern technology to unlock measurable growth.
              </p>
              <p style="color: #334155; font-size: 14px; line-height: 1.8; margin: 0 0 14px;">
                The business landscape is shifting rapidly. Companies that adopt AI-powered tools, automation, and custom digital solutions aren't just keeping up — they're <strong>pulling ahead</strong>.
              </p>
              <p style="color: #334155; font-size: 14px; line-height: 1.8; margin: 0 0 14px;">
                The question is no longer <em>"Should we invest in technology?"</em> — it's <em>"How much are we losing by waiting?"</em>
              </p>
              <p style="color: #334155; font-size: 14px; line-height: 1.8; margin: 0 0 24px;">
                Based on the data you provided, here's what a custom-built app could deliver for your {{businessTypeLabel}} business. We've included every input you gave us so you can verify the foundations of these projections.
              </p>
            </td>
          </tr>
          <!-- TOTAL IMPACT -->
          <tr>
             <td class="content-pad" style="padding: 0 32px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background: linear-gradient(135deg, #1e3a5f, #1e40af); padding: 24px 16px; border-radius: 12px; text-align: center;">
                    <p style="color: #93c5fd; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 8px;">Your Projected Annual Impact</p>
                    <p class="impact-number" style="color: #ffffff; font-size: 42px; font-weight: 800; margin: 0; letter-spacing: -1px;">{{totalAnnualImpact}}</p>
                    <p style="color: #bfdbfe; font-size: 13px; margin: 8px 0 0;">per year in combined revenue growth, savings & efficiency gains</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- YOUR INPUTS -->
          <tr>
            <td style="padding: 0 32px 28px;">
              <h2 style="color: #1e3a5f; font-size: 18px; margin: 0 0 8px;">📋 Your Business Data — Please Verify</h2>
              <p style="color: #64748b; font-size: 13px; line-height: 1.6; margin: 0 0 16px;">Accuracy matters. Every projection below is built on these inputs.</p>
              {{businessDataTable}}
            </td>
          </tr>
          <!-- COACHING -->
          <tr>
            <td style="padding: 0 32px 28px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; overflow: hidden;">
                <tr><td style="padding: 24px;">
                  <h3 style="color: #92400e; font-size: 16px; margin: 0 0 12px;">💡 A Note on Timing & Competitive Advantage</h3>
                  <p style="color: #78350f; font-size: 13px; line-height: 1.8; margin: 0 0 10px;">
                    Every month without automation, your business absorbs <strong>{{monthlyOpCost}}</strong> in avoidable operational costs. Every month without conversion optimisation, you're leaving approximately <strong>{{monthlyRevLift}}</strong> on the table.
                  </p>
                  <p style="color: #78350f; font-size: 13px; line-height: 1.8; margin: 0 0 10px;">
                    Your competitors are already adopting AI-driven customer engagement. The businesses that move first don't just gain efficiency — they <strong>capture market share</strong>.
                  </p>
                  <p style="color: #78350f; font-size: 13px; line-height: 1.8; margin: 0;">
                    This isn't about buying software. It's about making a strategic investment in your business's future competitiveness and profitability.
                  </p>
                </td></tr>
              </table>
            </td>
          </tr>
          <!-- ROI BREAKDOWN -->
          <tr>
            <td style="padding: 0 32px 28px;">
              <h2 style="color: #1e3a5f; font-size: 18px; margin: 0 0 16px;">📊 How We Calculated Your ROI</h2>
              {{roiBreakdownCards}}
            </td>
          </tr>
          <!-- INVESTMENT -->
          {{investmentSection}}
          <!-- STRAIGHT TALK CTA -->
          {{deepDiveSection}}
          <!-- CLOSING -->
          <tr>
            <td style="padding: 0 32px 32px;">
              <h2 style="color: #1e3a5f; font-size: 18px; margin: 0 0 12px;">🚀 Our Recommendation</h2>
              <p style="color: #334155; font-size: 14px; line-height: 1.8; margin: 0 0 14px;">
                {{contactName}}, the data is clear: <strong>{{businessName}}</strong> has significant untapped potential.
              </p>
              <p style="color: #334155; font-size: 14px; line-height: 1.8; margin: 0 0 14px;">
                A custom app isn't an expense — it's an <strong>investment that pays for itself in {{breakEvenMonths}} months</strong> and continues generating returns year after year.
              </p>
              <p style="color: #334155; font-size: 14px; line-height: 1.8; margin: 0 0 14px;">
                <strong>The cost of inaction is real:</strong> every month of delay represents approximately <strong>{{monthlyImpact}}</strong> in unrealised value.
              </p>
              {{closingSection}}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="color: #1e3a5f; font-size: 14px; font-weight: 700; margin: 0 0 4px;">You're not buying tech. You're buying profit.</p>
              <p style="color: #94a3b8; font-size: 12px; margin: 0;">This report was generated by 5to10X — Strategic App ROI Assessment</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  // Apply replacements
  for (const [key, val] of Object.entries(r)) {
    html = html.replaceAll(key, val);
  }
  return html;
}
