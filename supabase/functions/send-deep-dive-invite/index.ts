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
    const { contactName, contactEmail, businessName, assessmentId } = await req.json();

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY is not configured');

    const deepDiveUrl = `https://fivetotenx.lovable.app/deep-dive?id=${assessmentId}`;

    const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin: 0; padding: 0; background: #f8fafc; font-family: Georgia, 'Times New Roman', serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background: #f8fafc; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(30,58,95,0.06);">
              <tr>
                <td style="background: linear-gradient(135deg, #1e3a5f, #4338ca); padding: 36px 32px; text-align: center;">
                  <p style="color: #93c5fd; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 8px;">You're Qualified</p>
                  <h1 style="color: #ffffff; font-size: 24px; margin: 0; font-weight: 700;">Your Custom App Awaits, ${contactName}</h1>
                </td>
              </tr>
              <tr>
                <td style="padding: 32px;">
                  <p style="color: #334155; font-size: 15px; line-height: 1.8; margin: 0 0 16px;">
                    Based on your ROI assessment, <strong>${businessName || 'your business'}</strong> qualifies for a custom app build. The next step is a quick 5-minute questionnaire so we can scope the perfect solution.
                  </p>
                  <p style="color: #334155; font-size: 15px; line-height: 1.8; margin: 0 0 24px;">
                    This helps us understand your current tools, goals, timeline, and technical requirements — so your proposal is tailored exactly to your needs.
                  </p>
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center">
                        <a href="${deepDiveUrl}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #1e3a5f, #4338ca); color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 16px;">
                          Start Deep Dive Questionnaire →
                        </a>
                      </td>
                    </tr>
                  </table>
                  <p style="color: #64748b; font-size: 12px; margin: 24px 0 0; text-align: center;">
                    Or copy this link: ${deepDiveUrl}
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
        to: [contactEmail],
        subject: `${contactName}, your custom app proposal starts here — complete the Deep Dive`,
        html: emailHtml,
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(`Resend error: ${JSON.stringify(data)}`);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
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
