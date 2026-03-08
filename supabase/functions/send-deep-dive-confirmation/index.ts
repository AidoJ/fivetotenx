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
    const { contactName, contactEmail, businessName } = await req.json();

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY is not configured');

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
                  <p style="color: #93c5fd; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 8px;">Deep Dive Received</p>
                  <h1 style="color: #ffffff; font-size: 24px; margin: 0; font-weight: 700;">Thank You, ${contactName}!</h1>
                </td>
              </tr>
              <tr>
                <td style="padding: 32px;">
                  <p style="color: #334155; font-size: 15px; line-height: 1.8; margin: 0 0 16px;">
                    We've received your Deep Dive questionnaire for <strong>${businessName || 'your business'}</strong>. Our team is now reviewing your responses to craft a tailored proposal.
                  </p>
                  <p style="color: #334155; font-size: 15px; line-height: 1.8; margin: 0 0 16px;">
                    <strong>What happens next:</strong>
                  </p>
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 20px;">
                    <tr>
                      <td style="padding: 12px 16px; background: #f0f9ff; border-radius: 8px; margin-bottom: 8px;">
                        <p style="color: #1e3a5f; font-size: 14px; margin: 0;"><strong>1.</strong> We'll review your goals, requirements, and integrations</p>
                      </td>
                    </tr>
                    <tr><td style="height: 8px;"></td></tr>
                    <tr>
                      <td style="padding: 12px 16px; background: #f0fdf4; border-radius: 8px;">
                        <p style="color: #14532d; font-size: 14px; margin: 0;"><strong>2.</strong> We'll prepare a detailed scope & proposal document</p>
                      </td>
                    </tr>
                    <tr><td style="height: 8px;"></td></tr>
                    <tr>
                      <td style="padding: 12px 16px; background: #fdf4ff; border-radius: 8px;">
                        <p style="color: #581c87; font-size: 14px; margin: 0;"><strong>3.</strong> We'll reach out within 24–48 hours to schedule a strategy call</p>
                      </td>
                    </tr>
                  </table>
                  <p style="color: #64748b; font-size: 13px; line-height: 1.7; margin: 0;">
                    In the meantime, if you have any questions or additional details to share, simply reply to this email.
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
        subject: `We've received your Deep Dive — next steps for ${businessName || 'your project'}`,
        html: emailHtml,
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(`Resend error: ${JSON.stringify(data)}`);

    // Also notify admin about deep dive completion
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: '5to10X Pipeline <grow@5to10x.app>',
        to: ['grow@5to10x.app'],
        subject: `✅ Deep Dive Complete: ${contactName} – ${businessName || 'Unknown'}`,
        html: `<div style="font-family: sans-serif; padding: 20px;">
          <h2>✅ Deep Dive Submitted</h2>
          <p><strong>${contactName}</strong> from <strong>${businessName || 'Unknown'}</strong> has completed their Deep Dive questionnaire.</p>
          <p><a href="https://fivetotenx.lovable.app/admin">View in Pipeline →</a></p>
        </div>`,
      }),
    }).catch(e => console.error('Admin notify failed:', e));

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
