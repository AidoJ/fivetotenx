import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FROM = '5to10X <grow@5to10x.app>';
const APP_URL = 'https://5to10x.app';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { assessment_id } = await req.json();
    if (!assessment_id) {
      return new Response(JSON.stringify({ error: 'assessment_id required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    const { data: a, error } = await supabase
      .from('roi_assessments').select('*').eq('id', assessment_id).single();
    if (error || !a) throw new Error('Assessment not found');
    if (!a.contact_email) throw new Error('No email on draft');

    const name = (a.contact_name || '').trim().split(/\s+/)[0] || 'there';
    const business = a.business_name || 'your business';
    const resumeUrl = `${APP_URL}/discover-efficiency?resume=${a.id}`;

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY not configured');

    const subject = `Pick up where you left off — your Reality Check™ for ${business}`;
    const body = `Hi ${name},

You started your Reality Check™ for ${business} but didn't quite finish — no worries, your answers are saved.

Click below to jump back in exactly where you left off (takes about 2 minutes to complete):

👉 ${resumeUrl}

Once complete, you'll get your full ROI snapshot showing where automation could unlock hidden efficiency in your business.

– Aidan
5to10x`;

    const html = `<!doctype html><html><body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px;">
        <tr><td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:12px;padding:32px;border:1px solid #e2e8f0;">
            <tr><td style="color:#334155;line-height:1.6;">
              <p>Hi ${name},</p>
              <p>You started your <strong>Reality Check™</strong> for <strong>${business}</strong> but didn't quite finish — no worries, your answers are saved.</p>
              <p>Click below to jump back in exactly where you left off (takes about 2 minutes to complete):</p>
              <p style="text-align:center;margin:28px 0;">
                <a href="${resumeUrl}" style="display:inline-block;background:#2258B4;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;">Resume my Reality Check</a>
              </p>
              <p>Once complete, you'll get your full ROI snapshot showing where automation could unlock hidden efficiency in your business.</p>
              <p style="margin-top:24px;">– Aidan<br/>5to10x</p>
            </td></tr>
          </table>
        </td></tr>
      </table>
    </body></html>`;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: FROM,
        to: [a.contact_email],
        subject,
        html,
        text: body,
        reply_to: 'aidan@5to10x.app',
      }),
    });
    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Resend error: ${errBody}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('send-resume-prompt error', e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
