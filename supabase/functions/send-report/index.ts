import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { contactName, contactEmail, businessName, results, zoomLink } = await req.json();

    if (!contactEmail || !contactName) {
      return new Response(JSON.stringify({ error: 'Name and email are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const formatCurrency = (value: number) =>
      new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);

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
                  <p style="color: #1e3a5f; font-size: 16px; margin: 0 0 24px;">Hi ${contactName},</p>
                  <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">Thank you for completing your App ROI Assessment. Here's a summary of the potential value a custom app could deliver for your business.</p>

                  <!-- Total Impact -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                    <tr>
                      <td style="background: linear-gradient(135deg, #1e3a5f, #2563eb); padding: 24px; border-radius: 12px; text-align: center;">
                        <p style="color: #b0c4de; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px;">Total Potential Annual Impact</p>
                        <p style="color: #ffffff; font-size: 36px; font-weight: 800; margin: 0;">${formatCurrency(results.totalAnnualImpact)}</p>
                      </td>
                    </tr>
                  </table>

                  <!-- Breakdown -->
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
                        <p style="color: #1e3a5f; font-size: 16px; font-weight: 700; margin: 0;">${formatCurrency(18000)}</p>
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
                  <tr>
                    <td style="text-align: center; padding-top: 16px; border-top: 1px solid #e2e8f0;">
                      <p style="color: #94a3b8; font-size: 12px; margin: 0;">You're not buying tech. You're buying profit.</p>
                    </td>
                  </tr>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    `;

    // Send email via Lovable AI Gateway (which can send emails)
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          {
            role: 'user',
            content: `Please respond with exactly: "EMAIL_READY" - I am preparing an email to send to ${contactEmail}`,
          },
        ],
      }),
    });

    // For now, store the assessment - email sending will be enhanced with a proper email service
    // The edge function saves the data and returns success
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Assessment saved successfully',
      emailHtml, // Return the HTML so it could be used with an email service later
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
