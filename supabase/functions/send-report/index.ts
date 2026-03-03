import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { contactName, contactEmail, businessName, results, zoomLink, formData } = await req.json();

    if (!contactEmail || !contactName) {
      return new Response(JSON.stringify({ error: 'Name and email are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured');
    }

    const formatCurrency = (value: number) =>
      new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);

    const formatPercent = (value: number) => `${value.toFixed(1)}%`;

    const row = (label: string, value: string) => `
      <tr>
        <td style="padding: 8px 12px; color: #64748b; font-size: 13px; border-bottom: 1px solid #f1f5f9;">${label}</td>
        <td style="padding: 8px 12px; color: #1e3a5f; font-size: 13px; font-weight: 600; text-align: right; border-bottom: 1px solid #f1f5f9;">${value}</td>
      </tr>`;

    const sectionHeader = (title: string, emoji: string) => `
      <tr>
        <td colspan="2" style="padding: 16px 12px 8px; font-size: 14px; font-weight: 700; color: #1e3a5f; border-bottom: 2px solid #e2e8f0;">
          ${emoji} ${title}
        </td>
      </tr>`;

    // Build input details section
    const lostReasons = formData?.lostSalesReasons?.length > 0
      ? formData.lostSalesReasons.join(', ')
      : 'None selected';
    const currentFeatures = formData?.currentFeatures?.length > 0
      ? formData.currentFeatures.join(', ')
      : 'None selected';

    const inputDetailsHtml = formData ? `
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        ${sectionHeader('Business Snapshot', '🏢')}
        ${row('Business Name', formData.businessName || '—')}
        ${row('Industry', formData.industry || '—')}
        ${row('Number of Staff', formData.numberOfStaff || '—')}
        ${row('Monthly Revenue', formData.monthlyRevenue || '—')}
        ${row('Avg Transaction Value', formData.avgTransactionValue ? `$${formData.avgTransactionValue}` : '—')}

        ${sectionHeader('Customer Metrics', '👥')}
        ${row('Monthly Website Visitors', formData.monthlyVisitors || '—')}
        ${row('Monthly Leads', formData.monthlyLeads || '—')}
        ${row('Conversion Rate', formData.conversionRate ? `${formData.conversionRate}%` : '—')}
        ${row('Monthly New Customers', formData.monthlyNewCustomers || '—')}
        ${row('Avg Purchase Value', formData.avgPurchaseValue ? `$${formData.avgPurchaseValue}` : '—')}
        ${row('Avg Purchases / Year', formData.avgPurchasesPerYear || '—')}
        ${row('Avg Retention Years', formData.avgRetentionYears || '—')}

        ${sectionHeader('Operational Hours (Weekly)', '⏱️')}
        ${row('Admin Tasks', formData.hoursAdmin ? `${formData.hoursAdmin} hrs` : '—')}
        ${row('Booking & Scheduling', formData.hoursBooking ? `${formData.hoursBooking} hrs` : '—')}
        ${row('Follow-ups', formData.hoursFollowUps ? `${formData.hoursFollowUps} hrs` : '—')}
        ${row('Invoicing', formData.hoursInvoicing ? `${formData.hoursInvoicing} hrs` : '—')}
        ${row('Hourly Staff Cost', formData.hourlyStaffCost ? `$${formData.hourlyStaffCost}/hr` : '—')}

        ${sectionHeader('Growth Context', '📈')}
        ${row('Lost Sales Reasons', lostReasons)}
        ${row('Current Features', currentFeatures)}
      </table>
    ` : '';

    // Calculation methodology
    const methodologyHtml = `
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        ${sectionHeader('How We Calculated Your ROI', '🔍')}
        <tr>
          <td colspan="2" style="padding: 12px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding: 8px 12px; vertical-align: top;">
                  <p style="color: #1e3a5f; font-size: 13px; font-weight: 600; margin: 0 0 4px;">Revenue Lift</p>
                  <p style="color: #64748b; font-size: 12px; line-height: 1.5; margin: 0;">15% conversion rate improvement applied to your current ${formData?.monthlyVisitors || '0'} monthly visitors × $${formData?.avgTransactionValue || formData?.avgPurchaseValue || '0'} avg sale</p>
                  <p style="color: #2563eb; font-size: 13px; font-weight: 700; margin: 4px 0 0;">${formatCurrency(results.revenueLift)} / year</p>
                </td>
              </tr>
              <tr><td style="height: 8px; border-bottom: 1px solid #f1f5f9;"></td></tr>
              <tr>
                <td style="padding: 8px 12px; vertical-align: top;">
                  <p style="color: #1e3a5f; font-size: 13px; font-weight: 600; margin: 0 0 4px;">Operational Savings</p>
                  <p style="color: #64748b; font-size: 12px; line-height: 1.5; margin: 0;">40% reduction of ${results.weeklyAdminHours} weekly admin hours × $${formData?.hourlyStaffCost || '0'}/hr × 52 weeks</p>
                  <p style="color: #2563eb; font-size: 13px; font-weight: 700; margin: 4px 0 0;">${formatCurrency(results.operationalSavings)} / year</p>
                </td>
              </tr>
              <tr><td style="height: 8px; border-bottom: 1px solid #f1f5f9;"></td></tr>
              <tr>
                <td style="padding: 8px 12px; vertical-align: top;">
                  <p style="color: #1e3a5f; font-size: 13px; font-weight: 600; margin: 0 0 4px;">Retention Improvement</p>
                  <p style="color: #64748b; font-size: 12px; line-height: 1.5; margin: 0;">10% retention uplift on ${results.activeCustomers} annual customers × ${formatCurrency(results.clv)} CLV</p>
                  <p style="color: #2563eb; font-size: 13px; font-weight: 700; margin: 4px 0 0;">${formatCurrency(results.retentionImprovement)} / year</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `;

    const zoomSection = zoomLink
      ? `
        <tr>
          <td style="padding: 24px 32px; background: #1e3a5f; border-radius: 12px; text-align: center;">
            <p style="color: #ffffff; font-size: 16px; font-weight: 600; margin: 0 0 8px;">🎥 You're Invited: App Building Training Session</p>
            <p style="color: #b0c4de; font-size: 14px; margin: 0 0 16px;">Join us to explore how a custom app can transform your business.</p>
            <a href="${zoomLink}" style="display: inline-block; padding: 12px 32px; background: #3b82f6; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">Join Zoom Session</a>
          </td>
        </tr>
        <tr><td style="height: 24px;"></td></tr>
      `
      : '';

    const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin: 0; padding: 0; background: #f0f4f8; font-family: 'Segoe UI', Arial, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background: #f0f4f8; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(30,58,95,0.08);">
              
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #1e3a5f, #2563eb); padding: 32px; text-align: center;">
                  <h1 style="color: #ffffff; font-size: 24px; margin: 0;">📊 Your App ROI Report</h1>
                  <p style="color: #b0c4de; font-size: 14px; margin: 8px 0 0;">Prepared for ${businessName || 'Your Business'}</p>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding: 32px;">
                  <p style="color: #1e3a5f; font-size: 16px; margin: 0 0 8px;">Hi ${contactName},</p>
                  <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">Thank you for completing your App ROI Assessment. Below you'll find your complete input data followed by our ROI projections, so you can verify every number behind the calculations.</p>

                  <!-- Total Impact Hero -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                    <tr>
                      <td style="background: linear-gradient(135deg, #1e3a5f, #2563eb); padding: 24px; border-radius: 12px; text-align: center;">
                        <p style="color: #b0c4de; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px;">Total Potential Annual Impact</p>
                        <p style="color: #ffffff; font-size: 36px; font-weight: 800; margin: 0;">${formatCurrency(results.totalAnnualImpact)}</p>
                      </td>
                    </tr>
                  </table>

                  <!-- YOUR INPUTS -->
                  <h2 style="color: #1e3a5f; font-size: 18px; margin: 0 0 16px; padding-bottom: 8px; border-bottom: 2px solid #2563eb;">📋 Your Inputs</h2>
                  <p style="color: #64748b; font-size: 13px; margin: 0 0 16px;">Please review the data below to ensure accuracy. If anything looks off, the ROI projections can be recalculated.</p>
                  ${inputDetailsHtml}

                  <!-- ROI METHODOLOGY -->
                  <h2 style="color: #1e3a5f; font-size: 18px; margin: 0 0 16px; padding-bottom: 8px; border-bottom: 2px solid #2563eb;">📊 ROI Breakdown</h2>
                  ${methodologyHtml}

                  <!-- Summary Stats -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                    <tr>
                      <td style="padding: 16px; background: #f0f4f8; border-radius: 8px; text-align: center; width: 33%;">
                        <p style="color: #64748b; font-size: 11px; margin: 0 0 4px;">Revenue Lift</p>
                        <p style="color: #1e3a5f; font-size: 18px; font-weight: 700; margin: 0;">${formatCurrency(results.revenueLift)}</p>
                      </td>
                      <td style="width: 8px;"></td>
                      <td style="padding: 16px; background: #f0f4f8; border-radius: 8px; text-align: center; width: 33%;">
                        <p style="color: #64748b; font-size: 11px; margin: 0 0 4px;">Op. Savings</p>
                        <p style="color: #1e3a5f; font-size: 18px; font-weight: 700; margin: 0;">${formatCurrency(results.operationalSavings)}</p>
                      </td>
                      <td style="width: 8px;"></td>
                      <td style="padding: 16px; background: #f0f4f8; border-radius: 8px; text-align: center; width: 33%;">
                        <p style="color: #64748b; font-size: 11px; margin: 0 0 4px;">Retention</p>
                        <p style="color: #1e3a5f; font-size: 18px; font-weight: 700; margin: 0;">${formatCurrency(results.retentionImprovement)}</p>
                      </td>
                    </tr>
                  </table>

                  <!-- ROI Stats -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                    <tr>
                      <td style="padding: 16px; background: #f0f4f8; border-radius: 8px; text-align: center; width: 33%;">
                        <p style="color: #64748b; font-size: 11px; margin: 0 0 4px;">Build Cost</p>
                        <p style="color: #1e3a5f; font-size: 16px; font-weight: 700; margin: 0;">${formatCurrency(results.buildCost || 18000)}</p>
                      </td>
                      <td style="width: 8px;"></td>
                      <td style="padding: 16px; background: #f0f4f8; border-radius: 8px; text-align: center; width: 33%;">
                        <p style="color: #64748b; font-size: 11px; margin: 0 0 4px;">Year 1 ROI</p>
                        <p style="color: #2563eb; font-size: 16px; font-weight: 700; margin: 0;">${results.roiPercentage.toFixed(0)}%</p>
                      </td>
                      <td style="width: 8px;"></td>
                      <td style="padding: 16px; background: #f0f4f8; border-radius: 8px; text-align: center; width: 33%;">
                        <p style="color: #64748b; font-size: 11px; margin: 0 0 4px;">Break-even</p>
                        <p style="color: #2563eb; font-size: 16px; font-weight: 700; margin: 0;">${results.breakEvenMonths.toFixed(1)} mo</p>
                      </td>
                    </tr>
                  </table>

                  <!-- Zoom Invite -->
                  ${zoomSection}

                  <!-- Footer -->
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="text-align: center; padding-top: 16px; border-top: 1px solid #e2e8f0;">
                        <p style="color: #94a3b8; font-size: 12px; margin: 0;">You're not buying tech. You're buying profit.</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    `;

    // Send email via Resend
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'App ROI Report <onboarding@resend.dev>',
        to: [contactEmail],
        subject: `Your App ROI Report – ${businessName || 'Your Business'}`,
        html: emailHtml,
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error('Resend API error:', resendData);
      throw new Error(`Email sending failed: ${JSON.stringify(resendData)}`);
    }

    console.log('Email sent successfully:', resendData);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Report emailed successfully',
      emailId: resendData.id,
    }), {
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
