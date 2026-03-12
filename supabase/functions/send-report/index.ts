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
    const { contactName, contactEmail, businessName, results, formData, assessmentId, isQualified } = await req.json();

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

    const fmt = (v: number) =>
      new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);

    const businessTypeLabel = formData?.businessType === 'hybrid' ? 'Hybrid (Service + Product)' : formData?.businessType === 'product' ? 'Product-Based' : 'Service-Based';

    const isService = formData?.businessType === 'service' || formData?.businessType === 'hybrid';
    const isProduct = formData?.businessType === 'product' || formData?.businessType === 'hybrid';

    const row = (label: string, value: string) => `
      <tr>
        <td style="padding: 10px 16px; color: #64748b; font-size: 13px; border-bottom: 1px solid #f1f5f9;">${label}</td>
        <td style="padding: 10px 16px; color: #1e293b; font-size: 13px; font-weight: 600; text-align: right; border-bottom: 1px solid #f1f5f9;">${value}</td>
      </tr>`;

    const sectionHead = (title: string) => `
      <tr>
        <td colspan="2" style="padding: 18px 16px 10px; font-size: 13px; font-weight: 700; color: #1e3a5f; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #dbeafe;">
          ${title}
        </td>
      </tr>`;

    const lostReasons = formData?.lostSalesReasons?.length > 0 ? formData.lostSalesReasons.join(', ') : 'None identified';
    const currentFeatures = formData?.currentFeatures?.length > 0 ? formData.currentFeatures.join(', ') : 'None currently';

    const pricing = results?.pricing;
    const isViable = pricing?.isViable !== false;

    let paymentPlansHtml = '';
    if (isViable && pricing?.plans?.length > 0) {
      const planRows = pricing.plans.map((plan: { label: string; deposit: number; monthlyAmount: number; totalCost: number; includesMaintenance: boolean; description: string }) => `
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
      
      paymentPlansHtml = `
        <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; margin-top: 12px;">
          ${planRows}
        </table>
      `;
    }

    // Zoom section removed — no longer used

    // Deep Dive CTA for qualified leads
    const deepDiveBaseUrl = 'https://5to10x.app';
    const deepDiveSection = (isQualified && assessmentId)
      ? `
        <tr>
          <td style="padding: 0 32px 28px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1e3a5f, #4338ca); border-radius: 12px; overflow: hidden;">
              <tr>
                <td style="padding: 32px; text-align: center;">
                  <p style="color: #93c5fd; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 8px;">✨ YOU QUALIFY FOR A CUSTOM BUILD</p>
                  <h2 style="color: #ffffff; font-size: 22px; font-weight: 700; margin: 0 0 12px;">Ready for the Next Step?</h2>
                  <p style="color: #bfdbfe; font-size: 14px; line-height: 1.7; margin: 0 0 20px; max-width: 480px; margin-left: auto; margin-right: auto;">
                    Your business qualifies for a custom app build. Complete our 5-minute Deep Dive questionnaire so we can scope the perfect solution for ${businessName || 'your business'}.
                  </p>
                  <a href="${deepDiveBaseUrl}/deep-dive?id=${assessmentId}" style="display: inline-block; padding: 14px 36px; background: #ffffff; color: #1e3a5f; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 15px;">
                    Start Deep Dive →
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      `
      : '';

    const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin: 0; padding: 0; background: #f8fafc; font-family: Georgia, 'Times New Roman', serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background: #f8fafc; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="640" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(30,58,95,0.06);">
              
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #1e3a5f, #1e40af); padding: 40px 32px; text-align: center;">
                  <p style="color: #93c5fd; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 8px;">Strategic Growth Assessment</p>
                  <h1 style="color: #ffffff; font-size: 26px; margin: 0; font-weight: 700;">Digital Transformation ROI Report</h1>
                  <p style="color: #bfdbfe; font-size: 15px; margin: 12px 0 0;">Prepared exclusively for ${businessName || 'Your Business'}</p>
                </td>
              </tr>

              <!-- Opening Letter -->
              <tr>
                <td style="padding: 36px 32px 0;">
                  <p style="color: #1e293b; font-size: 16px; line-height: 1.7; margin: 0 0 16px;">Dear ${contactName},</p>
                  
                  <p style="color: #334155; font-size: 14px; line-height: 1.8; margin: 0 0 14px;">
                    Thank you for investing the time to complete this assessment. What follows isn't just a set of numbers — it's a strategic roadmap for how <strong>${businessName || 'your business'}</strong> can leverage modern technology to unlock measurable growth.
                  </p>

                  <p style="color: #334155; font-size: 14px; line-height: 1.8; margin: 0 0 14px;">
                    The business landscape is shifting rapidly. Companies that adopt AI-powered tools, automation, and custom digital solutions aren't just keeping up — they're <strong>pulling ahead</strong>. According to recent industry research, businesses that embrace digital transformation see an average 20–30% improvement in operational efficiency and customer retention within the first year.
                  </p>

                  <p style="color: #334155; font-size: 14px; line-height: 1.8; margin: 0 0 14px;">
                    The question is no longer <em>"Should we invest in technology?"</em> — it's <em>"How much are we losing by waiting?"</em>
                  </p>

                  <p style="color: #334155; font-size: 14px; line-height: 1.8; margin: 0 0 24px;">
                    Based on the data you provided, here's what a custom-built app could deliver for your ${businessTypeLabel.toLowerCase()} business. We've included every input you gave us so you can verify the foundations of these projections.
                  </p>
                </td>
              </tr>

              <!-- TOTAL IMPACT HERO -->
              <tr>
                <td style="padding: 0 32px 32px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="background: linear-gradient(135deg, #1e3a5f, #1e40af); padding: 28px; border-radius: 12px; text-align: center;">
                        <p style="color: #93c5fd; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 8px;">Your Projected Annual Impact</p>
                        <p style="color: #ffffff; font-size: 42px; font-weight: 800; margin: 0; letter-spacing: -1px;">${fmt(results.totalAnnualImpact)}</p>
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
                  <p style="color: #64748b; font-size: 13px; line-height: 1.6; margin: 0 0 16px;">
                    Accuracy matters. Every projection below is built on these inputs. If anything looks incorrect, let us know and we'll recalculate immediately.
                  </p>

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
                  </table>
                </td>
              </tr>

              <!-- COACHING SECTION -->
              <tr>
                <td style="padding: 0 32px 28px;">
                  <table width="100%" cellpadding="0" cellspacing="0" style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; overflow: hidden;">
                    <tr>
                      <td style="padding: 24px;">
                        <h3 style="color: #92400e; font-size: 16px; margin: 0 0 12px;">💡 A Note on Timing & Competitive Advantage</h3>
                        <p style="color: #78350f; font-size: 13px; line-height: 1.8; margin: 0 0 10px;">
                          Every month without automation, your business absorbs <strong>${fmt((results.operationalSavings || 0) / 12)}</strong> in avoidable operational costs. Every month without conversion optimisation, you're leaving approximately <strong>${fmt((results.revenueLift || 0) / 12)}</strong> on the table.
                        </p>
                        <p style="color: #78350f; font-size: 13px; line-height: 1.8; margin: 0 0 10px;">
                          Your competitors are already adopting AI-driven customer engagement, automated scheduling, and intelligent upsell systems. The businesses that move first don't just gain efficiency — they <strong>capture market share</strong> from those who wait.
                        </p>
                        <p style="color: #78350f; font-size: 13px; line-height: 1.8; margin: 0;">
                          This isn't about buying software. It's about making a strategic investment in your business's future competitiveness and profitability.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- ROI BREAKDOWN -->
              <tr>
                <td style="padding: 0 32px 28px;">
                  <h2 style="color: #1e3a5f; font-size: 18px; margin: 0 0 16px;">📊 How We Calculated Your ROI</h2>

                  <!-- Revenue Lift -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background: #f0f9ff; border-radius: 8px; margin-bottom: 12px;">
                    <tr>
                      <td style="padding: 16px;">
                        <p style="color: #1e3a5f; font-size: 14px; font-weight: 700; margin: 0 0 6px;">📈 Revenue Lift — ${fmt(results.revenueLift)}/year</p>
                        <p style="color: #475569; font-size: 13px; line-height: 1.7; margin: 0;">
                          Your current conversion rate of ${results.currentConversion?.toFixed(1) || '0'}% means you're converting ${formData?.monthlyVisitors || '0'} visitors into ${fmt(results.currentMonthlyRevenue || 0)}/mo. With a custom app delivering a 15% conversion improvement (to ${results.newConversion?.toFixed(2) || '0'}%), your monthly revenue rises to ${fmt(results.newMonthlyRevenue || 0)} — that's an extra <strong>${fmt((results.revenueLift || 0) / 12)}/mo</strong>.
                        </p>
                      </td>
                    </tr>
                  </table>

                  <!-- Operational Savings -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background: #f0fdf4; border-radius: 8px; margin-bottom: 12px;">
                    <tr>
                      <td style="padding: 16px;">
                        <p style="color: #14532d; font-size: 14px; font-weight: 700; margin: 0 0 6px;">⏱️ Operational Savings — ${fmt(results.operationalSavings)}/year</p>
                        <p style="color: #475569; font-size: 13px; line-height: 1.7; margin: 0;">
                          Your team currently spends ${results.weeklyAdminHours || 0} hours/week on manual admin, booking, follow-ups, and invoicing at $${formData?.hourlyStaffCost || '0'}/hr. App automation typically removes 40% of this workload — freeing up <strong>${results.weeklySavingsHours?.toFixed(1) || '0'} hours every week</strong> for revenue-generating activities.
                        </p>
                      </td>
                    </tr>
                  </table>

                  <!-- Retention -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background: #fdf4ff; border-radius: 8px; margin-bottom: 12px;">
                    <tr>
                      <td style="padding: 16px;">
                        <p style="color: #581c87; font-size: 14px; font-weight: 700; margin: 0 0 6px;">👥 Customer Retention — ${fmt(results.retentionImprovement)}/year</p>
                        <p style="color: #475569; font-size: 13px; line-height: 1.7; margin: 0;">
                          With ${results.activeCustomers || 0} customers per year and a CLV of ${fmt(results.clv || 0)}, even a conservative 10% retention improvement — through push notifications, loyalty features, and personalised engagement — adds significant value.
                        </p>
                      </td>
                    </tr>
                  </table>

                  ${results.noShowRecovery > 0 ? `
                  <table width="100%" cellpadding="0" cellspacing="0" style="background: #fef2f2; border-radius: 8px; margin-bottom: 12px;">
                    <tr>
                      <td style="padding: 16px;">
                        <p style="color: #7f1d1d; font-size: 14px; font-weight: 700; margin: 0 0 6px;">🛡️ No-Show Recovery — ${fmt(results.noShowRecovery)}/year</p>
                        <p style="color: #475569; font-size: 13px; line-height: 1.7; margin: 0;">
                          With a ${formData?.noShowRate || '0'}% no-show rate, you're currently losing revenue on missed appointments. Automated reminders, easy rescheduling, and deposit integration typically recover 50% of no-shows — putting that money back in your pocket.
                        </p>
                      </td>
                    </tr>
                  </table>
                  ` : ''}

                  ${results.upsellLift > 0 ? `
                  <table width="100%" cellpadding="0" cellspacing="0" style="background: #fffbeb; border-radius: 8px; margin-bottom: 12px;">
                    <tr>
                      <td style="padding: 16px;">
                        <p style="color: #78350f; font-size: 14px; font-weight: 700; margin: 0 0 6px;">🛒 Upsell & Cross-sell Lift — ${fmt(results.upsellLift)}/year</p>
                        <p style="color: #475569; font-size: 13px; line-height: 1.7; margin: 0;">
                          Currently ${formData?.upsellRevenuePercent || '0'}% of your revenue comes from add-on products. Smart in-app recommendations — powered by customer behaviour data and AI — can lift this by 15%, turning every transaction into a higher-value interaction.
                        </p>
                      </td>
                    </tr>
                  </table>
                  ` : ''}

                  ${results.marketingEfficiency > 0 ? `
                  <table width="100%" cellpadding="0" cellspacing="0" style="background: #f0f9ff; border-radius: 8px; margin-bottom: 12px;">
                    <tr>
                      <td style="padding: 16px;">
                        <p style="color: #1e3a5f; font-size: 14px; font-weight: 700; margin: 0 0 6px;">📣 Marketing Efficiency — ${fmt(results.marketingEfficiency)}/year</p>
                        <p style="color: #475569; font-size: 13px; line-height: 1.7; margin: 0;">
                          You're spending $${formData?.monthlyMarketingSpend || '0'}/mo on marketing with a customer acquisition cost of $${formData?.customerAcquisitionCost || '0'}. Better in-app conversion reduces your effective CAC, saving approximately 20% of marketing spend while acquiring the same number of customers.
                        </p>
                      </td>
                    </tr>
                  </table>
                  ` : ''}
                </td>
              </tr>

              <!-- INVESTMENT & PAYMENT OPTIONS -->
              ${isViable ? `
              <tr>
                <td style="padding: 0 32px 28px;">
                  <h2 style="color: #1e3a5f; font-size: 18px; margin: 0 0 8px;">💰 Your Investment & Payment Options</h2>
                  <p style="color: #64748b; font-size: 13px; line-height: 1.6; margin: 0 0 6px;">
                    Based on your projected ${fmt(results.totalAnnualImpact)}/year impact, your app falls in our <strong>${pricing?.tierLabel || ''}</strong> tier.
                  </p>

                  <table width="100%" cellpadding="0" cellspacing="0" style="margin: 16px 0;">
                    <tr>
                      <td style="padding: 16px; background: #f0f9ff; border-radius: 8px; text-align: center; width: 33%;">
                        <p style="color: #64748b; font-size: 11px; margin: 0 0 4px;">Build Investment</p>
                        <p style="color: #1e3a5f; font-size: 20px; font-weight: 700; margin: 0;">${fmt(pricing?.buildCost || 0)}</p>
                      </td>
                      <td style="width: 8px;"></td>
                      <td style="padding: 16px; background: #f0fdf4; border-radius: 8px; text-align: center; width: 33%;">
                        <p style="color: #64748b; font-size: 11px; margin: 0 0 4px;">Break-even</p>
                        <p style="color: #16a34a; font-size: 20px; font-weight: 700; margin: 0;">${results.breakEvenMonths?.toFixed(1) || '0'} months</p>
                      </td>
                      <td style="width: 8px;"></td>
                      <td style="padding: 16px; background: #fdf4ff; border-radius: 8px; text-align: center; width: 33%;">
                        <p style="color: #64748b; font-size: 11px; margin: 0 0 4px;">Year 1 ROI</p>
                        <p style="color: #7c3aed; font-size: 20px; font-weight: 700; margin: 0;">${results.roiPercentage?.toFixed(0) || '0'}%</p>
                      </td>
                    </tr>
                  </table>

                  <p style="color: #1e3a5f; font-size: 14px; font-weight: 600; margin: 16px 0 8px;">Choose a Payment Plan:</p>
                  ${paymentPlansHtml}

                  ${pricing?.annualMaintenance > 0 ? `
                  <p style="color: #64748b; font-size: 12px; margin: 12px 0 0;">
                    * Annual maintenance (updates, monitoring, support): ${fmt(pricing.annualMaintenance)}/year — included in subscription plans, optional add-on for upfront plans.
                  </p>
                  ` : ''}
                </td>
              </tr>
              ` : `
              <tr>
                <td style="padding: 0 32px 28px;">
                  <table width="100%" cellpadding="0" cellspacing="0" style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px;">
                    <tr>
                      <td style="padding: 24px;">
                        <h3 style="color: #991b1b; font-size: 16px; margin: 0 0 8px;">⚠️ Viability Assessment</h3>
                        <p style="color: #7f1d1d; font-size: 13px; line-height: 1.7; margin: 0;">
                          Based on current figures, the projected annual impact of ${fmt(results.totalAnnualImpact)} may not justify a custom app build at this stage. We'd recommend focusing on growing your customer base and revenue first, then revisiting this assessment. We're here to help when the time is right.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              `}

              <!-- Deep Dive CTA -->
              ${deepDiveSection}


              <!-- Deep Dive CTA -->
              ${deepDiveSection}

              <!-- CLOSING -->
              <tr>
                <td style="padding: 0 32px 32px;">
                  <h2 style="color: #1e3a5f; font-size: 18px; margin: 0 0 12px;">🚀 Our Recommendation</h2>
                  <p style="color: #334155; font-size: 14px; line-height: 1.8; margin: 0 0 14px;">
                    ${contactName}, the data is clear: <strong>${businessName || 'your business'}</strong> has significant untapped potential. The businesses that thrive in the next 5 years won't be the ones with the best products alone — they'll be the ones that deliver the best <em>experience</em>, powered by smart technology.
                  </p>
                  <p style="color: #334155; font-size: 14px; line-height: 1.8; margin: 0 0 14px;">
                    A custom app isn't an expense — it's an <strong>investment that pays for itself in ${results.breakEvenMonths?.toFixed(1) || 'a few'} months</strong> and continues generating returns year after year. With AI-driven automation handling your repetitive tasks, intelligent customer engagement driving retention, and data-driven insights optimising every interaction, you're not just keeping up — you're setting the pace.
                  </p>
                  <p style="color: #334155; font-size: 14px; line-height: 1.8; margin: 0 0 14px;">
                    <strong>The cost of inaction is real:</strong> every month of delay represents approximately <strong>${fmt(results.totalAnnualImpact / 12)}</strong> in unrealised value. That's not a scare tactic — it's simply what the numbers show.
                  </p>
                  <p style="color: #334155; font-size: 14px; line-height: 1.8; margin: 0;">
                    We'd love to discuss how to bring this to life for ${businessName || 'your business'}. The next step is a brief strategy call to map out your app's features and timeline.
                  </p>
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
        from: '5to10X Growth Report <grow@5to10x.app>',
        to: [contactEmail],
        subject: `Strategic Growth Report – ${businessName || 'Your Business'} | App ROI Assessment`,
        html: emailHtml,
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error('Resend API error:', resendData);
      throw new Error(`Email sending failed: ${JSON.stringify(resendData)}`);
    }

    // If qualified, also notify admin
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
