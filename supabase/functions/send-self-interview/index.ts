import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { contactName, contactEmail, businessName, assessmentId } = await req.json();

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY is not configured');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const selfInterviewUrl = `https://5to10x.app/self-interview?id=${assessmentId}`;

    // Try to load template from DB
    const { data: template } = await supabase
      .from('email_templates')
      .select('*')
      .eq('template_key', 'self-interview-invite')
      .single();

    let emailHtml: string;
    let subject: string;
    let fromField: string;

    if (template) {
      emailHtml = template.html_body
        .replace(/\{\{contactName\}\}/g, contactName || '')
        .replace(/\{\{businessName\}\}/g, businessName || 'your business')
        .replace(/\{\{selfInterviewUrl\}\}/g, selfInterviewUrl);
      subject = template.subject
        .replace(/\{\{contactName\}\}/g, contactName || '')
        .replace(/\{\{businessName\}\}/g, businessName || 'your business');
      fromField = `${template.from_name} <${template.from_email}>`;
    } else {
      subject = `${contactName}, your Straight Talk™ Self-Interview is ready`;
      fromField = '5to10X <grow@5to10x.app>';
      emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #1a1a2e;">Hi ${contactName} 👋</h2>
          <p style="color: #444; line-height: 1.6;">
            Before our call, we'd love to hear from you in your own words. We've prepared a short self-interview where you can record audio answers to a few key questions about <strong>${businessName || 'your business'}</strong>.
          </p>
          <p style="color: #444; line-height: 1.6;">
            This takes about 10–15 minutes and helps us come to our meeting fully prepared with solutions rather than spending time gathering information.
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${selfInterviewUrl}" style="background: linear-gradient(135deg, #6c3fce, #8b5cf6); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
              Start Self-Interview →
            </a>
          </div>
          <p style="color: #888; font-size: 13px;">
            You can pause and come back anytime — your progress is saved automatically.
          </p>
          <p style="color: #444; line-height: 1.6;">
            Looking forward to working with you!<br/>
            — The 5to10X Team
          </p>
        </div>
      `;
    }

    const res = await fetch('https://api.resend.com/emails', {
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
