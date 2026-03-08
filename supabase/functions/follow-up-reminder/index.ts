import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
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

    // Find qualified leads that haven't completed deep dive and were qualified > 48h ago
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

    const { data: staleLeads, error } = await supabase
      .from('roi_assessments')
      .select('id, contact_name, contact_email, business_name, qualified_at')
      .eq('pipeline_stage', 'qualified')
      .eq('is_qualified', true)
      .lt('qualified_at', cutoff);

    if (error) throw error;

    if (!staleLeads || staleLeads.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'No follow-ups needed', count: 0 }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let sent = 0;
    for (const lead of staleLeads) {
      const deepDiveUrl = `https://fivetotenx.lovable.app/deep-dive?id=${lead.id}`;

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
                  <td style="background: linear-gradient(135deg, #1e3a5f, #1e40af); padding: 32px; text-align: center;">
                    <h1 style="color: #ffffff; font-size: 22px; margin: 0; font-weight: 700;">Still Interested, ${lead.contact_name}?</h1>
                    <p style="color: #bfdbfe; font-size: 14px; margin: 10px 0 0;">Your custom app proposal is waiting</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 32px;">
                    <p style="color: #334155; font-size: 15px; line-height: 1.8; margin: 0 0 16px;">
                      A few days ago, your ROI assessment showed that <strong>${lead.business_name || 'your business'}</strong> could unlock significant growth with a custom app. You qualified for the next step — our Deep Dive questionnaire — but we noticed you haven't completed it yet.
                    </p>
                    <p style="color: #334155; font-size: 15px; line-height: 1.8; margin: 0 0 24px;">
                      It only takes 5 minutes and helps us build a proposal tailored exactly to your needs. No commitment — just clarity on what's possible.
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center">
                          <a href="${deepDiveUrl}" style="display: inline-block; padding: 14px 36px; background: linear-gradient(135deg, #1e3a5f, #4338ca); color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 15px;">
                            Complete Deep Dive →
                          </a>
                        </td>
                      </tr>
                    </table>
                    <p style="color: #64748b; font-size: 13px; margin: 20px 0 0; text-align: center;">
                      If you have questions or the timing isn't right, simply reply to this email. We're here to help.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px 32px; background: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
                    <p style="color: #94a3b8; font-size: 12px; margin: 0;">5to10X — Strategic App ROI Assessment</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>`;

      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: '5to10X <grow@5to10x.app>',
            to: [lead.contact_email],
            subject: `${lead.contact_name}, your custom app proposal is waiting — 5 min to complete`,
            html: emailHtml,
          }),
        });

        if (res.ok) {
          sent++;
          // Move to deep_dive_sent so we don't re-send
          await supabase
            .from('roi_assessments')
            .update({ pipeline_stage: 'deep_dive_sent', invite_sent: true })
            .eq('id', lead.id);
        }
      } catch (e) {
        console.error(`Failed to send follow-up to ${lead.contact_email}:`, e);
      }
    }

    return new Response(JSON.stringify({ success: true, count: sent }), {
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
